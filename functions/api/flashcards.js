// functions/api/flashcards.js
// Turns pasted notes into flashcards using the same provider chain as chat.js.
// If no provider is configured (or all fail), returns an error — the frontend
// then falls back to a simple offline cloze-deletion generator so the
// feature still works without any API key.
import { tryAllProviders, corsHeaders, isRateLimited } from '../_shared/ai.js';

const FLASHCARD_SYSTEM_PROMPT = `You turn study notes into flashcards.
Read the user's notes and produce 6 to 10 flashcards that cover the key facts.
Respond with ONLY a JSON array, no markdown fences, no commentary, in this exact shape:
[{"q":"question text","a":"answer text"}, ...]
Keep each question under 20 words and each answer under 30 words.`;

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '*';
  return new Response(null, { headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || new URL(request.url).origin;
  const headers = corsHeaders(origin);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (isRateLimited(ip, 10, 60_000)) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }

  const text = (body && typeof body.text === 'string') ? body.text.trim() : '';
  if (!text || text.length < 20) {
    return new Response(JSON.stringify({ error: 'text_too_short' }), { status: 400, headers });
  }
  const clipped = text.slice(0, 6000); // keep prompt size sane

  const messages = [
    { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
    { role: 'user', content: clipped }
  ];

  const result = await tryAllProviders(env, messages);
  if (!result.reply) {
    return new Response(JSON.stringify({ error: 'no_provider_available', attempts: result.attempts }), { status: 503, headers });
  }

  const cleaned = result.reply.replace(/```json|```/g, '').trim();
  let cards;
  try {
    cards = JSON.parse(cleaned);
  } catch {
    return new Response(JSON.stringify({ error: 'bad_model_output' }), { status: 502, headers });
  }
  if (!Array.isArray(cards)) {
    return new Response(JSON.stringify({ error: 'bad_model_output' }), { status: 502, headers });
  }
  const safeCards = cards
    .filter(c => c && typeof c.q === 'string' && typeof c.a === 'string')
    .slice(0, 12)
    .map(c => ({ q: c.q.slice(0, 200), a: c.a.slice(0, 300) }));

  return new Response(JSON.stringify({ cards: safeCards, provider: result.provider, model: result.model }), { headers });
}
