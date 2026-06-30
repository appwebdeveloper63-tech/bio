// Cell Biology Question Bank — Group 3
// MCQ shape: { q, options:[a,b,c,d], correctIndex, explain, difficulty }
// SAQ shape: { q, a, difficulty }
// difficulty: 'easy' | 'medium' | 'hard'

const SET1 = {
  mcq: [
    { q:"What is the specific thickness range of the plasma membrane as described in the Fluid-Mosaic model?",
      options:["1–5 nm","0.1 mm","7–10 nm","10–15 nm"], correctIndex:2, difficulty:"easy",
      explain:"The fluid-mosaic model places the membrane's thickness at 7–10 nm — far too thin to see without an electron microscope." },
    { q:'In the Fluid-Mosaic model, the "Mosaic" refers specifically to the arrangement of:',
      options:["Lipids behaving like a liquid","Proteins arranged like tiles","Cellulose fibers in the wall","Water molecules in a bilayer"], correctIndex:1, difficulty:"medium",
      explain:'"Mosaic" describes the scattered, tile-like arrangement of proteins among the lipids — the lipids are the "fluid" part of the name.' },
    { q:"If mung bean seeds are kept in a concentrated solution after soaking in water for 12 hours, they will:",
      options:["Swell further","Remain unchanged","Shrink due to water loss","Burst instantly"], correctIndex:2, difficulty:"medium",
      explain:"A concentrated (hypertonic) outside solution pulls water out of the swollen seed by osmosis, so it shrinks instead of swelling further." },
    { q:"Which type of solution has a lower solute concentration (more water) than the inside of the cell?",
      options:["Isotonic solution","Hypertonic solution","Hypotonic solution","Saturated solution"], correctIndex:2, difficulty:"easy",
      explain:"A solution with more water relative to the cell is hypotonic — water will tend to move into the cell." },
    { q:"The lipid bilayer of the cell membrane consists of molecules with:",
      options:["Water-attracting heads pointing inward","Water-repelling tails pointing outward","Water-attracting heads pointing outward","No attraction to water at all"], correctIndex:2, difficulty:"medium",
      explain:"Hydrophilic heads face outward toward the watery environment on both sides of the membrane; the hydrophobic tails point inward, away from water." },
    { q:"Which carbohydrate provides structural strength and rigidity to the plant cell wall?",
      options:["Glucose","Starch","Cellulose","Chitin"], correctIndex:2, difficulty:"easy",
      explain:"Cellulose's long fibers give the wall tensile strength — starch is a storage molecule, and chitin belongs to fungi/insects, not plants." },
    { q:"Plasmolysis in a plant cell is specifically defined as:",
      options:["The swelling of the cell in plain water","Shrinkage of content away from the cell wall","The breakdown of the cell's nucleus","The absorption of minerals from the soil"], correctIndex:1, difficulty:"medium",
      explain:"Plasmolysis is the shrinking of the cell's contents away from the wall — the rigid wall itself stays put." },
    { q:"The movement of water across a selectively permeable membrane is called:",
      options:["Diffusion","Active Transport","Osmosis","Endocytosis"], correctIndex:2, difficulty:"easy",
      explain:"Osmosis is the specific term for water diffusing across a selectively permeable membrane." },
    { q:"Which of these is a defining characteristic of the plant cell wall?",
      options:["It is selectively permeable and living","It is rigid, non-living, and permeable","It is thin, flexible, and made of lipids","It is found in both animal and plant cells"], correctIndex:1, difficulty:"medium",
      explain:"The cell wall is rigid and made of non-living cellulose, but it still lets water and minerals pass through freely — that's the \"permeable\" part." },
    { q:"Singer and Nicolson proposed the currently accepted Fluid-Mosaic model in the year:",
      options:["1665","1839","1972","1855"], correctIndex:2, difficulty:"easy",
      explain:"Singer and Nicolson published the fluid-mosaic model in 1972. (1665 is when Robert Hooke first observed cells in cork.)" }
  ],
  saq: [
    { q:"Define diffusion as described in the textbook.", a:"Diffusion is the net movement of particles from a higher to a lower concentration without requiring a membrane.", difficulty:"easy" },
    { q:"What is the mathematical value of 1 nanometre (nm) in millimetres (mm)?", a:"1 nanometre equals 0.000001 mm.", difficulty:"medium" },
    { q:'Why is the cell membrane described as "fluid"?', a:"It is fluid because the lipid and protein molecules can move sideways, flip, and rotate within the membrane.", difficulty:"medium" },
    { q:'Which specific part of the cell membrane acts as a "gatekeeper"?', a:"The various types of proteins embedded in the membrane act as gatekeepers for substances.", difficulty:"easy" },
    { q:"What happens to the weight of a potato piece when placed in a 20% salt solution?", a:"The weight of the potato piece decreases because water moves out of the cells by osmosis.", difficulty:"medium" },
    { q:"Name the condition where there is no net movement of water into or out of the cell.", a:"This condition occurs when a cell is placed in an isotonic solution.", difficulty:"easy" },
    { q:"Identify the process by which plant roots absorb water from the soil.", a:"Plant roots absorb water through the process of osmosis.", difficulty:"easy" },
    { q:"Why do animal cells shrink entirely in concentrated solutions unlike plant cells?", a:"Animal cells shrink entirely because they lack a rigid cell wall to maintain their outer shape.", difficulty:"hard" },
    { q:"What is the primary function of the cell wall in stationary plants?", a:"The cell wall provides structural rigidity to withstand environmental stresses like wind and rain.", difficulty:"easy" },
    { q:"Identify the water-repelling part of the lipid molecule in the plasma membrane.", a:'The "tails" of the lipid molecules are water-repelling, or hydrophobic.', difficulty:"easy" },
    { q:'What is meant by the term "concentration gradient"?', a:"It is the difference in the concentration of particles between two areas.", difficulty:"easy" },
    { q:"What is the immediate effect of a hypotonic solution on an animal cell?", a:"The animal cell will gain water, swell, and may eventually burst.", difficulty:"medium" },
    { q:"Which organic molecules are the primary components of the plasma membrane?", a:"The plasma membrane is primarily composed of lipids (fats) and proteins.", difficulty:"easy" },
    { q:'Why is the cell wall described as "permeable"?', a:"It is permeable because it allows water and dissolved minerals to pass through it freely.", difficulty:"medium" },
    { q:"What structure defines the individuality of a cell by separating its contents from the environment?", a:"The cell membrane (plasma membrane) defines the individuality of a cell.", difficulty:"medium" },
    { q:"Which process is responsible for oxygen entering the cell during respiration?", a:"Oxygen enters the cell through the process of diffusion.", difficulty:"easy" },
    { q:"What is the state of a plant cell when its vacuole is full of water and pushing against the wall?", a:'The cell is in a "turgid" state.', difficulty:"easy" },
    { q:"Name the stain used when preparing a temporary slide of Rhoeo leaf peel.", a:"Safranin is the stain used to observe these plant cells.", difficulty:"easy" },
    { q:'Why is the cell membrane called "selectively permeable"?', a:"It is called so because it allows only selected substances to pass while blocking others.", difficulty:"medium" },
    { q:"What happens to the osmotic ability of a Rhoeo leaf cell if it is boiled?", a:"Boiling kills the cell and its membrane, which prevents osmosis and plasmolysis from occurring.", difficulty:"hard" }
  ]
};

const SET2 = {
  mcq: [
    { q:"What is the primary function of the mirror in a light microscope?",
      options:["To magnify the specimen image","To reflect and focus sunlight onto the specimen","To hold the glass slide in place","To change the objective lens power"], correctIndex:1, difficulty:"easy",
      explain:"Before built-in lamps, microscopes used a mirror to catch ambient or sunlight and direct it up through the specimen." },
    { q:'The "Near Point" of the human eye, the closest distance for comfortable vision, is:',
      options:["10 cm","25 cm","0.1 mm","1 metre"], correctIndex:1, difficulty:"easy",
      explain:"25 cm is the standard near point used in optics for the unaided human eye." },
    { q:"Which process allows an Amoeba to engulf food due to its flexible membrane?",
      options:["Plasmolysis","Diffusion","Endocytosis","Exosmosis"], correctIndex:2, difficulty:"medium",
      explain:"Endocytosis is the membrane folding around and engulfing particles — exactly how an Amoeba feeds." },
    { q:"While plant cell walls are made of cellulose, fungal cell walls are composed of:",
      options:["Peptidoglycan","Lipids","Chitin","Proteins"], correctIndex:2, difficulty:"easy",
      explain:"Chitin — the same tough polymer in insect exoskeletons — makes up fungal cell walls instead of cellulose." },
    { q:"A microscope has a 10X eyepiece and a 40X objective lens. What is the total magnification?",
      options:["50X","400X","4X","100X"], correctIndex:1, difficulty:"medium",
      explain:"Total magnification is eyepiece × objective: 10 × 40 = 400X." },
    { q:'In the Fluid-Mosaic model, which molecules form the continuous "fluid" bilayer?',
      options:["Proteins","Phospholipids","Cellulose","ATP"], correctIndex:1, difficulty:"medium",
      explain:"Phospholipids form the continuous bilayer sheet; proteins are scattered within it, not the bilayer itself." },
    { q:"What is the effect of cold temperatures on the lipid bilayer of the cell membrane?",
      options:["Molecules move faster","The membrane becomes more fluid","Lipids pack together and the membrane becomes rigid","The membrane dissolves"], correctIndex:2, difficulty:"hard",
      explain:"Cold causes the lipid tails to pack tightly together, making the membrane stiffer rather than fluid." },
    { q:"In the potato cup experiment, why is Cup D (boiled potato) unable to gather water?",
      options:["It lacks sugar/salt","Boiling destroys the selectively permeable membrane","The potato is too hard","Boiling increases the concentration gradient"], correctIndex:1, difficulty:"medium",
      explain:"Boiling denatures the membrane's proteins, so it loses its selective permeability and can no longer draw in water." },
    { q:"The cell wall of bacteria is chemically composed of:",
      options:["Cellulose","Chitin","Peptidoglycan","Starch"], correctIndex:2, difficulty:"easy",
      explain:"Peptidoglycan is the characteristic structural molecule of bacterial cell walls." },
    { q:"Water moves from a dilute solution to a concentrated solution across a membrane during:",
      options:["Active transport","Diffusion","Osmosis","Evaporation"], correctIndex:2, difficulty:"easy",
      explain:"Osmosis moves water toward the side with more solute, evening out the concentration on both sides." }
  ],
  saq: [
    { q:"How many nanometres (nm) are contained in one single micrometre (µm)?", a:"One micrometre contains 1000 nanometres.", difficulty:"medium" },
    { q:"Why is glycerin applied to a specimen before placing the cover slip?", a:"Glycerin is used to keep the specimen moist and prevent it from drying out.", difficulty:"easy" },
    { q:"Identify the specific part of the microscope used for fine-tuning the clarity of the image.", a:"The fine adjustment knob is used for this purpose.", difficulty:"easy" },
    { q:'What defines the "limit of resolution" for the human eye?', a:"It is the minimum distance (0.1 mm) at which two points can be seen as separate.", difficulty:"medium" },
    { q:"Describe the orientation of the hydrophobic tails in the plasma membrane.", a:"The hydrophobic tails point inward, away from the watery environment.", difficulty:"easy" },
    { q:"What is the biological term for a cell that has lost water and its contents have shrunk?", a:'Such a cell is described as being in a "plasmolysed" or "flaccid" state.', difficulty:"easy" },
    { q:"Why does a plant cell not burst when placed in a hypotonic medium?", a:"The rigid cell wall exerts counter-pressure against the swelling cell, preventing it from bursting.", difficulty:"medium" },
    { q:'Name the scientist who first observed "cells" in a thin slice of cork.', a:"Robert Hooke observed them in 1665.", difficulty:"easy" },
    { q:"What is the primary role of integral proteins in the cell membrane?", a:"They act as channels or pumps to transport large or charged molecules across the bilayer.", difficulty:"medium" },
    { q:"Which stain is commonly used to observe animal cells like human cheek cells?", a:"Methylene blue is the stain typically used for cheek cells.", difficulty:"easy" },
    { q:'Define the term "concentration gradient" in relation to cellular transport.', a:"It is the difference in the amount of a substance between the inside and outside of a cell.", difficulty:"easy" },
    { q:"What provides mechanical strength and structural support to a stationary plant?", a:"The rigid cell wall made of cellulose provides this strength.", difficulty:"easy" },
    { q:"Identify the process by which CO2 is excreted from a cell into the environment.", a:"CO2 is excreted through the process of diffusion.", difficulty:"easy" },
    { q:'Why is the cell wall described as "non-living"?', a:"It is a rigid, secreted layer that does not perform active metabolic functions like the membrane.", difficulty:"medium" },
    { q:"What happens to the weight of a carrot when kept in plain water for several hours?", a:"The weight of the carrot increases because it absorbs water by osmosis.", difficulty:"medium" },
    { q:'Which specific model explains the "mosaic" arrangement of proteins in the membrane?', a:"The Fluid-Mosaic Model proposed by Singer and Nicolson.", difficulty:"easy" },
    { q:"What is the thickness of the plasma membrane in nanometres?", a:"The plasma membrane is approximately 7 to 10 nanometres thick.", difficulty:"easy" },
    { q:"In an isotonic solution, what is the net movement of water?", a:"There is no net movement of water, as the concentration is equal on both sides.", difficulty:"easy" },
    { q:'What is the function of the "stage" in a light microscope?', a:"The stage is the platform where the glass slide containing the specimen is placed for observation.", difficulty:"easy" },
    { q:"Why do cells in a boiled Rhoeo leaf fail to show plasmolysis?", a:"Boiling kills the cells, making the membrane fully permeable and unable to regulate osmosis.", difficulty:"hard" }
  ]
};

// Organelle Match game pairs
const MEMORY_PAIRS = [
  ["Plasma membrane", "Controls what enters and leaves the cell"],
  ["Cell wall", "Rigid layer giving plant cells shape and support"],
  ["Nucleus", "Houses the cell's genetic material"],
  ["Mitochondria", "Site of cellular respiration; makes energy"],
  ["Vacuole", "Large sac storing water, keeps the cell turgid"],
  ["Chloroplast", "Site of photosynthesis in plant cells"],
  ["Cytoplasm", "Jelly-like fluid where organelles float"],
  ["Ribosome", "Builds proteins from amino acids"]
];

// Achievement badges — unlocked via app.js, persisted in localStorage
const BADGES = [
  { id: 'first_steps',   label: 'First Steps',     desc: 'Opened your first question set',              icon: '🌱' },
  { id: 'set1_complete', label: 'Set 1 Explorer',  desc: 'Revealed every answer in Set 1',               icon: '🧬' },
  { id: 'set2_complete', label: 'Set 2 Explorer',  desc: 'Revealed every answer in Set 2',               icon: '🔬' },
  { id: 'memory_master', label: 'Memory Master',   desc: 'Cleared Organelle Match in 10 moves or fewer', icon: '🧠' },
  { id: 'perfect_quiz',  label: 'Perfectionist',   desc: 'Scored a perfect run on the Speed Quiz',       icon: '🎯' },
  { id: 'boss_slayer',   label: 'Boss Slayer',     desc: 'Completed Boss Mode',                          icon: '👑' },
  { id: 'streak_10',     label: 'On Fire',         desc: 'Hit a 10-question correct streak',             icon: '🔥' },
  { id: 'level_5',       label: 'Rising Scholar',  desc: 'Reached Level 5',                              icon: '⭐' },
  { id: 'flash_streak',  label: 'Flashcard Fan',   desc: 'Marked "Got it" on 15 flashcards',              icon: '🗂️' },
  { id: 'microscopist',  label: 'Microscopist',    desc: 'Brought 5 specimens into perfect focus',       icon: '🔭' }
];

// ===================== Prokaryotic vs Eukaryotic quick-reference table =====================
const PROK_EUK_TABLE = [
  { feature:"Nucleus",            prokaryotic:"Absent — DNA floats free in the cytoplasm", eukaryotic:"Present — DNA enclosed in a nuclear membrane" },
  { feature:"Cell size",          prokaryotic:"Typically 1–10 µm",                          eukaryotic:"Typically 10–100 µm" },
  { feature:"Cell wall",          prokaryotic:"Usually present (peptidoglycan)",            eukaryotic:"Present in plants/fungi (cellulose/chitin), absent in animals" },
  { feature:"Organelles",         prokaryotic:"No membrane-bound organelles",               eukaryotic:"Membrane-bound organelles (mitochondria, ER, Golgi, etc.)" },
  { feature:"Ribosomes",          prokaryotic:"Smaller (70S)",                              eukaryotic:"Larger (80S)" },
  { feature:"DNA structure",      prokaryotic:"Single circular chromosome",                 eukaryotic:"Multiple linear chromosomes" },
  { feature:"Reproduction",       prokaryotic:"Binary fission",                             eukaryotic:"Mitosis / meiosis" },
  { feature:"Examples",           prokaryotic:"Bacteria, archaea",                          eukaryotic:"Plants, animals, fungi, protists" }
];

// ===================== Virtual Microscope: 50 specimens =====================
// No real photos are used (avoids copyright issues and any need for network
// access) — app.js procedurally draws each specimen on an SVG using its
// `shape`/`palette`/`organelles`, and the user must use the coarse/fine focus
// knobs to bring a randomized "true focus" point into view, just like a real scope.
const MICROSCOPE_SPECIMENS = [
  { id:1,  name:"Onion peel epidermis",         category:"Plant",         shape:"hexpack",    palette:["#3a6b3f","#7fd97f"], hasWall:true,  hasNucleus:true,  organelles:[{type:'dot',minTier:1}],                          fact:"Thin, brick-like plant cells with clearly visible cell walls." },
  { id:2,  name:"Rhoeo leaf peel",               category:"Plant",         shape:"hexpack",    palette:["#5a2a5e","#c77dd1"], hasWall:true,  hasNucleus:true,  organelles:[{type:'vacuole',minTier:0}],                       fact:"Purple-pigmented epidermal cells, classic for plasmolysis demos." },
  { id:3,  name:"Elodea leaf",                   category:"Plant",         shape:"hexpack",    palette:["#1f5c2e","#54c46a"], hasWall:true,  hasNucleus:true,  organelles:[{type:'chloroplast',minTier:0},{type:'chloroplast',minTier:1}], fact:"Aquatic plant leaf cells with visible chloroplasts." },
  { id:4,  name:"Potato starch grains",          category:"Plant",         shape:"oval",       palette:["#caa15a","#f0d9a0"], hasWall:false, hasNucleus:false, organelles:[{type:'ring',minTier:1}],                          fact:"Layered, egg-shaped starch grains inside potato cells." },
  { id:5,  name:"Onion root tip (mitosis)",      category:"Plant",         shape:"hexpack",    palette:["#3a6b3f","#9be39b"], hasWall:true,  hasNucleus:true,  organelles:[{type:'dot',minTier:2}],                           fact:"Actively dividing cells showing different mitotic stages." },
  { id:6,  name:"Maize stem cross-section",      category:"Plant",         shape:"rectangle",  palette:["#7a5a2a","#e0b873"], hasWall:true,  hasNucleus:false, organelles:[{type:'ring',minTier:0},{type:'ring',minTier:1}], fact:"Scattered vascular bundles typical of a monocot stem." },
  { id:7,  name:"Dicot leaf cross-section",      category:"Plant",         shape:"rectangle",  palette:["#235c28","#7fd97f"], hasWall:true,  hasNucleus:false, organelles:[{type:'chloroplast',minTier:0}],                   fact:"Layered mesophyll tissue between upper and lower epidermis." },
  { id:8,  name:"Pollen grain",                  category:"Plant",         shape:"star",       palette:["#caa12a","#f7df7a"], hasWall:true,  hasNucleus:true,  organelles:[],                                                 fact:"Spiky-walled grain carrying a plant's genetic material." },
  { id:9,  name:"Moss leaf",                     category:"Plant",         shape:"hexpack",    palette:["#2e6b3a","#7fe08c"], hasWall:true,  hasNucleus:true,  organelles:[{type:'chloroplast',minTier:0}],                   fact:"A single layer of simple photosynthetic cells." },
  { id:10, name:"Spirogyra filament",            category:"Plant",         shape:"tube",       palette:["#1f7a4a","#5be39a"], hasWall:true,  hasNucleus:false, organelles:[{type:'ring',minTier:0}],                          fact:"Algal filament with a spiral chloroplast ribbon." },
  { id:11, name:"Human cheek cell",              category:"Animal",        shape:"irregular",  palette:["#caa6c9","#7d4f7a"], hasWall:false, hasNucleus:true,  organelles:[],                                                 fact:"Flat, irregular epithelial cells from the inner cheek." },
  { id:12, name:"Human blood smear",             category:"Animal",        shape:"round",      palette:["#a32d3a","#e06070"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Disc-shaped red blood cells with no nucleus." },
  { id:13, name:"Frog blood smear",              category:"Animal",        shape:"oval",       palette:["#a32d3a","#e06070"], hasWall:false, hasNucleus:true,  organelles:[],                                                 fact:"Oval, nucleated red blood cells — unlike mammal blood." },
  { id:14, name:"Skeletal muscle fiber",         category:"Animal",        shape:"stripedrod", palette:["#8a3b3b","#d97a7a"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Long fibers with visible banding (striations)." },
  { id:15, name:"Smooth muscle tissue",          category:"Animal",        shape:"irregular",  palette:["#8a4b3b","#d9967a"], hasWall:false, hasNucleus:true,  organelles:[],                                                 fact:"Spindle-shaped cells without visible striations." },
  { id:16, name:"Nerve cell (neuron)",           category:"Animal",        shape:"star",       palette:["#2a4f8a","#7aa6e0"], hasWall:false, hasNucleus:true,  organelles:[],                                                 fact:"Star-shaped body with long thread-like extensions." },
  { id:17, name:"Sperm cells",                   category:"Animal",        shape:"tube",       palette:["#3a5e8a","#7ab0e0"], hasWall:false, hasNucleus:true,  organelles:[],                                                 fact:"Small oval heads, each trailing a single long tail." },
  { id:18, name:"Adipose tissue",                category:"Animal",        shape:"hexpack",    palette:["#caa15a","#f3dba0"], hasWall:false, hasNucleus:true,  organelles:[{type:'vacuole',minTier:0}],                       fact:"Large rounded fat-storage cells packed tightly together." },
  { id:19, name:"Cartilage tissue",              category:"Animal",        shape:"irregular",  palette:["#7a8aa0","#c4d3e6"], hasWall:false, hasNucleus:true,  organelles:[{type:'dot',minTier:1}],                           fact:"Cells sitting in small clusters within a firm matrix." },
  { id:20, name:"Bone tissue cross-section",     category:"Animal",        shape:"round",      palette:["#9a8a6a","#e0d3a8"], hasWall:false, hasNucleus:false, organelles:[{type:'ring',minTier:0},{type:'ring',minTier:1}], fact:"Concentric rings of matrix around tiny central canals." },
  { id:21, name:"Amoeba",                        category:"Microorganism", shape:"irregular",  palette:["#4a6b4a","#9ad19a"], hasWall:false, hasNucleus:true,  organelles:[{type:'vacuole',minTier:0}],                       fact:"Shapeless single cell extending finger-like pseudopodia." },
  { id:22, name:"Paramecium",                    category:"Microorganism", shape:"oval",       palette:["#3a7a7a","#7ad1d1"], hasWall:false, hasNucleus:true,  organelles:[{type:'cilia',minTier:0},{type:'vacuole',minTier:1}], fact:"Slipper-shaped cell covered in fine beating cilia." },
  { id:23, name:"Euglena",                       category:"Microorganism", shape:"oval",       palette:["#2a6b4a","#6ad19a"], hasWall:false, hasNucleus:true,  organelles:[{type:'dot',minTier:1}],                           fact:"Spindle-shaped cell with a single whip-like flagellum." },
  { id:24, name:"Yeast cells",                   category:"Microorganism", shape:"round",      palette:["#caa15a","#f0d9a0"], hasWall:true,  hasNucleus:true,  organelles:[{type:'bud',minTier:0}],                           fact:"Round cells often seen budding off smaller daughter cells." },
  { id:25, name:"Bacteria (cocci)",              category:"Microorganism", shape:"round",      palette:["#8a2a4a","#d97aa0"], hasWall:true,  hasNucleus:false, organelles:[],                                                 fact:"Tiny round bacterial cells, sometimes in chains or clusters." },
  { id:26, name:"Bacteria (bacilli)",            category:"Microorganism", shape:"rod",        palette:["#8a2a4a","#d97aa0"], hasWall:true,  hasNucleus:false, organelles:[],                                                 fact:"Short rod-shaped bacterial cells." },
  { id:27, name:"Diatom",                        category:"Microorganism", shape:"hexpack",    palette:["#caa12a","#f7df7a"], hasWall:true,  hasNucleus:false, organelles:[],                                                 fact:"Single-celled alga with an ornate glass-like silica shell." },
  { id:28, name:"Volvox colony",                 category:"Microorganism", shape:"round",      palette:["#1f7a4a","#5be39a"], hasWall:true,  hasNucleus:false, organelles:[{type:'dot',minTier:0},{type:'dot',minTier:1}],   fact:"Hollow sphere made of hundreds of tiny linked algal cells." },
  { id:29, name:"Hydra",                         category:"Microorganism", shape:"tube",       palette:["#caa15a","#f0d9a0"], hasWall:false, hasNucleus:false, organelles:[{type:'cilia',minTier:0}],                         fact:"Tube-shaped body with a ring of tentacles at one end." },
  { id:30, name:"Plasmodium (malaria parasite)", category:"Microorganism", shape:"round",      palette:["#a32d3a","#e06070"], hasWall:false, hasNucleus:true,  organelles:[{type:'ring',minTier:0}],                          fact:"Ring-shaped parasite stages seen inside red blood cells." },
  { id:31, name:"Human skin cross-section",      category:"Tissue",        shape:"rectangle",  palette:["#caa6c9","#7d4f7a"], hasWall:false, hasNucleus:true,  organelles:[{type:'dot',minTier:1}],                           fact:"Layered epidermis sitting above the dermis." },
  { id:32, name:"Compound eye of insect",        category:"Tissue",        shape:"hexpack",    palette:["#2a4f8a","#7aa6e0"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Hundreds of tiny hexagonal lens facets packed together." },
  { id:33, name:"Feather barb",                  category:"Tissue",        shape:"stripedrod", palette:["#7a8aa0","#c4d3e6"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Central shaft with fine interlocking side branches." },
  { id:34, name:"Hair shaft",                    category:"Tissue",        shape:"tube",       palette:["#5a4a3a","#a08a6a"], hasWall:false, hasNucleus:false, organelles:[{type:'ring',minTier:1}],                          fact:"Long cylindrical fiber with an overlapping scaled surface." },
  { id:35, name:"Fish scale",                    category:"Tissue",        shape:"round",      palette:["#2a6b8a","#7ad1e0"], hasWall:false, hasNucleus:false, organelles:[{type:'ring',minTier:0},{type:'ring',minTier:1}], fact:"Overlapping growth rings, like tree rings, mark its age." },
  { id:36, name:"Mosquito larva",                category:"Tissue",        shape:"tube",       palette:["#3a5e3a","#7ab07a"], hasWall:false, hasNucleus:false, organelles:[{type:'dot',minTier:0}],                           fact:"Segmented aquatic larva with a distinct head and siphon." },
  { id:37, name:"Water flea (Daphnia)",          category:"Tissue",        shape:"irregular",  palette:["#3a6b6a","#7ad1c4"], hasWall:false, hasNucleus:false, organelles:[{type:'dot',minTier:0}],                           fact:"Small transparent crustacean with a visible beating heart." },
  { id:38, name:"Cork cells (Hooke's slide)",    category:"Tissue",        shape:"hexpack",    palette:["#8a5a3a","#caa06a"], hasWall:true,  hasNucleus:false, organelles:[],                                                 fact:"Tightly packed empty boxes — the first cells ever observed." },
  { id:39, name:"Fungal hyphae",                 category:"Tissue",        shape:"stripedrod", palette:["#caa15a","#f0d9a0"], hasWall:true,  hasNucleus:false, organelles:[],                                                 fact:"Branching thread-like filaments forming a fungal network." },
  { id:40, name:"Lichen cross-section",          category:"Tissue",        shape:"irregular",  palette:["#5a7a3a","#a0caa0"], hasWall:true,  hasNucleus:false, organelles:[{type:'dot',minTier:0},{type:'dot',minTier:1}],   fact:"Algal cells scattered within a mesh of fungal threads." },
  { id:41, name:"Table salt crystals",           category:"Other",         shape:"rectangle",  palette:["#cfd8e6","#ffffff"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Perfect cube-shaped crystals of sodium chloride." },
  { id:42, name:"Sugar crystals",                category:"Other",         shape:"hexpack",    palette:["#e6dccb","#ffffff"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Irregular faceted crystals of sucrose." },
  { id:43, name:"Human fingerprint ridge",       category:"Other",         shape:"stripedrod", palette:["#caa6c9","#7d4f7a"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Parallel looping ridge patterns unique to each person." },
  { id:44, name:"Cotton fiber",                  category:"Other",         shape:"tube",       palette:["#e6e6e6","#ffffff"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Flat, twisted ribbon-like natural plant fiber." },
  { id:45, name:"Synthetic fiber",               category:"Other",         shape:"tube",       palette:["#9ab8d8","#d6e8f7"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Perfectly smooth, uniform man-made filament." },
  { id:46, name:"Pencil graphite",               category:"Other",         shape:"rectangle",  palette:["#3a3a3a","#7a7a7a"], hasWall:false, hasNucleus:false, organelles:[{type:'ring',minTier:1}],                          fact:"Stacked, flaky layers of carbon." },
  { id:47, name:"Printed newspaper dot pattern", category:"Other",         shape:"hexpack",    palette:["#1a1a1a","#c0392b"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Tiny colored ink dots that blend into an image from afar." },
  { id:48, name:"Butterfly wing scale",          category:"Other",         shape:"hexpack",    palette:["#caa12a","#3a6b8a"], hasWall:false, hasNucleus:false, organelles:[],                                                 fact:"Overlapping rows of tiny pigmented scales, like roof tiles." },
  { id:49, name:"Mold (Rhizopus) on bread",      category:"Other",         shape:"stripedrod", palette:["#3a3a3a","#8a8a8a"], hasWall:true,  hasNucleus:false, organelles:[{type:'dot',minTier:1}],                           fact:"Fine cottony threads topped with tiny dark spore capsules." },
  { id:50, name:"Pond water sample",             category:"Other",         shape:"irregular",  palette:["#3a6b6a","#7ad1c4"], hasWall:false, hasNucleus:false, organelles:[{type:'dot',minTier:0},{type:'cilia',minTier:1}], fact:"A mix of algae, protozoa, and debris all in a single drop." }
];
