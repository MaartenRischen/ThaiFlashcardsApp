// Configuration constants
export const MAX_RETRIES = 3;

// Prioritized list of text models for set generation
export const TEXT_MODELS = [
  'google/gemini-2.5-flash-preview', // Gemini 2.5 Flash - Primary
  'google/gemini-2.5-pro-preview-03-25', // Gemini 2.5 Pro - Fallback
  'openai/gpt-4',          // OpenAI GPT-4
  'openai/gpt-3.5-turbo',  // OpenAI GPT-3.5 Turbo
  'anthropic/claude-3-opus', // Anthropic Claude
  'mistralai/mixtral-8x7b', // Other fallback
];

// Dynamic batch size based on model capabilities
export function getBatchSize(model: string): number {
  switch (model) {
    case 'google/gemini-2.5-flash-preview': return 8;
    case 'openai/gpt-4': return 4;
    default: return 3;
  }
}

// Irregular plurals mapping
export const IRREGULAR_PLURALS: Record<string, string> = {
  "children": "child",
  "people": "person",
  "men": "man",
  "women": "woman",
  "feet": "foot",
  "teeth": "tooth",
  "mice": "mouse",
  "geese": "goose",
  "oxen": "ox",
  "sheep": "sheep",
  "deer": "deer",
  "fish": "fish",
  "moose": "moose",
  "series": "series",
  "species": "species"
};

// Semantic groups mapping related words to primary terms
export const SEMANTIC_GROUPS: Record<string, string[]> = {
  // Size
  "big": ["large", "huge", "enormous", "giant", "massive", "immense", "vast", "colossal", "substantial", "gigantic"],
  "small": ["little", "tiny", "miniature", "minute", "petite", "compact", "diminutive", "micro", "mini", "slight"],
  
  // Temperature
  "hot": ["warm", "burning", "boiling", "scorching", "sizzling", "sweltering", "tropical", "heated", "fiery", "torrid"],
  "cold": ["cool", "chilly", "freezing", "frosty", "icy", "frigid", "arctic", "bitter", "wintry", "glacial"],
  
  // Speed and Time
  "fast": ["quick", "rapid", "swift", "speedy", "hasty", "prompt", "brisk", "expeditious", "nimble", "fleet"],
  "slow": ["sluggish", "unhurried", "leisurely", "gradual", "plodding", "dawdling", "languid", "lackadaisical", "crawling", "tardy"],
  "early": ["soon", "beforehand", "ahead", "premature", "preliminary", "initial", "first", "prior", "advance", "precocious"],
  "late": ["tardy", "delayed", "overdue", "behind", "belated", "deferred", "postponed", "afterward", "subsequent", "trailing"],
  
  // Quality and Condition
  "good": ["great", "excellent", "wonderful", "fantastic", "superb", "outstanding", "magnificent", "splendid", "marvelous", "exceptional"],
  "bad": ["terrible", "awful", "horrible", "poor", "inferior", "unsatisfactory", "inadequate", "deficient", "substandard", "mediocre"],
  "new": ["fresh", "recent", "novel", "modern", "current", "contemporary", "latest", "innovative", "original", "unprecedented"],
  "old": ["aged", "ancient", "vintage", "antique", "elderly", "mature", "senior", "traditional", "classic", "outdated"],
  
  // Appearance
  "beautiful": ["pretty", "gorgeous", "lovely", "attractive", "stunning", "handsome", "elegant", "charming", "graceful", "exquisite"],
  "ugly": ["unattractive", "hideous", "unsightly", "plain", "homely", "unpleasant", "grotesque", "repulsive", "repugnant", "disfigured"],
  "clean": ["spotless", "pristine", "immaculate", "tidy", "neat", "sanitary", "sterile", "hygienic", "unblemished", "pure"],
  "dirty": ["unclean", "soiled", "filthy", "grimy", "muddy", "stained", "messy", "sullied", "tarnished", "polluted"],
  
  // Difficulty
  "easy": ["simple", "straightforward", "effortless", "basic", "elementary", "uncomplicated", "manageable", "painless", "clear", "obvious"],
  "hard": ["difficult", "challenging", "complicated", "complex", "tough", "demanding", "strenuous", "arduous", "laborious", "problematic"],
  
  // Importance
  "important": ["crucial", "essential", "vital", "critical", "significant", "key", "fundamental", "primary", "central", "paramount"],
  "unimportant": ["trivial", "minor", "insignificant", "irrelevant", "negligible", "secondary", "marginal", "peripheral", "inconsequential", "meaningless"],
  
  // Movement
  "walk": ["stroll", "amble", "stride", "trek", "hike", "march", "wander", "saunter", "trudge", "promenade"],
  "run": ["sprint", "dash", "race", "jog", "bolt", "rush", "hurry", "scamper", "gallop", "flee"],
  
  // Communication
  "say": ["tell", "speak", "utter", "express", "state", "mention", "declare", "announce", "proclaim", "articulate"],
  "quiet": ["silent", "hushed", "mute", "soundless", "noiseless", "peaceful", "still", "tranquil", "inaudible", "voiceless"],
  
  // Common Actions
  "eat": ["consume", "devour", "dine", "feast", "munch", "nibble", "ingest", "feed", "gorge", "snack"],
  "sleep": ["rest", "slumber", "doze", "nap", "snooze", "hibernate", "repose", "retire", "crash", "drift off"],
  
  // Relationships
  "friend": ["companion", "buddy", "pal", "mate", "comrade", "ally", "associate", "colleague", "acquaintance", "confidant"],
  "enemy": ["foe", "adversary", "opponent", "rival", "antagonist", "nemesis", "opposition", "competitor", "opposition", "hostile"],
  
  // Weather
  "rainy": ["wet", "drizzly", "showery", "stormy", "pouring", "drenched", "soaked", "soggy", "precipitous", "monsoon"],
  "sunny": ["bright", "clear", "cloudless", "fair", "radiant", "shining", "brilliant", "luminous", "gleaming", "glorious"]
};

// Simple plural endings for basic plural/singular normalization
export const PLURAL_ENDINGS = ['s', 'es', 'ies'];

// Common Thai words/particles to avoid duplication when checking
export const THAI_PARTICLES = [
  'ค่ะ', 'ครับ', 'คะ', 'ขา', 'นะ', 'นะคะ', 'นะครับ',
  'ได้', 'แล้ว', 'อยู่', 'ไหม', 'หรือ', 'และ', 'กับ',
  'ที่', 'ของ', 'ใน', 'บน', 'ใต้', 'หน้า', 'หลัง', 'ข้าง'
];

// Common polite endings for automatic politeness detection
export const POLITE_ENDINGS = ['ครับ', 'ค่ะ', 'คะ', 'ขา'];

// Titles and honorifics that might appear in phrases
export const HONORIFICS = [
  'khun', 'คุณ', 'nai', 'นาย', 'nang', 'นาง', 'naang saao', 'นางสาว'
];

// Expanded compound words with more everyday phrases
export const COMPOUND_WORDS: string[][] = [
  // Food and Drink
  ["ice", "cream"], ["hot", "dog"], ["french", "fries"], ["fried", "rice"],
  ["green", "tea"], ["coffee", "shop"], ["fast", "food"], ["take", "out"],
  ["soft", "drink"], ["orange", "juice"], ["mineral", "water"], ["food", "court"],
  
  // Places and Locations
  ["post", "office"], ["high", "school"], ["middle", "school"],
  ["train", "station"], ["bus", "stop"], ["air", "port"], ["sea", "port"],
  ["shopping", "center"], ["shopping", "mall"], ["super", "market"],
  ["book", "store"], ["book", "shop"], ["drug", "store"], ["convenience", "store"],
  ["department", "store"], ["grocery", "store"], ["coffee", "shop"],
  ["gas", "station"], ["police", "station"], ["fire", "station"],
  ["movie", "theater"], ["art", "gallery"], ["night", "club"],
  ["food", "court"], ["town", "hall"], ["city", "center"],
  
  // Home and Furniture
  ["living", "room"], ["dining", "room"], ["bed", "room"], ["bath", "room"],
  ["kitchen", "sink"], ["coffee", "table"], ["dining", "table"],
  ["computer", "desk"], ["book", "shelf"], ["shoe", "rack"],
  ["washing", "machine"], ["dish", "washer"], ["vacuum", "cleaner"],
  ["air", "conditioner"], ["ceiling", "fan"], ["floor", "lamp"],
  
  // Personal Items
  ["cell", "phone"], ["mobile", "phone"], ["smart", "phone"],
  ["credit", "card"], ["debit", "card"], ["id", "card"],
  ["tooth", "brush"], ["tooth", "paste"], ["hair", "brush"],
  ["sun", "glasses"], ["contact", "lenses"], ["make", "up"],
  ["back", "pack"], ["hand", "bag"], ["shopping", "bag"],
  
  // Time and Events
  ["birth", "day"], ["new", "year"], ["week", "end"],
  ["rush", "hour"], ["lunch", "time"], ["dinner", "time"],
  ["day", "time"], ["night", "time"], ["holiday", "season"],
  ["spring", "break"], ["summer", "vacation"], ["winter", "holiday"],
  
  // Family Relations
  ["grand", "father"], ["grand", "mother"], ["grand", "parents"],
  ["mother", "in", "law"],
  ["brother", "in", "law"], ["step", "mother"], ["step", "father"],
  ["step", "sister"], ["step", "brother"], ["half", "sister"],
  ["half", "brother"], ["great", "grand", "mother"], ["great", "grand", "father"],
  
  // Transportation
  ["public", "transport"], ["bullet", "train"], ["express", "train"],
  ["subway", "station"], ["bus", "terminal"], ["taxi", "stand"],
  ["parking", "lot"], ["parking", "space"], ["bike", "lane"],
  ["traffic", "light"], ["traffic", "jam"], ["speed", "limit"],
  
  // Sports and Recreation
  ["swimming", "pool"], ["tennis", "court"], ["basketball", "court"],
  ["golf", "course"], ["fitness", "center"], ["sports", "club"],
  ["theme", "park"], ["water", "park"], ["skate", "park"],
  ["bowling", "alley"], ["ice", "rink"], ["ski", "resort"],
  
  // Technology
  ["wifi", "network"], ["internet", "connection"], ["web", "site"],
  ["social", "media"], ["search", "engine"], ["email", "address"],
  ["user", "name"], ["pass", "word"], ["hard", "drive"],
  ["thumb", "drive"], ["memory", "card"], ["power", "bank"],
  
  // Business and Work
  ["business", "card"], ["name", "card"], ["office", "building"],
  ["meeting", "room"], ["break", "room"], ["work", "place"],
  ["job", "interview"], ["lunch", "break"], ["coffee", "break"],
  ["over", "time"], ["part", "time"], ["full", "time"],
  
  // Health and Medical
  ["first", "aid"], ["emergency", "room"], ["waiting", "room"],
  ["operating", "room"], ["medical", "center"], ["health", "care"],
  ["blood", "pressure"], ["heart", "rate"], ["body", "temperature"],
  ["side", "effects"], ["health", "insurance"], ["medical", "history"]
];

// Common pronouns that might need gender adjustment
export const GENDERED_PRONOUNS = {
  "male": {
    "en": ["he", "his", "him", "himself"],
    "th": ["phom", "ผม", "khrap", "ครับ"]
  },
  "female": {
    "en": ["she", "her", "hers", "herself"],
    "th": ["chan", "ฉัน", "dichan", "ดิฉัน", "ka", "ค่ะ"]
  }
};

// Contextual variations for common concepts
export const CONTEXTUAL_VARIATIONS: Record<string, string[]> = {
  // Time expressions
  "morning": ["am", "ante meridiem", "before noon", "sunrise", "dawn"],
  "afternoon": ["pm", "post meridiem", "after noon", "midday"],
  "evening": ["night", "nighttime", "dusk", "sunset"],
  "today": ["this day", "current day", "now"],
  "tomorrow": ["next day", "following day"],
  "yesterday": ["previous day", "day before"],
  
  // Locations
  "here": ["this place", "this location", "this spot"],
  "there": ["that place", "that location", "that spot"],
  "everywhere": ["all places", "all locations", "all around"],
  "nowhere": ["no place", "no location", "no where"],
  
  // Quantities
  "all": ["every", "each", "complete", "entire", "whole"],
  "some": ["few", "several", "various", "certain"],
  "none": ["nothing", "zero", "no one", "not any"],
  
  // Directions
  "left": ["port side", "leftward", "lefthand"],
  "right": ["starboard", "rightward", "righthand"],
  "up": ["upward", "upstairs", "above"],
  "down": ["downward", "downstairs", "below"],
  
  // Common measurements
  "kilometer": ["km", "kilometres", "kilometers"],
  "meter": ["m", "metres", "meters"],
  "centimeter": ["cm", "centimetres", "centimeters"],
  "millimeter": ["mm", "millimetres", "millimeters"],
  "kilogram": ["kg", "kilos", "kilograms"],
  "gram": ["g", "grams", "grammes"],
  "liter": ["l", "litre", "liters", "litres"],
  "milliliter": ["ml", "millilitre", "milliliters", "millilitres"],
  
  // Common status
  "open": ["opened", "operating", "available", "accessible"],
  "closed": ["shut", "unavailable", "inaccessible"],
  "busy": ["occupied", "engaged", "unavailable"],
  "free": ["available", "unoccupied", "vacant"],
  "full": ["filled", "complete", "no space"],
  "empty": ["vacant", "unfilled", "no content"],
  
  // Common actions
  "help": ["assist", "aid", "support", "facilitate"],
  "start": ["begin", "commence", "initiate", "launch"],
  "finish": ["end", "complete", "conclude", "terminate"],
  "continue": ["proceed", "carry on", "keep going", "persist"],
  "stop": ["halt", "cease", "discontinue", "terminate"],
  
  // Common states
  "broken": ["damaged", "not working", "malfunctioning", "out of order"],
  "fixed": ["repaired", "working", "functional", "in order"],
  "ready": ["prepared", "set", "available", "good to go"],
  "waiting": ["pending", "on hold", "standing by"],
  "done": ["finished", "completed", "over", "ended"]
};

// Verb forms for normalization
export const VERB_FORMS: Record<string, string> = {
  // Be
  "am": "be", "is": "be", "are": "be", "was": "be", "were": "be", "been": "be", "being": "be",
  // Have
  "has": "have", "had": "have", "having": "have",
  // Do
  "does": "do", "did": "do", "doing": "do", "done": "do",
  // Common irregular verbs
  "went": "go", "gone": "go", "going": "go",
  "ate": "eat", "eaten": "eat", "eating": "eat",
  "saw": "see", "seen": "see", "seeing": "see",
  "took": "take", "taken": "take", "taking": "take",
  "came": "come", "coming": "come",
  "knew": "know", "known": "know", "knowing": "know",
  "got": "get", "gotten": "get", "getting": "get",
  "made": "make", "making": "make",
  "said": "say", "saying": "say",
  "found": "find", "finding": "find",
  "gave": "give", "given": "give", "giving": "give",
  // Regular verb forms (-ed, -ing patterns)
  "walked": "walk", "walking": "walk",
  "talked": "talk", "talking": "talk",
  "played": "play", "playing": "play",
  "worked": "work", "working": "work",
  "studied": "study", "studying": "study",
  "called": "call", "calling": "call",
  "looked": "look", "looking": "look",
  "wanted": "want", "wanting": "want",
  "needed": "need", "needing": "need",
  "tried": "try", "trying": "try",
  "moved": "move", "moving": "move",
  "lived": "live", "living": "live",
  "started": "start", "starting": "start",
  "ended": "end", "ending": "end",
  "asked": "ask", "asking": "ask",
  "answered": "answer", "answering": "answer"
}; 