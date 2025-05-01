// Import INITIAL_PHRASES from app/data/phrases 
import { INITIAL_PHRASES } from '@/app/data/phrases';

// Define types for the generator
export interface Phrase {
  id?: string; // Optional ID, populated from DB
  english: string;
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  mnemonic?: string;
  examples: ExampleSentence[]; // Required, not optional
  difficulty?: 'easy' | 'good' | 'hard';
}

export interface ExampleSentence {
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  translation: string;
}

export interface GeneratePromptOptions {
  level: 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';
  specificTopics?: string;
  count: number;
  existingPhrases?: string[];
  topicsToDiscuss?: string;
  toneLevel?: number; // 1-10 scale, where 1 is most serious and 10 is most absurd
}

// Define structured error types for better error handling
export type BatchErrorType = 'API' | 'PARSE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN';

export interface BatchError {
  type: BatchErrorType;
  message: string;
  details?: unknown; // Use unknown instead of any
  timestamp: string;
}

export interface GenerationResult {
  phrases: Phrase[];
  cleverTitle?: string;
  aggregatedErrors: (BatchError & { batchIndex: number })[];
  // Include summary data for client
  errorSummary?: {
    errorTypes: BatchErrorType[];
    totalErrors: number;
    userMessage: string;
  };
  llmBrand?: string;
  llmModel?: string;
  imageUrl?: string;
  temperature?: number; // Add temperature used for generation
}

export interface CustomSet {
  name: string;
  level: string;
  specificTopics?: string;
  createdAt: string;
  phrases: Phrase[];
  mnemonics: {[key: number]: string};
  seriousness?: number;
}

// Configuration constants
const MAX_RETRIES = 3;

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
function getBatchSize(model: string): number {
  switch (model) {
    case 'google/gemini-2.5-flash-preview': return 8;
    case 'openai/gpt-4': return 4;
    default: return 3;
  }
}

// Common word variations mapping - Expanded
const COMMON_VARIATIONS: Record<string, string> = {
  // Contractions
  "dont": "do not", "doesnt": "does not", "isnt": "is not", "arent": "are not",
  "cant": "cannot", "couldnt": "could not", "wouldnt": "would not", "shouldnt": "should not",
  "hasnt": "has not", "havent": "have not", "hadnt": "had not",
  "wont": "will not", "wasnt": "was not", "werent": "were not",
  
  // Personal pronouns
  "im": "i am", "ive": "i have", "id": "i would", "ill": "i will",
  "youre": "you are", "youve": "you have", "youd": "you would", "youll": "you will",
  "theyre": "they are", "theyve": "they have", "theyd": "they would", "theyll": "they will",
  "weve": "we have", "wed": "we would", "well": "we will",
  "shes": "she is", "hes": "he is", "its": "it is",
  
  // Common informal
  "wanna": "want to", "gonna": "going to", "gotta": "got to", "lemme": "let me",
  "gimme": "give me", "dunno": "do not know", "kinda": "kind of", "sorta": "sort of",
  "lotsa": "lots of", "outta": "out of", "hafta": "have to",
  
  // Time expressions
  "oclock": "o clock", "tonite": "tonight", "tmrw": "tomorrow", "tmw": "tomorrow",
  "rn": "right now", "asap": "as soon as possible",
  
  // Common abbreviations
  "mins": "minutes", "hrs": "hours", "sec": "second", "yr": "year",
  "jan": "january", "feb": "february", "mar": "march", "apr": "april",
  "aug": "august", "sept": "september", "oct": "october", "nov": "november", "dec": "december",
  
  // Numbers and quantities
  "1st": "first", "2nd": "second", "3rd": "third", "4th": "fourth", "5th": "fifth",
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
  "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
  "dozen": "twelve", "half": "50 percent", "quarter": "25 percent",
  
  // Common internet/text speak
  "pls": "please", "plz": "please", "thx": "thanks", "ty": "thank you",
  "bc": "because", "b4": "before", "gr8": "great", "l8": "late", "l8r": "later",
  "idk": "i do not know", "tbh": "to be honest", "imo": "in my opinion",
  
  // Measurement variations
  "meter": "metre", "liter": "litre", "kilometer": "kilometre",
  "lb": "pound", "kg": "kilogram", "km": "kilometer", "cm": "centimeter",
  
  // Common misspellings
  "alot": "a lot", "allright": "all right", "alright": "all right",
  "thankyou": "thank you", "goodby": "goodbye", "goodnight": "good night",
  "noone": "no one", "eventhough": "even though", "atleast": "at least",
  "ofcourse": "of course", "eachother": "each other", "anymore": "any more",
  "everyday": "every day", "everyone": "every one", "goodluck": "good luck"
};

// Expanded semantic groups for common synonyms
const SEMANTIC_GROUPS: Record<string, string[]> = {
  // Emotions and Feelings
  "happy": ["glad", "joyful", "pleased", "delighted", "cheerful", "merry", "content", "satisfied", "elated", "jubilant"],
  "sad": ["unhappy", "upset", "down", "depressed", "gloomy", "miserable", "melancholy", "sorrowful", "dejected", "heartbroken"],
  "angry": ["mad", "furious", "enraged", "irritated", "annoyed", "frustrated", "outraged", "irate", "cross", "livid"],
  "scared": ["afraid", "frightened", "terrified", "fearful", "anxious", "nervous", "worried", "panicked", "alarmed", "startled"],
  "tired": ["exhausted", "sleepy", "weary", "fatigued", "drained", "worn out", "drowsy", "lethargic", "beat", "spent"],
  
  // Size and Quantity
  "big": ["large", "huge", "enormous", "gigantic", "massive", "colossal", "vast", "immense", "substantial", "mammoth"],
  "small": ["little", "tiny", "miniature", "petite", "minute", "microscopic", "compact", "diminutive", "modest", "slight"],
  "many": ["numerous", "several", "multiple", "various", "plenty", "abundant", "countless", "lots", "myriad", "copious"],
  "few": ["scarce", "limited", "rare", "sparse", "scant", "insufficient", "minimal", "meager", "negligible", "handful"],
  
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
  
  // Temperature
  "hot": ["warm", "burning", "boiling", "scorching", "sizzling", "sweltering", "tropical", "heated", "fiery", "torrid"],
  "cold": ["cool", "chilly", "freezing", "frosty", "icy", "frigid", "arctic", "bitter", "wintry", "glacial"],
  
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
const PLURAL_ENDINGS = ['s', 'es', 'ies'];

// Expanded irregular plurals
const IRREGULAR_PLURALS: Record<string, string> = {
  // People
  "children": "child", "people": "person", "men": "man", "women": "woman",
  "wives": "wife", "selves": "self", "wolves": "wolf",
  "thieves": "thief", "sheep": "sheep", "deer": "deer", "fish": "fish",
  
  // Body parts
  "feet": "foot", "teeth": "tooth", "geese": "goose", "mice": "mouse",
  
  // Nature
  "leaves": "leaf", "lives": "life", "hooves": "hoof", "scarves": "scarf",
  "elves": "elf", "shelves": "shelf", "loaves": "loaf", "calves": "calf",
  
  // Latin/Greek derived
  "criteria": "criterion", "phenomena": "phenomenon", "analyses": "analysis",
  "theses": "thesis", "crises": "crisis", "hypotheses": "hypothesis",
  "diagnoses": "diagnosis", "bases": "basis", "axes": "axis",
  
  // Other common
  "cacti": "cactus", "fungi": "fungus", "nuclei": "nucleus", "syllabi": "syllabus",
  "alumni": "alumnus", "radii": "radius", "stimuli": "stimulus", "media": "medium"
};

// Expanded compound words with more everyday phrases
const COMPOUND_WORDS: string[][] = [
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
  ["mother", "in", "law"], ["father", "in", "law"], ["sister", "in", "law"],
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

// Common phrasal verbs and their variations
const PHRASAL_VERBS: Record<string, string[]> = {
  "get up": ["wake up", "rise", "stand up"],
  "get on": ["board", "mount", "climb on"],
  "get off": ["exit", "dismount", "leave"],
  "get in": ["enter", "go inside", "come in"],
  "get out": ["exit", "leave", "go outside"],
  "put on": ["wear", "don", "dress in"],
  "take off": ["remove", "undress", "discard"],
  "pick up": ["collect", "gather", "lift"],
  "drop off": ["deliver", "leave", "deposit"],
  "turn on": ["activate", "start", "switch on"],
  "turn off": ["deactivate", "stop", "switch off"],
  "look for": ["search", "seek", "hunt"],
  "look at": ["view", "observe", "watch"],
  "look after": ["care for", "tend to", "watch over"],
  "give up": ["quit", "surrender", "abandon"],
  "give back": ["return", "restore", "repay"],
  "come back": ["return", "revisit", "come again"],
  "go back": ["return", "retreat", "reverse"],
  "run out": ["deplete", "exhaust", "finish"],
  "run into": ["meet", "encounter", "bump into"],
  "clean up": ["tidy", "organize", "arrange"],
  "set up": ["arrange", "establish", "prepare"],
  "break down": ["fail", "collapse", "malfunction"],
  "break up": ["separate", "split", "divide"],
  "carry on": ["continue", "proceed", "persist"],
  "find out": ["discover", "learn", "determine"],
  "figure out": ["understand", "solve", "comprehend"],
  "fill in": ["complete", "enter", "write"],
  "fill out": ["complete", "finish", "write"],
  "hang up": ["disconnect", "end call", "terminate"],
  "hold on": ["wait", "pause", "stay"],
  "make up": ["invent", "create", "fabricate"],
  "point out": ["indicate", "show", "highlight"],
  "put away": ["store", "place", "keep"],
  "show up": ["arrive", "appear", "come"],
  "take care": ["manage", "handle", "attend to"],
  "think about": ["consider", "contemplate", "ponder"],
  "work out": ["exercise", "solve", "resolve"],
  "write down": ["record", "note", "document"]
};

// Contextual variations for common concepts
const CONTEXTUAL_VARIATIONS: Record<string, string[]> = {
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
const VERB_FORMS: Record<string, string> = {
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

/**
 * Builds a significantly updated prompt for generating Thai flashcards based on detailed user preferences.
 */
function buildGenerationPrompt(
  _topic: string, // Renamed from topic
  options: GeneratePromptOptions,
  existingPhrases: string[] = []
): string {
  const {
    level, // Explicitly get level
    specificTopics,
    count,
    topicsToDiscuss,
    toneLevel = 5, // Default to level 5 (balanced)
  } = options;

  // Define proficiency level descriptions
  const levelDescriptions: Record<GeneratePromptOptions['level'], string> = {
    'Complete Beginner': "Use ONLY single words or two-word combinations (noun+verb or noun+adjective). Focus on the absolute most basic, high-frequency vocabulary. Examples must be single-word or two-word statements only. NO questions, NO dialogues, NO complex structures.",
    'Basic Understanding': "Use short, practical phrases (2-4 words). Focus on basic S-V-O structures and common expressions for everyday needs. Simple questions are okay. Avoid dialogues. Examples should be basic descriptive statements about daily life.",
    'Intermediate': "Use medium-length descriptive sentences (4-7 words). Include basic compound structures and typical vocabulary for common situations. Simple questions and compound sentences are okay. Avoid dialogues. Examples should describe everyday situations.",
    'Advanced': "Use moderately complex sentences (7-12 words). Include varied grammar structures and more nuanced vocabulary. Complex questions and compound-complex sentences are okay. Avoid dialogues. Examples should demonstrate natural Thai expression.",
    'Native/Fluent': "Use natural, idiomatic Thai (any appropriate length). Include slang, cultural references, and educated native speech patterns. Complex questions and varied sentence structures are encouraged. Avoid dialogues. Examples should sound like authentic Thai.",
    'God Mode': "Use sophisticated, elaborate Thai (extended length). Include rare vocabulary, advanced grammar patterns, and literary/academic language. Complex questions and varied structures are encouraged. Avoid dialogues. Examples should demonstrate mastery of formal and literary Thai."
  };

  // Get the specific description for the requested level
  const selectedLevelDescription = levelDescriptions[level] || levelDescriptions['Intermediate']; // Default fallback if level is invalid

  // Define the output schema (remains the same, minor update to mnemonic description)
  const schemaDescription = `
  **Output Format:**
  Generate a JSON object containing two keys: "cleverTitle" and "phrases".
  - "cleverTitle": Use the exact user's input as the title. If there are multiple inputs, combine them with "and". Do not add any descriptive phrases like "describing the experience of" or "learning about". Just use the raw input(s). Examples:
    - Input: "living in the Nile" → "Living in the Nile"
    - Inputs: "birds, living in the Nile" → "Birds and living in the Nile"
    - Input: "street food vendors" → "Street food vendors"
  - "phrases": An array containing exactly ${count} unique flashcard objects. Each phrase object MUST conform to the following TypeScript interface:

  \`\`\`typescript
  interface Phrase {
    english: string; // Concise English translation.
    thai: string; // Thai script (base form).
    thaiMasculine: string; // Polite male version ("ครับ").
    thaiFeminine: string; // Polite female version ("ค่ะ").
    pronunciation: string; // Simple phonetic guide (e.g., 'sa-wat-dee krap').
    mnemonic?: string; // Provide a concise, intuitive mnemonic in *English* that helps remember the Thai word/short phrase by (1) linking English sounds to Thai sounds and (2) hinting at meaning. Focus on recall effectiveness, reflecting the Tone stylistically. For Tones 9 & 10, chaotic style takes precedence over strict recall utility. If >3 Thai words, focus mnemonic on the key word.
    examples: ExampleSentence[]; // REQUIRED: Must provide at least 2 example sentences reflecting the TONE and LEVEL.
  }

  interface ExampleSentence {
    thai: string; // Example sentence in Thai script.
    thaiMasculine: string; // Polite male version.
    thaiFeminine: string; // Polite female version.
    pronunciation: string; // Phonetic pronunciation.
    translation: string; // English translation.
  }
  \`\`\`

  CRITICAL: Each phrase MUST include at least 2 example sentences. No exceptions. The examples should reflect both the tone level and proficiency level of the set.

  Ensure the entire response is ONLY the JSON object, starting with '{' and ending with '}'. Do not include any introductory text, explanations, or markdown formatting outside the JSON structure itself.
  `;

  // Construct the detailed main prompt content using a standard template literal
  const prompt = `
  You are an expert AI assistant specialized in creating language learning flashcards. Your task is to generate ${count} flashcards and a set title.

  **CRITICAL TASK REQUIREMENTS:**
  - You MUST generate content that STRICTLY adheres to the specified **Proficiency Level (${level})**.
  - You MUST generate content that STRICTLY adheres to the specified **Tone Level (${toneLevel.toString()})**.
  - Both Level and Tone MUST be reflected in the generated 'phrases' and their 'examples'.
  - Follow ALL instructions below precisely.

  **User Preferences:**
  - Proficiency Level: **${level}**
  - Tone Level: **${toneLevel.toString()}**
  - Situations for Use: ${topicsToDiscuss || 'General conversation'}
  ${specificTopics ? `- Specific Focus: ${specificTopics}` : ''}

  **DETAILED INSTRUCTIONS:**

  1.  **Set Title:** Use the exact user's input topic ('Situations for Use' or 'Specific Focus' if provided) as the title. Combine multiple topics with "and". Do not add descriptive phrases like "learning about". Examples:
      - Input: "living in the Nile" → "Living in the Nile"
      - Inputs: "birds, living in the Nile" → "Birds and living in the Nile"
      - Input: "street food vendors" → "Street food vendors"

  2.  **Proficiency Level Implementation (${level}):** (Vocabulary, Grammar, Complexity) - THIS IS CRITICAL. Apply the following rules rigorously:
      *   **${selectedLevelDescription}**

  3.  **TONE Implementation (${toneLevel.toString()}):** (Context, Theme, Style) - THIS IS EQUALLY CRITICAL.
      *   **Tone Style Guide (1-10):**
          - Level 1: Content is purely practical, serious, and focused on essential communication. No humor. Examples are textbook-style, descriptive. Mnemonics must be practical and directly aid recall.
          - Level 2: Overwhelmingly practical and serious, but allows for very subtle, occasional hints of mild humor or slightly less formal phrasing. Mnemonics are practical, with a touch of creativity.
          - Level 3: Still primarily practical, but humor and playful elements become more noticeable. Examples can describe slightly amusing but plausible situations. Mnemonics can be a bit more playful.
          - Level 4: A clear blend. Content remains practical but is presented with noticeable humor, wit, or lightheartedness. Examples are often amusing but grounded. Mnemonics are creative and memorable.
          - Level 5: Equal mix of potentially practical phrases and concepts introducing illogical or surreal elements. Examples start describing impossible or highly improbable scenarios. Mnemonics can be bizarre but should still help memory.
          - Level 6: Practicality decreases. Phrases might be useful but are often presented in bizarre or nonsensical contexts. Examples increasingly defy logic/physics. Mnemonics can be strange and imaginative.
          - Level 7: Usefulness is secondary. Most content involves bizarre situations, surreal humor, or strange concepts. Examples are highly imaginative and illogical. Mnemonics can be very weird, with recall utility being less important.
          - Level 8: Usefulness is minimal. Content focuses on semantically strange but grammatically correct statements. Examples should feel like fever dreams, questioning reality. Mnemonics can be chaotic and nonsensical.
          - Level 9: Usefulness is almost non-existent. Content is intentionally chaotic, nonsensical, or paradoxical. Examples aim for existential absurdity. Mnemonic utility is secondary and can be completely random.
          - Level 10: Content is pure brain-melting madness, surrealism, and non-sequiturs, while maintaining grammatical structure. Examples should be maximally bizarre and nonsensical. Mnemonics can be pure chaos, with no requirement for recall utility.

      *   **Content Guidelines by Component:**
          - **Main Phrases:** 
            * Level 1: Must be actually useful Thai descriptive phrases, NO dialogues or questions
            * Level 2: Practical phrases, very subtle levity allowed
            * Level 3: Practical phrases, emerging fun/humor
            * Level 4: Playful practicality, noticeable humor
            * Level 5: Mix of practical and illogical, some absurdity
            * Level 6: Bizarre contexts, practicality decreases
            * Level 7: Surreal humor, usefulness is secondary
            * Level 8: Semantically strange, reality-bending
            * Level 9: Chaotic, nonsensical, reality-breaking
            * Level 10: Maximum chaos, pure surrealism

          - **Example Sentences:** 
            * Level 1: Textbook descriptive examples, no dialogues
            * Level 2: Practical, very subtle humor
            * Level 3: Practical, slightly amusing situations
            * Level 4: Amusing but grounded
            * Level 5: Impossible or improbable scenarios
            * Level 6: Breaking laws of physics/logic
            * Level 7: Highly imaginative, illogical
            * Level 8: Fever dream-like, questioning reality
            * Level 9: Existential absurdity
            * Level 10: Maximally bizarre, nonsensical

          - **Mnemonics:** 
            * Level 1: Focus on memorability, practical
            * Level 2: Practical, touch of creativity
            * Level 3: Playful, still aids recall
            * Level 4: Creative and memorable
            * Level 5: Bizarre but should help memory
            * Level 6: Strange and imaginative
            * Level 7: Very weird, recall utility less important
            * Level 8: Chaotic, nonsensical
            * Level 9: Completely random, utility is secondary
            * Level 10: Pure chaos, no requirement for recall utility

      *   **Example Outputs by Level:**
          - Level 1 (Dead Serious):
            * Phrase: "กาแฟร้อนหนึ่งแก้ว" (One hot coffee)
            * Example: "กาแฟร้อนอยู่บนโต๊ะ" (The hot coffee is on the table)
            * Mnemonic: "Cafe" sounds like "กาแฟ" - both mean coffee

          - Level 3 (Fun but Practical):
            * Phrase: "แมวตัวอ้วน" (Fat cat)
            * Example: "แมวตัวอ้วนนอนอยู่บนโซฟาสีชมพู" (The fat cat is sleeping on the pink sofa)
            * Mnemonic: Think of Garfield lounging around

          - Level 5 (50/50):
            * Phrase: "ดวงอาทิตย์สีม่วง" (Purple sun)
            * Example: "ดวงอาทิตย์สีม่วงส่องแสงลงบนต้นไม้ที่ทำจากช็อกโกแลต" (The purple sun shines down on trees made of chocolate)
            * Mnemonic: Imagine a purple sun melting chocolate trees

          - Level 8 (Pure Chaos):
            * Phrase: "สมองกินพิซซ่า" (Brain eating pizza)
            * Example: "สมองที่มีขาเต้นรำกำลังกินพิซซ่าในอวกาศที่ทำจากความฝัน" (The dancing brain with legs is eating pizza in space made of dreams)
            * Mnemonic: Picture your brain growing legs and moonwalking while eating pizza in zero gravity

      *   **Key Rules:**
          - Level 1 must be absolutely serious and practical
          - Levels 2-4 maintain practicality while adding touches of humor
          - Levels 5-7 sacrifice practicality for increasing absurdity
          - Levels 8-10 should make readers question their sanity
          - ALL levels must maintain perfect Thai grammar
          - Higher levels should feel like they were generated by an AI having an existential crisis

  4.  **Topic/Situation Control:**
      *   Focus content *primarily* on the 'Situations for Use': ${topicsToDiscuss || 'General conversation'}. Use this as inspiration, especially for absurd examples.
      *   If 'Specific Focus' (${specificTopics || 'None'}) provided, try to incorporate it.

  5.  **Avoid Duplicates:** Do not generate for these existing English phrases (case-insensitive): ${existingPhrases && existingPhrases.length > 0 ? existingPhrases.join(', ') : 'None'}. CRITICAL: Ensure that no generated English phrases match any existing ones, ignoring case (e.g. if "Red" exists, do not generate "red" or "RED").

  ${schemaDescription}
  `;

  return prompt.trim();
}

/**
 * Validates a phrase object to ensure it follows the correct structure
 */
function validatePhrase(data: unknown, existingPhrases: Phrase[] = []): data is Phrase {
  if (!data || typeof data !== 'object') return false;
  
  const phraseData = data as Partial<Phrase>;

  const hasRequiredFields =
    typeof phraseData.english === 'string' && phraseData.english.trim() !== '' &&
    typeof phraseData.thai === 'string' && phraseData.thai.trim() !== '' &&
    typeof phraseData.thaiMasculine === 'string' && phraseData.thaiMasculine.trim() !== '' &&
    typeof phraseData.thaiFeminine === 'string' && phraseData.thaiFeminine.trim() !== '' &&
    typeof phraseData.pronunciation === 'string' && phraseData.pronunciation.trim() !== '' &&
    Array.isArray(phraseData.examples) && phraseData.examples.length >= 2;

  if (!hasRequiredFields) return false;

  const thai = phraseData.thai as string;
  const pronunciation = phraseData.pronunciation as string;
  const english = phraseData.english as string;

  // Enhanced normalization function with improved word order handling
  const normalizeEnglish = (text: string): string => {
    // Initial basic normalization
    let normalized = text
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')  // Remove punctuation
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/^(a|an|the)\s+/i, '')  // Remove leading articles
      .replace(/\s+(a|an|the)\s+/g, ' '); // Remove articles in middle of phrase

    // Handle common variations
    for (const [variation, standard] of Object.entries(COMMON_VARIATIONS)) {
      normalized = normalized.replace(new RegExp(`\\b${variation}\\b`, 'g'), standard);
    }

    // Split into words for processing
    let words = normalized.split(' ');

    // Handle verb forms before other processing
    words = words.map(word => VERB_FORMS[word] || word);

    // Handle phrasal verbs
    for (let i = 0; i < words.length - 1; i++) {
      const possiblePhrasalVerb = words[i] + ' ' + words[i + 1];
      const phrasalVerbVariations = PHRASAL_VERBS[possiblePhrasalVerb];
      if (phrasalVerbVariations) {
        // Replace with canonical form
        words[i] = possiblePhrasalVerb.replace(' ', '_');
        words.splice(i + 1, 1);
      }
    }

    // Handle contextual variations
    words = words.map(word => {
      for (const [primary, variations] of Object.entries(CONTEXTUAL_VARIATIONS)) {
        if (variations.includes(word)) {
          return primary;
        }
      }
      return word;
    });

    // Handle plurals
    words = words.map(word => {
      // Check irregular plurals first
      if (word in IRREGULAR_PLURALS) {
        return IRREGULAR_PLURALS[word];
      }
      
      // Check regular plural endings
      for (const ending of PLURAL_ENDINGS) {
        if (word.endsWith(ending)) {
          const singular = word.endsWith('ies') 
            ? word.slice(0, -3) + 'y'  // babies -> baby
            : word.slice(0, -ending.length);  // cats -> cat
          return singular;
        }
      }
      return word;
    });

    // Handle semantic groups
    words = words.map(word => {
      for (const [primary, synonyms] of Object.entries(SEMANTIC_GROUPS)) {
        if (synonyms.includes(word)) {
          return primary;
        }
      }
      return word;
    });

    // Process compound words
    const processedWords: string[] = [];
    const skipIndices = new Set<number>();

    // Check for compound words
    for (let i = 0; i < words.length; i++) {
      if (skipIndices.has(i)) continue;

      let foundCompound = false;
      for (const compound of COMPOUND_WORDS) {
        if (i + compound.length <= words.length) {
          const slice = words.slice(i, i + compound.length);
          if (compound.every((word, j) => word === slice[j])) {
            processedWords.push(compound.join('_'));
            for (let j = i; j < i + compound.length; j++) {
              skipIndices.add(j);
            }
            foundCompound = true;
            break;
          }
        }
      }

      if (!foundCompound && !skipIndices.has(i)) {
        processedWords.push(words[i]);
      }
    }

    // Sort processed words while keeping compound words intact
    return processedWords.sort().join(' ');
  };

  const normalizedEnglish = normalizeEnglish(english);

  // Check for duplicates using enhanced normalized comparison
  const isDuplicate = existingPhrases.some(p => 
    normalizeEnglish(p.english) === normalizedEnglish
  );

  if (isDuplicate) {
    console.warn(`Duplicate English phrase detected (normalized): "${english}"`);
    return false;
  }

  // Validate examples (now required)
  const examples = phraseData.examples as unknown[];
  // Validate each example sentence
  for (const ex of examples) {
    // Cast ex to unknown first for safety
    const exampleData = ex as unknown;
    if (!exampleData || typeof exampleData !== 'object') return false;
    const example = exampleData as Partial<ExampleSentence>;

    if (typeof example.thai !== 'string' || example.thai.trim() === '' ||
        typeof example.thaiMasculine !== 'string' || example.thaiMasculine.trim() === '' ||
        typeof example.thaiFeminine !== 'string' || example.thaiFeminine.trim() === '' ||
        typeof example.pronunciation !== 'string' || example.pronunciation.trim() === '' ||
        typeof example.translation !== 'string' || example.translation.trim() === '') {
      console.warn("Invalid example structure:", ex);
      return false;
    }
  }

  // Enhanced mnemonic validation
  if (phraseData.mnemonic !== undefined && phraseData.mnemonic !== null) {
    // Basic type check
    if (typeof phraseData.mnemonic !== 'string') return false;
    if (phraseData.mnemonic === '') {
      phraseData.mnemonic = undefined;
    } else {
      // Validate mnemonic content
      const mnemonic = phraseData.mnemonic.toLowerCase();
      
      // Check if mnemonic contains any reference to the Thai word's pronunciation
      const pronunciationParts = pronunciation.toLowerCase().split(/[-\s]+/);
      const hasPhoneticReference = pronunciationParts.some(part => 
        mnemonic.includes(part) || 
        // Check for similar sounds (basic phonetic matching)
        mnemonic.includes(part.replace(/[aeiou]/g, ''))
      );
      
      // Check if mnemonic references the meaning
      const meaningWords = english.toLowerCase().split(/\s+/);
      const hasMeaningReference = meaningWords.some(word => 
        mnemonic.includes(word) ||
        // Check for word stems
        (word.length > 4 && mnemonic.includes(word.slice(0, -2)))
      );
      
      // Reject if mnemonic doesn't help with either pronunciation or meaning
      if (!hasPhoneticReference && !hasMeaningReference) {
        console.warn(`Invalid mnemonic for "${thai}" (${english}): "${phraseData.mnemonic}"`);
        phraseData.mnemonic = undefined; // Clear invalid mnemonic
      }
    }
  }

  return true;
}

/**
 * Creates a BatchError object with the specified type and message
 */
function createBatchError(
  type: BatchErrorType, 
  message: string, 
  details?: unknown
): BatchError {
  return {
    type,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Main function to generate a complete custom flashcard set
 * Updated to handle cleverTitle generation
 */
export async function generateCustomSet(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  totalCount: number,
  onProgressUpdate?: (progress: { completed: number, total: number, latestPhrases?: Phrase[] }) => void
): Promise<GenerationResult> {
  try {
    if (onProgressUpdate) {
      onProgressUpdate({ completed: 0, total: totalCount });
    }
    console.log(`Starting card generation (OpenRouter): ${totalCount} total cards requested with preferences:`, preferences);
    
    // Use the first model as the primary for batch sizing
    let modelIndex = 0;
    let currentModel = TEXT_MODELS[modelIndex];
    let batchSize = getBatchSize(currentModel);
    const batchesNeeded = Math.ceil(totalCount / batchSize);
    
    const aggregatedErrors: (BatchError & { batchIndex: number })[] = [];
    const allPhrases: Phrase[] = [];
    let cleverTitle: string | undefined;
    const fallbackPhrases = INITIAL_PHRASES.slice(0, totalCount);
    let lastUsedTemperature: number | undefined;

    for (let i = 0; i < batchesNeeded; i++) {
      try {
        if (onProgressUpdate) {
          onProgressUpdate({ 
            completed: allPhrases.length, 
            total: totalCount,
            latestPhrases: allPhrases.slice(-3)
          });
        }
        const remaining = totalCount - allPhrases.length;
        // Always use the current model for batch size
        batchSize = getBatchSize(currentModel);
        const countForBatch = Math.min(remaining, batchSize);
        if (remaining <= 0) break;
        const existingPhrasesMeanings = allPhrases.map(p => p.english);
        const prompt = buildGenerationPrompt("", {
          ...preferences,
          count: countForBatch,
          existingPhrases: existingPhrasesMeanings,
        });
        let retries = 0;
        let batchResult: { phrases: Phrase[], cleverTitle?: string, error?: BatchError, temperature?: number } | null = null;
        // Try OpenRouter models first
        while (retries < MAX_RETRIES) {
          try {
            currentModel = TEXT_MODELS[modelIndex];
            batchSize = getBatchSize(currentModel);
            // Capture the result including temperature
            batchResult = await generateOpenRouterBatch(
              prompt, 
              [currentModel], 
              i,
              preferences.toneLevel // Pass toneLevel here
            );
            lastUsedTemperature = batchResult.temperature; // Store the temperature used
            if (batchResult.phrases.length > 0 || !batchResult.error) {
              break;
            } 
            console.error(`Batch ${i} attempt ${retries + 1} failed: ${batchResult.error?.message}`);
            retries++;
            // On retry, try the next model in the list
            if (modelIndex < TEXT_MODELS.length - 1) {
              modelIndex++;
            }
            currentModel = TEXT_MODELS[modelIndex];
            batchSize = getBatchSize(currentModel);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          } catch (error) {
            console.error(`Unexpected error in batch ${i} attempt ${retries + 1}:`, error);
            retries++;
            if (modelIndex < TEXT_MODELS.length - 1) {
              modelIndex++;
            }
            currentModel = TEXT_MODELS[modelIndex];
            batchSize = getBatchSize(currentModel);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        }
        if (batchResult) {
          if (i === 0 && batchResult.cleverTitle) {
            cleverTitle = batchResult.cleverTitle;
          }
          if (batchResult.phrases.length > 0) {
            allPhrases.push(...batchResult.phrases);
          }
          if (batchResult.error) {
            aggregatedErrors.push({
              ...batchResult.error,
              batchIndex: i
            });
            if (retries >= MAX_RETRIES) {
              console.error(`Batch ${i} failed after ${retries} retries. Aborting further generation.`);
            }
          }
        }
        if (onProgressUpdate) {
          const progressPercentage = Math.min(
            Math.floor((allPhrases.length / totalCount) * 100), 
            100
          );
          onProgressUpdate({ 
            completed: allPhrases.length, 
            total: totalCount,
            latestPhrases: batchResult?.phrases || []
          });
          console.log(`Batch ${i} complete. Progress: ${progressPercentage}% (${allPhrases.length}/${totalCount} cards)`);
        }
      } catch (error) {
        console.error(`Fatal error processing batch ${i}:`, error);
        const batchError: BatchError = createBatchError(
          'UNKNOWN', 
          `Unhandled error in batch ${i}: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        );
        aggregatedErrors.push({
          ...batchError,
          batchIndex: i,
        });
      }
    }
    
    // Check if we need to use fallback
    if (allPhrases.length === 0 && fallbackPhrases.length > 0) {
      console.log("No phrases generated. Using fallback data.");
      allPhrases.push(...fallbackPhrases);
      
      // Update progress one last time with fallback data
      if (onProgressUpdate) {
        onProgressUpdate({ 
          completed: allPhrases.length, 
          total: totalCount,
          latestPhrases: allPhrases.slice(-3)
        });
      }
    } else if (allPhrases.length < totalCount) {
      // We got some phrases but not enough - pad with fallback
      const shortfall = totalCount - allPhrases.length;
      if (shortfall > 0 && fallbackPhrases.length > 0) {
        console.log(`Generated only ${allPhrases.length} of ${totalCount} phrases. Adding ${shortfall} fallback phrases.`);
        allPhrases.push(...fallbackPhrases.slice(0, shortfall));
      }
    }
    
    // Prepare final error summary if needed
    let errorSummary: GenerationResult['errorSummary'] | undefined;
    if (aggregatedErrors.length > 0) {
      const errorTypes = Array.from(new Set(aggregatedErrors.map(e => e.type)));
      
      errorSummary = {
        errorTypes,
        totalErrors: aggregatedErrors.length,
        userMessage: `Set generation encountered ${aggregatedErrors.length} errors.`
      };
    }
    
    // Final result
    const result: GenerationResult = {
      phrases: allPhrases,
      cleverTitle,
      aggregatedErrors,
      errorSummary,
      llmBrand: 'OpenRouter',
      llmModel: TEXT_MODELS[0], // Record the primary model
      temperature: lastUsedTemperature // Add the last used temperature to the final result
    };
    
    return result;
  } catch (error) {
    console.error("Unhandled error in generateCustomSet:", error);
    return {
      phrases: [],
      aggregatedErrors: [{
        ...createBatchError(
          'UNKNOWN',
          `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        ),
        batchIndex: -1,
      }],
      errorSummary: {
        errorTypes: ['UNKNOWN'],
        totalErrors: 1,
        userMessage: 'An unexpected error occurred during set generation.'
      },
      temperature: undefined // Or calculate based on preferences if possible
    };
  }
}

/**
 * Creates a partial CustomSet object from generated phrases
 * (Mnemonics are handled separately)
 */
export function createCustomSet(
  name: string, 
  level: string, 
  specificTopics: string | undefined, 
  phrases: Phrase[],
  seriousness?: number // Optional
): Omit<CustomSet, 'mnemonics' | 'goals'> { // goals likely doesn't belong here
  return {
    name,
    level,
    specificTopics,
    createdAt: new Date().toISOString(),
    phrases,
    seriousness
  };
}

/**
 * Generates a single flashcard (useful for regenerating a specific card)
 * Enhanced with better error handling
 */
export async function generateSingleFlashcard(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  targetEnglishMeaning?: string
): Promise<{ phrase: Phrase | null, error?: BatchError }> {
  try {
    console.log(`Generating single flashcard with preferences:`, JSON.stringify(preferences));
    if (targetEnglishMeaning) {
      console.log(`Target English meaning for single card: ${targetEnglishMeaning}`);
    }
    
    const prompt = buildGenerationPrompt(preferences.specificTopics || '', {
      ...preferences,
      count: 1,
      existingPhrases: targetEnglishMeaning ? undefined : []
    }, targetEnglishMeaning ? [targetEnglishMeaning] : []);

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        console.log(`Single card generation attempt ${retries + 1}/${MAX_RETRIES}`);
        const result = await generateOpenRouterBatch(prompt, TEXT_MODELS, -1);
        
        if (result.error) {
          console.error(`Error generating single flashcard (attempt ${retries + 1}, type ${result.error.type}):`, result.error.message);
          retries++;
          
          if (!['NETWORK', 'API', 'UNKNOWN'].includes(result.error.type) || retries >= MAX_RETRIES) {
             console.error(`Max retries reached or non-retryable error (${result.error.type}) for single card.`);
             return { phrase: null, error: result.error };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        if (result.phrases.length > 0) {
          console.log(`Successfully generated single card: ${result.phrases[0].english}`);
          return { phrase: result.phrases[0] };
        }
        
        retries++;
        console.warn(`API succeeded but returned 0 phrases for single card generation (attempt ${retries})`);
        if (retries >= MAX_RETRIES) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));

      } catch (error: unknown) {
        retries++;
        console.error(`Uncaught error in single card generation (attempt ${retries}):`, error);
        if (retries >= MAX_RETRIES) {
          return { 
            phrase: null, 
            error: createBatchError('UNKNOWN', `Uncaught error generating single card: ${error instanceof Error ? error.message : String(error)}`, { error })
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    console.error('Failed to generate single flashcard after multiple attempts.');
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', 'Failed to generate single flashcard after multiple attempts (e.g., API consistently returned 0 phrases).', {})
    };

  } catch (error: unknown) {
    console.error("Unexpected error setting up generateSingleFlashcard:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', `Unexpected setup error in generateSingleFlashcard: ${errorMessage}`, { error })
    };
  }
}

// Utility to map toneLevel to temperature
function getTemperatureFromToneLevel(toneLevel: number | undefined): number {
  // Default to level 5 (balanced) if undefined
  const level = toneLevel ?? 5;
  
  // Clamp the level between 1 and 10
  const clampedLevel = Math.max(1, Math.min(10, level));
  
  // Create a more extreme non-linear progression:
  // Level 1: 0.1 (extremely conservative - textbook perfect)
  // Level 2-4: 0.3-0.5 (gradually allowing mild creativity)
  // Level 5-7: 0.7-0.9 (rapidly increasing chaos)
  // Level 8-10: 0.95-2.0 (maximum chaos, beyond normal bounds)
  
  const temperatureMap: Record<number, number> = {
    1: 0.1,   // Dead serious
    2: 0.3,   // Barely a smile
    3: 0.4,   // Slight humor
    4: 0.5,   // Last practical level
    5: 0.7,   // Starting to get weird
    6: 0.8,   // Definitely weird
    7: 0.9,   // Very weird
    8: 0.95,  // Reality-bending
    9: 1.5,   // Reality-breaking
    10: 2.0   // Maximum possible chaos
  };
  
  return temperatureMap[clampedLevel];
}

// Refactored OpenRouter call with fallback logic and temperature
async function callOpenRouterWithFallback(prompt: string, models: string[], temperature: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Enhanced logging for API key debugging
  if (!apiKey) {
    console.error("CRITICAL ERROR: Missing OPENROUTER_API_KEY environment variable.");
    console.error("Environment context: NODE_ENV =", process.env.NODE_ENV);
    console.error("API Keys available:", {
      "OPENROUTER_API_KEY": process.env.OPENROUTER_API_KEY ? "Defined" : "Undefined",
      "IDEOGRAM_API_KEY": process.env.IDEOGRAM_API_KEY ? "Defined" : "Undefined"
    });
    
    // Return empty JSON to trigger fallback mechanism
    return '{"phrases": [], "cleverTitle": "Sample Phrases"}';
  }
  
  let lastError: string | null = null;
  for (const model of models) {
    try {
      console.log(`Attempting generation with model: ${model} (temperature: ${temperature})`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Thai Flashcards App"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature
        })
      });
      if (!response.ok) {
        const errorStatus = response.status;
        const errorText = await response.text();
        console.error(`OpenRouter API Error for model ${model}:`, {
          status: errorStatus,
          body: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        try {
          const errorJson = JSON.parse(errorText);
          lastError = errorJson.error?.message || errorText;
        } catch {
          lastError = errorText;
        }
        console.log(`Failed with model ${model}, trying next model...`);
        continue;
      }
      const data: unknown = await response.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'choices' in data &&
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        typeof data.choices[0] === 'object' &&
        data.choices[0] !== null &&
        'message' in data.choices[0] &&
        typeof data.choices[0].message === 'object' &&
        data.choices[0].message !== null &&
        'content' in data.choices[0].message &&
        typeof data.choices[0].message.content === 'string'
      ) {
        const text = data.choices[0].message.content;
        if (!text) throw new Error("Empty content returned from OpenRouter");
        console.log(`Successfully generated set with model: ${model}`);
        return text;
      } else {
        console.error(`Unexpected OpenRouter response structure for model ${model}:`, data);
        lastError = `Unexpected response structure from ${model}`;
        console.log(`Failed with model ${model}, trying next model...`);
        continue;
      }
    } catch (error) {
      console.error(`Error calling OpenRouter model ${model}:`, error);
      lastError = error instanceof Error ? error.message : String(error);
      console.log(`Failed with model ${model}, trying next model...`);
      continue;
    }
  }
  throw new Error(lastError || "All OpenRouter models failed for set generation.");
}

// Update batch generator to use fallback logic and temperature
export async function generateOpenRouterBatch(
  prompt: string,
  models: string[],
  batchIndex: number,
  toneLevel?: number
): Promise<{phrases: Phrase[], cleverTitle?: string, error?: BatchError, temperature?: number}> {
  try {
    const temperature = getTemperatureFromToneLevel(toneLevel);
    const responseText = await callOpenRouterWithFallback(prompt, models, temperature);
    const cleanedText = responseText.replace(/^```json\s*|```$/g, '').trim();
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        phrases: [],
        error: createBatchError('PARSE', `Failed to parse API response (Batch ${batchIndex}): ${errorMessage}`, { responseText: cleanedText, parseError: String(parseError) }),
        temperature // Include temperature even on error
      };
    }
    if (typeof parsedResponse !== 'object' || parsedResponse === null || !('phrases' in parsedResponse) || !Array.isArray(parsedResponse.phrases)) {
      console.error(`Invalid JSON structure received (Batch ${batchIndex}): Expected { phrases: [...] }, got:`, parsedResponse);
      return {
        phrases: [],
        error: createBatchError('VALIDATION', `Invalid JSON structure received (Batch ${batchIndex}). Expected object with 'phrases' array.`, { parsedResponse }),
        temperature // Include temperature
      };
    }
    const cleverTitle = ('cleverTitle' in parsedResponse && typeof parsedResponse.cleverTitle === 'string') ? parsedResponse.cleverTitle : undefined;
    if ('cleverTitle' in parsedResponse && typeof parsedResponse.cleverTitle !== 'string') {
       console.warn(`Invalid cleverTitle type received (Batch ${batchIndex}), expected string, got ${typeof parsedResponse.cleverTitle}. Ignoring title.`);
    }
    const validatedPhrases: Phrase[] = [];
    const validationErrors: string[] = [];

    // Determine semantic check requirement based on tone level
    const tone = toneLevel ?? 5; // Default to 5 if undefined
    let performSemanticCheck: 'strict' | 'none' = 'none';
    if (tone >= 1 && tone <= 6) {
      performSemanticCheck = 'strict';
    }
    // No 'partial' for now, treat 7+ as 'none'

    for (const phraseData of parsedResponse.phrases) {
      // Basic structural validation
      if (!validatePhrase(phraseData, validatedPhrases)) {
        validationErrors.push(`Invalid phrase structure: ${JSON.stringify(phraseData).substring(0, 100)}...`);
        continue; // Skip to next phrase if basic structure fails
      }

      // Semantic Check (if required by tone)
      if (performSemanticCheck === 'strict') {
        // Placeholder for actual semantic check logic
        // For now, we assume it passes if basic validation passed.
        // TODO: Implement actual semantic validation (e.g., keyword checks, LLM call?)
        const isSemanticallyValid = true; // Replace with actual check
        if (!isSemanticallyValid) {
          validationErrors.push(`Failed semantic check (Tone ${tone}): ${JSON.stringify(phraseData).substring(0, 100)}...`);
          continue; // Skip semantically invalid phrases for strict tones
        }
      }

      // If passes all checks, add it
      const validatedPhrase = phraseData as Phrase;
      if (validatedPhrase.mnemonic === null) {
         validatedPhrase.mnemonic = undefined;
      }
      validatedPhrases.push(validatedPhrase);
    }

    if (validationErrors.length > 0) {
       console.warn(`Validation errors in batch ${batchIndex}:`, validationErrors);
      if (validatedPhrases.length === 0) {
        return {
          phrases: [],
          cleverTitle,
          error: createBatchError('VALIDATION', `All ${parsedResponse.phrases.length} phrases failed validation (Batch ${batchIndex}).`, { errors: validationErrors }),
          temperature // Include temperature
        };
      } else {
        console.warn(`Batch ${batchIndex} completed with ${validationErrors.length} validation errors out of ${parsedResponse.phrases.length} phrases. Returning ${validatedPhrases.length} valid phrases.`);
      }
    }
    if (validatedPhrases.length === 0 && !cleverTitle) {
        return {
            phrases: [],
            error: createBatchError('VALIDATION', `API returned empty or invalid phrases array and no title (Batch ${batchIndex})`, { parsedResponse }),
            temperature // Include temperature
        };
    }
    console.log(`Batch ${batchIndex} successful: Generated ${validatedPhrases.length} valid phrases.${cleverTitle ? ' Title: "' + cleverTitle + '"':''}`);
    return {
      phrases: validatedPhrases,
      cleverTitle,
      temperature // Include temperature in successful result
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in generateOpenRouterBatch (Batch ${batchIndex}):`, error);
    let errorType: BatchErrorType = 'UNKNOWN';
    if (errorMessage.includes('API error')) errorType = 'API';
    else if (errorMessage.includes('network') || errorMessage.includes('fetch')) errorType = 'NETWORK';
    const temperature = getTemperatureFromToneLevel(toneLevel); // Calculate temperature even on catch
    return {
      phrases: [],
      error: createBatchError(errorType, `General error processing batch ${batchIndex}: ${errorMessage}`, { error }),
      temperature // Include temperature
    };
  }
} 