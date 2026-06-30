// functions/_shared/ai.js
//
// Single source of truth for "which AI models do we call." Every endpoint
// imports this, so fixing a retired/renamed model only ever needs to happen
// in ONE place. All keys come from Cloudflare's encrypted environment
// variables — never hardcoded here.
//
// Providers are tried in order below (free/cheap-friendly first). Each has
// its own model fallback list, so one retired model can't take a provider
// down, and one down provider can't take the whole chatbot down.
//
// NOT included, on purpose: Oxlo.ai and LongCat. Both exist, but I could not
// find a verified base URL + working request example for either (just
// marketing pages) — and guessing endpoints is exactly how the Gemini 1.5
// bug happened before. Send me their docs/a working curl example and I'll
// wire them up properly.

const PROVIDERS = [
  { key: 'GROQ_API_KEY',       name: 'groq',        kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'] },

  { key: 'TOGETHER_API_KEY',   name: 'together',    kind: 'openai',
    baseUrl: 'https://api.together.xyz/v1/chat/completions',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'] },

  { key: 'FIREWORKS_API_KEY',  name: 'fireworks',   kind: 'openai',
    baseUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    models: ['accounts/fireworks/models/llama-v3p1-8b-instruct', 'accounts/fireworks/models/llama-v3p1-70b-instruct'] },

  { key: 'OPENROUTER_API_KEY', name: 'openrouter',  kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['meta-llama/llama-3.3-70b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free'] },

  { key: 'HF_API_KEY',         name: 'huggingface', kind: 'openai',
    baseUrl: 'https://router.huggingface.co/v1/chat/completions',
    models: ['deepseek-ai/DeepSeek-R1:fastest', 'openai/gpt-oss-120b:cerebras'] },

  { key: 'BYTEZ_AI_KEY',       name: 'bytez',       kind: 'openai',
    baseUrl: 'https://api.bytez.com/models/v2/openai/v1/chat/completions',
    models: ['google/gemma-3-4b-it', 'openai/gpt-4o-mini'] },

  { key: 'GEMINI_API_KEY',     name: 'gemini',      kind: 'gemini',
    models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash'] },

  { key: 'PERPLEXITY_API_KEY', name: 'perplexity',  kind: 'openai',
    baseUrl: 'https://api.perplexity.ai/chat/completions',
    models: ['sonar', 'sonar-pro'] },

  { key: 'OPENAI_API_KEY',     name: 'openai',      kind: 'openai',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4.1-mini', 'gpt-4o-mini'] },

  { key: 'ANTHROPIC_API_KEY',  name: 'anthropic',   kind: 'anthropic',
    models: ['claude-haiku-4-5-20251001'] }
];

async function tryModels(models, callFn) {
  for (const model of models) {
    try {
      const reply = await callFn(model);
      if (reply) return { reply, model };
    } catch (e) {
      // try next model
    }
  }
  return null;
}

/**
 * Tries every configured provider in order, each with its own model
 * fallback chain. Returns { reply, provider, model, attempts } on the first
 * success, or { reply: null, attempts } if every configured provider failed
 * (or none are configured at all).
 */
export async function tryAllProviders(env, messages) {
  const attempts = [];

  for (const p of PROVIDERS) {
    if (!env[p.key]) continue; // not configured — skip silently
    const callFn = p.kind === 'gemini'
      ? (m) => callGemini(env[p.key], m, messages)
      : p.kind === 'anthropic'
        ? (m) => callAnthropic(env[p.key], m, messages)
        : (m) => callOpenAIStyle(p.baseUrl, env[p.key], m, messages);

    const r = await tryModels(p.models, callFn);
    attempts.push(r ? `${p.name}:${r.model}=ok` : `${p.name}=failed`);
    if (r) return { reply: r.reply, provider: p.name, model: r.model, attempts };
  }

  return { reply: null, provider: null, model: null, attempts };
}

async function callOpenAIStyle(baseUrl, apiKey, model, messages) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.4 })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(apiKey, model, messages) {
  const system = messages.find(m => m.role === 'system')?.content || '';
  const rest = messages.filter(m => m.role !== 'system');
  const contents = rest.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 600, temperature: 0.4 }
      })
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function callAnthropic(apiKey, model, messages) {
  const system = messages.find(m => m.role === 'system')?.content || '';
  const rest = messages.filter(m => m.role !== 'system');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 600, system, messages: rest })
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.content?.find(c => c.type === 'text')?.text?.trim() || null;
}

export function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin'
  };
}

// Best-effort per-isolate rate limiter. Not a strong guarantee on its own —
// pair with Cloudflare's dashboard Rate Limiting Rules for real protection.
const hits = new Map();
export function isRateLimited(ip, maxHits = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count++;
  hits.set(ip, entry);
  return entry.count > maxHits;
    }
    
