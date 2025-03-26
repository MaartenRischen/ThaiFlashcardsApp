'use client';

import React, { useState, useEffect } from 'react';

interface Phrase {
  meaning: string;
  thai: string;
  pronunciation: string;  // This will be used for official phonetics
  mnemonic: string;
  examples: ExampleSentence[];  // Add example sentences
}

interface Review {
  date: string;
  difficulty: 'hard' | 'good' | 'easy';
  interval: number;
  easeFactor: number;
  repetitions: number;
}

interface CardProgress {
  [key: number]: {
    reviews: Review[];
    nextReviewDate: string;
  };
}

interface Stats {
  totalCards: number;
  newCards: number;
  dueCards: number;
  learnedCards: number;
  successRate: number;
  averageInterval: number;
  totalReviews: number;
  reviewsToday: number;
  streak: number;
  newCardsToday: number;
  maxNewCardsPerSession: number;
}

// Update MnemonicEdits interface to include pronunciation
interface MnemonicEdits {
  [key: number]: {
    text: string;
    pronunciation: string;
  };
}

// Add level-related interfaces
interface LevelProgress {
  currentLevel: number;
  currentBatch: number[];  // Current 5 cards being learned
  masteredCards: number[]; // All mastered cards
}

// Anki SRS constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL = 1; // 1 day
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_INTERVAL_MULTIPLIER = 2.5;

// Add these constants at the top with other constants
const MAX_NEW_CARDS_PER_DAY = 20;
const MIN_INTERVAL = 1; // Minimum interval in days
const MAX_INTERVAL = 36500; // Maximum interval in days (100 years)

// Add these constants for Anki's exact timing
const LEARNING_STEPS = [1, 10]; // Initial learning steps in minutes
const GRADUATING_INTERVAL = 1; // First interval after learning in days
const EASY_INTERVAL = 4; // Interval when rating Easy on new card
const NEW_CARDS_PER_DAY = 20;

// Add a new interface for the random sentence
interface RandomSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

// Replace the random phrases generator function with one that selects real examples
interface ExampleSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

// Update version info with new app name
const VERSION_INFO = {
  lastUpdated: new Date().toISOString(),
  version: "1.2.0",
  changes: "Added back all 30 phrases"
};

// Update phrases with real example sentences
const DEFAULT_PHRASES: Phrase[] = [
  {
    meaning: "Hello",
    thai: "สวัสดี",
    pronunciation: "sa-wat-dee",
    mnemonic: "Think: 'Swadee' - like saying 'sweet day' quickly",
    examples: [
      {
        thai: "สวัสดีตอนเช้า คุณสบายดีไหม",
        pronunciation: "sa-wat-dee ton chao, khun sa-bai dee mai",
        translation: "Good morning, how are you?"
      },
      {
        thai: "สวัสดีครับ ยินดีที่ได้รู้จัก",
        pronunciation: "sa-wat-dee krap, yin-dee tee dai roo-jak",
        translation: "Hello, nice to meet you."
      }
    ]
  },
  {
    meaning: "Thank you",
    thai: "ขอบคุณ",
    pronunciation: "khop-khun",
    mnemonic: "Think: 'Cope-Kun' - you cope with kindness",
    examples: [
      {
        thai: "ขอบคุณมากสำหรับความช่วยเหลือ",
        pronunciation: "khop-khun mak samrap kwam chuay lue",
        translation: "Thank you very much for your help."
      },
      {
        thai: "ขอบคุณสำหรับอาหารอร่อย",
        pronunciation: "khop-khun samrap a-han a-roi",
        translation: "Thank you for the delicious food."
      }
    ]
  },
  {
    meaning: "Yes",
    thai: "ใช่",
    pronunciation: "chai",
    mnemonic: "Think: 'Chai' - like the tea, say 'yes' to chai",
    examples: [
      {
        thai: "ใช่ ฉันเข้าใจแล้ว",
        pronunciation: "chai, chan kao-jai laew",
        translation: "Yes, I understand now."
      },
      {
        thai: "ใช่ นี่คือบ้านของฉัน",
        pronunciation: "chai, nee kue baan kong chan",
        translation: "Yes, this is my house."
      }
    ]
  },
  {
    meaning: "No",
    thai: "ไม่",
    pronunciation: "mai",
    mnemonic: "Think: 'My' - 'My answer is no'",
    examples: [
      {
        thai: "ไม่ ฉันไม่เอา",
        pronunciation: "mai, chan mai ao",
        translation: "No, I don't want it."
      },
      {
        thai: "ไม่ ฉันไม่ชอบอาหารเผ็ด",
        pronunciation: "mai, chan mai chop a-han pet",
        translation: "No, I don't like spicy food."
      }
    ]
  },
  {
    meaning: "How are you?",
    thai: "สบายดีไหม",
    pronunciation: "sa-bai-dee-mai",
    mnemonic: "Think: 'So bye, did I?' - asking about their well-being",
    examples: [
      {
        thai: "สบายดีไหม วันนี้อากาศดีนะ",
        pronunciation: "sa-bai-dee-mai, wan-nee a-kat dee na",
        translation: "How are you? The weather is nice today."
      },
      {
        thai: "คุณสบายดีไหม ไม่ได้เจอกันนานแล้ว",
        pronunciation: "khun sa-bai-dee-mai, mai dai jer gan naan laew",
        translation: "How are you? Haven't seen you in a long time."
      }
    ]
  },
  {
    meaning: "What is your name?",
    thai: "คุณชื่ออะไร",
    pronunciation: "khun cheu a-rai",
    mnemonic: "Think: 'Koon chew a rye' - asking someone's name over rye bread",
    examples: [
      {
        thai: "คุณชื่ออะไร ฉันชื่อนิดา",
        pronunciation: "khun cheu a-rai, chan cheu nida",
        translation: "What is your name? My name is Nida."
      },
      {
        thai: "สวัสดี คุณชื่ออะไรครับ",
        pronunciation: "sa-wat-dee, khun cheu a-rai krap",
        translation: "Hello, what is your name?"
      }
    ]
  },
  {
    meaning: "My name is...",
    thai: "ฉันชื่อ...",
    pronunciation: "chan cheu...",
    mnemonic: "Think: 'Chan chew' - I'm chewing as I tell my name",
    examples: [
      {
        thai: "ฉันชื่อปีเตอร์ ยินดีที่ได้รู้จัก",
        pronunciation: "chan cheu Peter, yin-dee tee dai roo-jak",
        translation: "My name is Peter, nice to meet you."
      },
      {
        thai: "สวัสดี ฉันชื่อมาร์ค ฉันมาจากอเมริกา",
        pronunciation: "sa-wat-dee, chan cheu Mark, chan ma jak america",
        translation: "Hello, my name is Mark. I'm from America."
      }
    ]
  },
  {
    meaning: "I don't understand",
    thai: "ฉันไม่เข้าใจ",
    pronunciation: "chan mai kao-jai",
    mnemonic: "Think: 'Chan my cow-chai' - my cow doesn't understand either",
    examples: [
      {
        thai: "ฉันไม่เข้าใจ พูดช้าๆ ได้ไหม",
        pronunciation: "chan mai kao-jai, pood cha cha dai mai",
        translation: "I don't understand. Can you speak slowly?"
      },
      {
        thai: "ขอโทษ ฉันไม่เข้าใจภาษาไทยดีนัก",
        pronunciation: "kor-tote, chan mai kao-jai pasa thai dee nak",
        translation: "Sorry, I don't understand Thai very well."
      }
    ]
  },
  {
    meaning: "Please speak slowly",
    thai: "กรุณาพูดช้าๆ",
    pronunciation: "ga-ru-na pood cha-cha",
    mnemonic: "Think: 'Karuna' (kindness) 'pood cha-cha' (speak cha-cha dance - slowly)",
    examples: [
      {
        thai: "กรุณาพูดช้าๆ ฉันเพิ่งเรียนภาษาไทย",
        pronunciation: "ga-ru-na pood cha-cha, chan peng rian pasa thai",
        translation: "Please speak slowly, I just started learning Thai."
      },
      {
        thai: "ขอโทษ กรุณาพูดช้าๆ หน่อยได้ไหม",
        pronunciation: "kor-tote, ga-ru-na pood cha-cha noi dai mai",
        translation: "Sorry, could you please speak a bit slower?"
      }
    ]
  },
  {
    meaning: "Where is the bathroom?",
    thai: "ห้องน้ำอยู่ที่ไหน",
    pronunciation: "hong-nam yoo tee-nai",
    mnemonic: "Think: 'Hong-nam' sounds like 'home' with 'nam' (water) - where's the water room?",
    examples: [
      {
        thai: "ขอโทษ ห้องน้ำอยู่ที่ไหนครับ",
        pronunciation: "kor-tote, hong-nam yoo tee-nai krap",
        translation: "Excuse me, where is the bathroom?"
      },
      {
        thai: "ห้องน้ำอยู่ที่ไหน ฉันหาไม่เจอ",
        pronunciation: "hong-nam yoo tee-nai, chan ha mai jer",
        translation: "Where is the bathroom? I can't find it."
      }
    ]
  },
  {
    meaning: "How much is this?",
    thai: "อันนี้เท่าไหร่",
    pronunciation: "an-nee tao-rai",
    mnemonic: "Think: 'Annie, tell me how much!'",
    examples: [
      {
        thai: "อันนี้เท่าไหร่ มันราคาแพงไปไหม",
        pronunciation: "an-nee tao-rai, man raka paeng pai mai",
        translation: "How much is this? Is it too expensive?"
      },
      {
        thai: "ขอโทษ อันนี้เท่าไหร่ครับ",
        pronunciation: "kor-tote, an-nee tao-rai krap",
        translation: "Excuse me, how much is this?"
      }
    ]
  },
  {
    meaning: "Delicious",
    thai: "อร่อย",
    pronunciation: "a-roi",
    mnemonic: "Think: 'Ah, royal' - food fit for royalty",
    examples: [
      {
        thai: "อาหารนี้อร่อยมาก ขอบคุณ",
        pronunciation: "a-han nee a-roi mak, khop-khun",
        translation: "This food is very delicious, thank you."
      },
      {
        thai: "ผัดไทยร้านนี้อร่อยที่สุด",
        pronunciation: "pad thai ran nee a-roi tee-soot",
        translation: "The pad thai at this place is the most delicious."
      }
    ]
  },
  {
    meaning: "Today",
    thai: "วันนี้",
    pronunciation: "wan-nee",
    mnemonic: "Think: 'One knee' - today I hurt one knee",
    examples: [
      {
        thai: "วันนี้อากาศดีมาก",
        pronunciation: "wan-nee a-kat dee mak",
        translation: "Today the weather is very nice."
      },
      {
        thai: "วันนี้คุณจะทำอะไร",
        pronunciation: "wan-nee khun ja tam a-rai",
        translation: "What will you do today?"
      }
    ]
  },
  {
    meaning: "Tomorrow",
    thai: "พรุ่งนี้",
    pronunciation: "proong-nee",
    mnemonic: "Think: 'Prune-knee' - tomorrow I'll fix my pruned knee",
    examples: [
      {
        thai: "พรุ่งนี้เราจะไปทะเล",
        pronunciation: "proong-nee rao ja pai ta-le",
        translation: "Tomorrow we will go to the beach."
      },
      {
        thai: "พรุ่งนี้ฉันต้องตื่นเช้า",
        pronunciation: "proong-nee chan tong teun chao",
        translation: "Tomorrow I have to wake up early."
      }
    ]
  },
  {
    meaning: "Yesterday",
    thai: "เมื่อวาน",
    pronunciation: "meua-wan",
    mnemonic: "Think: 'Mew-a-waan' - the cat meowed all day yesterday",
    examples: [
      {
        thai: "เมื่อวานฉันไปตลาด",
        pronunciation: "meua-wan chan pai ta-lad",
        translation: "Yesterday I went to the market."
      },
      {
        thai: "เมื่อวานอากาศร้อนมาก",
        pronunciation: "meua-wan a-kat ron mak",
        translation: "Yesterday the weather was very hot."
      }
    ]
  },
  {
    meaning: "Water",
    thai: "น้ำ",
    pronunciation: "nam",
    mnemonic: "Think: 'Nom' - like 'nom nom' drinking water",
    examples: [
      {
        thai: "ขอน้ำเปล่าหนึ่งแก้วครับ",
        pronunciation: "kor nam plao neung kaew krap",
        translation: "One glass of water, please."
      },
      {
        thai: "น้ำนี้ดื่มได้ไหม",
        pronunciation: "nam nee duem dai mai",
        translation: "Is this water drinkable?"
      }
    ]
  },
  {
    meaning: "Food",
    thai: "อาหาร",
    pronunciation: "a-han",
    mnemonic: "Think: 'A-han' - 'a hand' full of food",
    examples: [
      {
        thai: "อาหารไทยรสชาติเผ็ดมาก",
        pronunciation: "a-han thai rot chat pet mak",
        translation: "Thai food is very spicy."
      },
      {
        thai: "คุณชอบอาหารอะไร",
        pronunciation: "khun chop a-han a-rai",
        translation: "What food do you like?"
      }
    ]
  },
  {
    meaning: "Hot (temperature)",
    thai: "ร้อน",
    pronunciation: "ron",
    mnemonic: "Think: 'Ron is hot' - Ron is always complaining about the heat",
    examples: [
      {
        thai: "วันนี้อากาศร้อนมาก",
        pronunciation: "wan-nee a-kat ron mak",
        translation: "Today the weather is very hot."
      },
      {
        thai: "ระวัง อาหารนี้ร้อน",
        pronunciation: "ra-wang, a-han nee ron",
        translation: "Be careful, this food is hot."
      }
    ]
  },
  {
    meaning: "Cold",
    thai: "หนาว",
    pronunciation: "nao",
    mnemonic: "Think: 'Now' - 'right now' I feel cold",
    examples: [
      {
        thai: "ฉันรู้สึกหนาว เปิดแอร์เย็นเกินไป",
        pronunciation: "chan roo-suek nao, perd air yen gern pai",
        translation: "I feel cold, the air conditioning is too cool."
      },
      {
        thai: "ที่เชียงใหม่อากาศหนาวในฤดูหนาว",
        pronunciation: "tee chiang mai a-kat nao nai rue-du nao",
        translation: "In Chiang Mai, the weather is cold during winter."
      }
    ]
  },
  {
    meaning: "Good",
    thai: "ดี",
    pronunciation: "dee",
    mnemonic: "Think: 'Dee' - sounds like the English word 'D' (grade) - better than an F!",
    examples: [
      {
        thai: "อาหารนี้รสชาติดีมาก",
        pronunciation: "a-han nee rot chat dee mak",
        translation: "This food tastes very good."
      },
      {
        thai: "คุณทำงานได้ดีมาก",
        pronunciation: "khun tam-ngan dai dee mak",
        translation: "You work very well."
      }
    ]
  },
  {
    meaning: "Bad",
    thai: "แย่",
    pronunciation: "yae",
    mnemonic: "Think: 'Yuck' - that's bad",
    examples: [
      {
        thai: "วันนี้เป็นวันที่แย่มาก",
        pronunciation: "wan-nee pen wan tee yae mak",
        translation: "Today is a very bad day."
      },
      {
        thai: "อาหารนี้รสชาติแย่",
        pronunciation: "a-han nee rot chat yae",
        translation: "This food tastes bad."
      }
    ]
  },
  {
    meaning: "Big",
    thai: "ใหญ่",
    pronunciation: "yai",
    mnemonic: "Think: 'Y-eye' - big like your eye",
    examples: [
      {
        thai: "บ้านหลังนี้ใหญ่มาก",
        pronunciation: "baan lang nee yai mak",
        translation: "This house is very big."
      },
      {
        thai: "ฉันต้องการกระเป๋าใบใหญ่",
        pronunciation: "chan tong-gan kra-pao bai yai",
        translation: "I need a big bag."
      }
    ]
  },
  {
    meaning: "Small",
    thai: "เล็ก",
    pronunciation: "lek",
    mnemonic: "Think: 'Fleck' - something tiny like a fleck of dust",
    examples: [
      {
        thai: "ห้องนี้เล็กเกินไป",
        pronunciation: "hong nee lek gern pai",
        translation: "This room is too small."
      },
      {
        thai: "ฉันชอบสุนัขตัวเล็ก",
        pronunciation: "chan chop su-nak tua lek",
        translation: "I like small dogs."
      }
    ]
  },
  {
    meaning: "Left",
    thai: "ซ้าย",
    pronunciation: "sai",
    mnemonic: "Think: 'Sigh' - I sigh when I go left",
    examples: [
      {
        thai: "เลี้ยวซ้ายตรงแยกหน้า",
        pronunciation: "liao sai trong yak na",
        translation: "Turn left at the next intersection."
      },
      {
        thai: "ร้านอาหารอยู่ทางซ้ายมือ",
        pronunciation: "ran a-han yoo tang sai meu",
        translation: "The restaurant is on the left side."
      }
    ]
  },
  {
    meaning: "Right",
    thai: "ขวา",
    pronunciation: "kwaa",
    mnemonic: "Think: 'Qua' - like 'quaaaack' right turn for ducks",
    examples: [
      {
        thai: "เลี้ยวขวาที่ไฟแดง",
        pronunciation: "liao kwaa tee fai daeng",
        translation: "Turn right at the traffic light."
      },
      {
        thai: "ฉันถนัดมือขวา",
        pronunciation: "chan ta-nat meu kwaa",
        translation: "I am right-handed."
      }
    ]
  },
  {
    meaning: "One",
    thai: "หนึ่ง",
    pronunciation: "neung",
    mnemonic: "Think: 'Nung' - number one",
    examples: [
      {
        thai: "ฉันต้องการกาแฟหนึ่งแก้ว",
        pronunciation: "chan tong-gan ka-fae neung kaew",
        translation: "I want one cup of coffee."
      },
      {
        thai: "รถเมล์สายหนึ่งไปไหน",
        pronunciation: "rot-may sai neung pai nai",
        translation: "Where does bus number one go?"
      }
    ]
  },
  {
    meaning: "Two",
    thai: "สอง",
    pronunciation: "song",
    mnemonic: "Think: 'Song' - I sing two songs",
    examples: [
      {
        thai: "ฉันมีพี่น้องสองคน",
        pronunciation: "chan mee pee-nong song kon",
        translation: "I have two siblings."
      },
      {
        thai: "ขอน้ำสองขวดครับ",
        pronunciation: "kor nam song kuat krap",
        translation: "Two bottles of water, please."
      }
    ]
  },
  {
    meaning: "Three",
    thai: "สาม",
    pronunciation: "saam",
    mnemonic: "Think: 'Sam' - my friend Sam always counts to three",
    examples: [
      {
        thai: "ฉันต้องการจองห้องพักสามคืน",
        pronunciation: "chan tong-gan jong hong pak saam keun",
        translation: "I want to book a room for three nights."
      },
      {
        thai: "มีเด็กสามคนกำลังเล่นในสวน",
        pronunciation: "mee dek saam kon kam-lang len nai suan",
        translation: "There are three children playing in the park."
      }
    ]
  },
  {
    meaning: "Thank you very much",
    thai: "ขอบคุณมาก",
    pronunciation: "khop-khun mak",
    mnemonic: "Think: 'Cope-Kun Mark' - Mark copes with extreme kindness",
    examples: [
      {
        thai: "ขอบคุณมากที่ช่วยเหลือฉัน",
        pronunciation: "khop-khun mak tee chuay-lue chan",
        translation: "Thank you very much for helping me."
      },
      {
        thai: "ขอบคุณมากสำหรับของขวัญ",
        pronunciation: "khop-khun mak sam-rap kong-kwan",
        translation: "Thank you very much for the gift."
      }
    ]
  },
  {
    meaning: "You're welcome",
    thai: "ด้วยความยินดี",
    pronunciation: "duay kwaam yin-dee",
    mnemonic: "Think: 'Doo-why come yin-dee' - do why? because I come with pleasure",
    examples: [
      {
        thai: "ด้วยความยินดี ไม่เป็นไรครับ",
        pronunciation: "duay kwaam yin-dee, mai pen rai krap",
        translation: "You're welcome, it's nothing."
      },
      {
        thai: "ด้วยความยินดี ถ้าต้องการความช่วยเหลืออีกก็บอกได้",
        pronunciation: "duay kwaam yin-dee, ta tong-gan kwam chuay-lue eek gor bok dai",
        translation: "You're welcome, if you need more help just let me know."
      }
    ]
  },
  {
    meaning: "Sorry",
    thai: "ขอโทษ",
    pronunciation: "kor-tote",
    mnemonic: "Think: 'Core-toast' - I accidentally burned your toast, sorry!",
    examples: [
      {
        thai: "ขอโทษที่มาสาย รถติด",
        pronunciation: "kor-tote tee ma sai, rot tid",
        translation: "Sorry I'm late, traffic was bad."
      },
      {
        thai: "ขอโทษ ฉันไม่ได้ตั้งใจ",
        pronunciation: "kor-tote, chan mai dai tang jai",
        translation: "Sorry, I didn't mean to."
      }
    ]
  }
];

export default function ThaiFlashcards() {
  const [phrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  const [index, setIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [localMnemonics, setLocalMnemonics] = useState<MnemonicEdits>(() => {
    try {
      const saved = localStorage.getItem('mnemonicEdits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [cardProgress, setCardProgress] = useState<CardProgress>(() => {
    try {
      const saved = localStorage.getItem('cardProgress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const [levelProgress, setLevelProgress] = useState<LevelProgress>(() => {
    try {
      const saved = localStorage.getItem('levelProgress');
      return saved ? JSON.parse(saved) : {
        currentLevel: 1,
        currentBatch: [0, 1, 2, 3, 4],
        masteredCards: []
      };
    } catch {
      return {
        currentLevel: 1,
        currentBatch: [0, 1, 2, 3, 4],
        masteredCards: []
      };
    }
  });
  const [randomSentence, setRandomSentence] = useState<RandomSentence | null>(null);

  // Add ref to track previous showAnswer state
  const prevShowAnswerRef = React.useRef(false);

  useEffect(() => {
    localStorage.setItem('cardProgress', JSON.stringify(cardProgress));
  }, [cardProgress]);

  useEffect(() => {
    localStorage.setItem('mnemonicEdits', JSON.stringify(localMnemonics));
  }, [localMnemonics]);

  useEffect(() => {
    localStorage.setItem('autoplay', JSON.stringify(autoplay));
  }, [autoplay]);

  useEffect(() => {
    localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
  }, [levelProgress]);

  // Fix autoplay to only trigger when answer is first revealed
  useEffect(() => {
    // Only play audio when showAnswer changes from false to true
    if (autoplay && showAnswer && !prevShowAnswerRef.current && !isPlaying) {
      speak(phrases[index].thai);
    }
    // Update ref with current value for next render
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index]);

  const handlePhoneticChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMnemonics(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        pronunciation: e.target.value
      }
    }));
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMnemonics(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        text: e.target.value
      }
    }));
  };

  const speak = async (text: string) => {
    setIsPlaying(true);
    try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
      } catch (error) {
      console.error('Speech synthesis error:', error);
        setIsPlaying(false);
      }
  };

  // Helper function to calculate next interval using Anki SM-2 algorithm
  const calculateNextReview = (difficulty: 'hard' | 'good' | 'easy', currentProgress: any) => {
    const easeFactor = currentProgress?.reviews?.length > 0 
      ? currentProgress.reviews[currentProgress.reviews.length - 1].easeFactor 
      : INITIAL_EASE_FACTOR;
    
    let newEaseFactor = easeFactor;
    let interval = currentProgress?.reviews?.length > 0 
      ? currentProgress.reviews[currentProgress.reviews.length - 1].interval 
      : INITIAL_INTERVAL;
    let repetitions = currentProgress?.reviews?.length > 0
      ? currentProgress.reviews[currentProgress.reviews.length - 1].repetitions
      : 0;
      
    // Adjust ease factor based on difficulty
    if (difficulty === 'hard') {
      newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      interval = Math.max(MIN_INTERVAL, Math.ceil(interval * HARD_INTERVAL_MULTIPLIER));
      repetitions = 0; // Reset repetitions on hard
    } else if (difficulty === 'good') {
      interval = Math.ceil(interval * easeFactor);
      repetitions += 1;
    } else if (difficulty === 'easy') {
      newEaseFactor = easeFactor + 0.1;
      interval = Math.ceil(interval * EASY_INTERVAL_MULTIPLIER);
      repetitions += 1;
    }
    
    // Cap interval at max
    interval = Math.min(interval, MAX_INTERVAL);
    
    return { interval, easeFactor: newEaseFactor, repetitions };
  };

  // Update the handleCardAction function to save progress
  const handleCardAction = (difficulty: 'hard' | 'good' | 'easy') => {
    // Create or get the current card progress
    const currentProgress = cardProgress[index] || { reviews: [], nextReviewDate: new Date().toISOString() };
    
    // Calculate the next review data using the SM-2 algorithm
    const nextReviewData = calculateNextReview(difficulty, currentProgress);
    
    // Create the new review entry
    const newReview: Review = {
      date: new Date().toISOString(),
      difficulty,
      interval: nextReviewData.interval,
      easeFactor: nextReviewData.easeFactor,
      repetitions: nextReviewData.repetitions
    };
    
    // Calculate the next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewData.interval);
    
    // Update the card progress
    setCardProgress(prev => ({
      ...prev,
      [index]: {
        ...currentProgress,
        reviews: [...currentProgress.reviews, newReview],
        nextReviewDate: nextReviewDate.toISOString()
      }
    }));
    
    // Move to the next card
    setIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    setShowAnswer(false);
    setRandomSentence(null);
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Replace the random phrase generator function with one that selects real examples
  const generateRandomPhrase = () => {
    if (index === null) return "";
    
    const currentPhrase = phrases[index];
    
    // Select a random example sentence for the current phrase
    if (currentPhrase.examples && currentPhrase.examples.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentPhrase.examples.length);
      const example = currentPhrase.examples[randomIndex];
      
      setRandomSentence(example);
      return example.thai; // Return the Thai text for speaking
    }
    
    return currentPhrase.thai; // Fallback if no examples exist
  };

  // Add a function to calculate stats
  const calculateStats = () => {
    // Calculate total learned cards
    const learnedCards = Object.keys(cardProgress).length;
    
    // Calculate total reviews
    let totalReviews = 0;
    Object.values(cardProgress).forEach(card => {
      totalReviews += card.reviews.length;
    });
    
    // Count cards due today
    const today = new Date().toDateString();
    let dueCards = 0;
    Object.values(cardProgress).forEach(card => {
      const nextReviewDate = new Date(card.nextReviewDate).toDateString();
      if (nextReviewDate <= today) {
        dueCards++;
      }
    });
    
    return {
      totalCards: phrases.length,
      learnedCards,
      dueCards,
      totalReviews,
      remainingCards: phrases.length - learnedCards
    };
  };

  // Add a function to determine the status of a card
  const getCardStatus = (cardIndex: number) => {
    const card = cardProgress[cardIndex];
    
    // If no reviews, it's unseen
    if (!card || !card.reviews || card.reviews.length === 0) {
      return 'unseen';
    }
    
    // Get the last review
    const lastReview = card.reviews[card.reviews.length - 1];
    return lastReview.difficulty; // 'hard', 'good', or 'easy'
  };

  // Helper function to get status color and label
  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'unseen':
        return { color: 'bg-gray-500', label: 'Unseen' };
      case 'hard':
        return { color: 'bg-red-500', label: 'Wrong' };
      case 'good':
        return { color: 'bg-yellow-500', label: 'Correct' };
      case 'easy':
        return { color: 'bg-green-500', label: 'Easy' };
      default:
        return { color: 'bg-gray-500', label: 'Unseen' };
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <div className="w-full max-w-lg mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Donkey Bridge</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="neumorphic-button"
            >
              How It Works
            </button>
            <button
              onClick={() => setShowVocabulary(!showVocabulary)}
              className="neumorphic-button"
            >
              Vocabulary
            </button>
          </div>
        </div>

        {/* Card Status */}
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>Card {index + 1} of {phrases.length}</div>
          <div>Level {levelProgress.currentLevel}</div>
        </div>

        {/* Main Card */}
        <div className="neumorphic p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {phrases[index].meaning}
            </h2>
          </div>

          {/* Display random sentence if available */}
          {randomSentence && (
            <div className="p-4 space-y-2 rounded-xl bg-[#222] border border-[#333] neumorphic">
              <h3 className="text-sm text-blue-400 uppercase tracking-wider mb-1">In Context</h3>
              <p className="text-base text-white font-medium">{randomSentence.thai}</p>
              <p className="text-sm text-gray-400 italic">{randomSentence.pronunciation}</p>
              <p className="text-sm text-gray-300 mt-2">{randomSentence.translation}</p>
            </div>
          )}

          {showAnswer ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg">Thai: <span className="text-white">{phrases[index].thai}</span></p>
              </div>

              <div>
                <p className="text-gray-400">
                  Official phonetics: <span className="text-gray-300">{phrases[index].pronunciation}</span>
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Personal phonetics:</p>
                <input
                  type="text"
                  value={localMnemonics[index]?.pronunciation || phrases[index].pronunciation}
                  onChange={handlePhoneticChange}
                  className="neumorphic-input"
                  placeholder="Add your own phonetic spelling..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => speak(phrases[index].thai)}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  {isPlaying ? 'Playing...' : 'Play'}
                </button>
                <button
                  onClick={() => {
                    const phrase = generateRandomPhrase();
                    speak(phrase);
                  }}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  In Context
                </button>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Mnemonic:</p>
                <input
                  type="text"
                  value={localMnemonics[index]?.text || phrases[index].mnemonic}
                  onChange={handleMnemonicChange}
                  className="neumorphic-input"
                  placeholder="Add your own mnemonic..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleCardAction('hard')} 
                  className="neumorphic-button text-red-500"
                >
                  Wrong
                </button>
                <button 
                  onClick={() => handleCardAction('good')} 
                  className="neumorphic-button text-yellow-500"
                >
                  Correct
                </button>
                <button 
                  onClick={() => handleCardAction('easy')} 
                  className="neumorphic-button text-green-500"
                >
                  Easy
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setShowAnswer(true)}
                className="w-full neumorphic-button"
              >
                Show Answer
              </button>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div>
          <button
            onClick={handleResetAll}
            className="neumorphic-button text-red-500"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <div className="fixed bottom-16 right-4 z-20">
        <button
          onClick={() => setShowStats(!showStats)}
          className="settings-button"
        >
          ⚙️
        </button>
      </div>

      {/* Modals */}
      {showStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Statistics</h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const stats = calculateStats();
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.totalCards}</div>
                        <div className="text-sm text-gray-400">Total Cards</div>
                      </div>
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.learnedCards}</div>
                        <div className="text-sm text-gray-400">Cards Learned</div>
                      </div>
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">{stats.dueCards}</div>
                        <div className="text-sm text-gray-400">Cards Due</div>
                      </div>
                      <div className="neumorphic p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.totalReviews}</div>
                        <div className="text-sm text-gray-400">Total Reviews</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-bold mb-2">Progress</h3>
                      <div className="w-full bg-gray-800 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{ width: `${(stats.learnedCards / stats.totalCards) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-400 mt-1">
                        {Math.round((stats.learnedCards / stats.totalCards) * 100)}% Complete
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">How It Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                <strong className="text-white">Donkey Bridge:</strong> This app helps you learn Thai vocabulary using spaced repetition and mnemonics (memory aids or "donkey bridges").
              </p>
              
              <p>
                <strong className="text-white">Controls:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Show Answer</strong> - Reveals the Thai word, pronunciation and mnemonic.</li>
                <li><strong className="text-white">Play</strong> - Listen to the Thai pronunciation.</li>
                <li><strong className="text-white">In Context</strong> - See and hear the word used in a real Thai sentence.</li>
                <li><strong className="text-white">Autoplay</strong> - Automatically plays the pronunciation when you reveal the answer.</li>
              </ul>
              
              <p>
                <strong className="text-white">Learning:</strong> After reviewing a card, rate your knowledge:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-red-500">Wrong</strong> - You didn't remember it. Card will appear again soon.</li>
                <li><strong className="text-yellow-500">Correct</strong> - You remembered with some effort. Card will repeat at a moderate interval.</li>
                <li><strong className="text-green-500">Easy</strong> - You knew it well. Card will appear after a longer interval.</li>
              </ul>
              
              <p>
                <strong className="text-white">Personalization:</strong> You can customize mnemonics and phonetic spellings to help your learning.
              </p>
            </div>
          </div>
        </div>
      )}

      {showVocabulary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neumorphic max-w-md w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vocabulary List</h2>
              <button
                onClick={() => setShowVocabulary(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {phrases.map((phrase, idx) => {
                const isCurrentCard = idx === index;
                const status = getCardStatus(idx);
                const { color, label } = getStatusInfo(status);
                
                return (
                  <div 
                    key={idx}
                    className={`neumorphic p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors ${isCurrentCard ? 'border-l-4 border-blue-500' : ''}`}
                    onClick={() => {
                      setIndex(idx);
                      setShowVocabulary(false);
                      setShowAnswer(false);
                      setRandomSentence(null);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span>{phrase.meaning}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-400">
                        {phrase.thai}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${color.replace('bg-', 'bg-opacity-20 text-')}`}>
                        {label}
                      </span>
                      <button
                        className="neumorphic-circle opacity-75 hover:opacity-100 w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPlaying) {
                            speak(phrase.thai);
                          }
                        }}
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Version indicator at the bottom - shows changes and timestamp in Amsterdam timezone */}
      <div className="w-full py-2 px-3 text-center text-xs border-t border-gray-700 bg-gray-800 sticky bottom-0 z-20">
        <div className="flex flex-col sm:flex-row sm:justify-between items-center">
          <p className="text-gray-300 font-medium">
            v{VERSION_INFO.version} | {new Date(VERSION_INFO.lastUpdated).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
          </p>
          <p className="text-blue-400">Latest: {VERSION_INFO.changes}</p>
        </div>
      </div>
    </main>
  );
} 