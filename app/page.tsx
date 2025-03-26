'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";

interface ExampleSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

interface Phrase {
  thai: string;
  pronunciation: string;
  mnemonic: string;
  english: string;
  examples?: ExampleSentence[];
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

// Update MnemonicEdits interface to have a single text field
interface MnemonicEdits {
  [key: number]: {
    text: string;
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
  english: string;
}

// Replace the random phrases generator function with one that selects real examples
interface ExampleSentence {
  thai: string;
  pronunciation: string;
  translation: string;
}

// Update version info
const VERSION_INFO = {
  lastUpdated: new Date().toISOString(),
  version: "1.3.13",
  changes: "Improved mnemonic input field size and position"
};

const INITIAL_PHRASES: Phrase[] = [
  {
    english: "Hello",
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
    english: "Thank you",
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
    english: "Yes",
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
    english: "No",
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
    english: "How are you?",
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
    english: "What is your name?",
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
    english: "My name is...",
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
    english: "I don't understand",
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
    english: "Please speak slowly",
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
    english: "Where is the bathroom?",
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
    english: "How much is this?",
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
    english: "Delicious",
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
    english: "Today",
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
    english: "Tomorrow",
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
    english: "Yesterday",
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
    english: "Water",
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
    english: "Food",
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
    english: "Hot (temperature)",
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
    english: "Cold",
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
    english: "Good",
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
    english: "Bad",
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
    english: "Big",
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
    english: "Small",
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
    english: "Left",
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
    english: "Right",
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
    english: "One",
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
    english: "Two",
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
    english: "Three",
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
    english: "Thank you very much",
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
    english: "You're welcome",
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
    english: "Sorry",
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
  const [phrases] = useState<Phrase[]>(INITIAL_PHRASES);
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
  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('autoplay');
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });
  const [activeCards, setActiveCards] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('activeCards');
      return saved ? JSON.parse(saved) : [0, 1, 2, 3, 4]; // Default first 5 cards
    } catch {
      return [0, 1, 2, 3, 4];
    }
  });
  const [randomSentence, setRandomSentence] = useState<RandomSentence | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add ref to track previous showAnswer state
  const prevShowAnswerRef = React.useRef(false);

  // Load voices when component mounts
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log('Voices loaded:', voices.length);
        console.log('Thai voices:', voices.filter(v => v.lang.includes('th')).length);
      }
    }

    // Load voices immediately if available
    loadVoices();

    // Also listen for voices changed event
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

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
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
  }, [activeCards]);

  // Simplified speak function
  const speak = async (text: string) => {
    if (!voicesLoaded) {
      console.log('Voices not loaded yet');
      return;
    }

    setIsPlaying(true);
    
    try {
      // iOS requires cancelling any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      
      // Get Thai voice if available
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find(voice => voice.lang.includes('th'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      // iOS Safari requires a slight delay after cancel
      await new Promise(resolve => setTimeout(resolve, 100));

      return new Promise<void>((resolve, reject) => {
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          setIsPlaying(false);
          reject(event);
        };

        // iOS Safari sometimes needs a kick to start
        setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 1000);

        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error('Speech playback error:', error);
      setIsPlaying(false);
      alert('Speech playback failed. Please try tapping the screen first.');
    }
  };

  // Auto-play when answer is shown
  useEffect(() => {
    if (autoplay && showAnswer && !prevShowAnswerRef.current && !isPlaying && voicesLoaded) {
      speak(phrases[index].thai);
    }
    prevShowAnswerRef.current = showAnswer;
  }, [showAnswer, autoplay, phrases, index, isPlaying, voicesLoaded]);

  // Add a new useEffect to update the active cards on component mount and when cardProgress changes
  useEffect(() => {
    updateActiveCards();
  }, [cardProgress]);

  // Function to update active cards based on review status
  const updateActiveCards = () => {
    // Get all cards that are due for review (either unseen, marked wrong, or due today)
    const today = new Date();
    
    // First collect all unseen cards
    const unseenCards = [];
    for (let i = 0; i < phrases.length; i++) {
      if (!cardProgress[i] || !cardProgress[i].reviews || cardProgress[i].reviews.length === 0) {
        unseenCards.push(i);
      }
    }
    
    // Then collect all cards marked "hard" (wrong) in their last review
    const wrongCards = [];
    for (let i = 0; i < phrases.length; i++) {
      if (cardProgress[i] && cardProgress[i].reviews && cardProgress[i].reviews.length > 0) {
        const lastReview = cardProgress[i].reviews[cardProgress[i].reviews.length - 1];
        if (lastReview.difficulty === 'hard') {
          wrongCards.push(i);
        }
      }
    }
    
    // Then collect all due cards (cards that were previously marked "good" or "easy" and are due today)
    const dueCards = [];
    for (let i = 0; i < phrases.length; i++) {
      if (cardProgress[i] && cardProgress[i].nextReviewDate) {
        const nextReviewDate = new Date(cardProgress[i].nextReviewDate);
        if (nextReviewDate <= today && !wrongCards.includes(i)) {
          // Get last review to check if it was marked good or easy
          const lastReview = cardProgress[i].reviews[cardProgress[i].reviews.length - 1];
          if (lastReview.difficulty === 'good' || lastReview.difficulty === 'easy') {
            dueCards.push(i);
          }
        }
      }
    }
    
    // Prioritize wrong cards, then unseen cards, then due cards to get 5 active cards
    let newActiveCards = [...wrongCards];
    
    // Add unseen cards until we reach 5 cards or run out
    let remainingSlots = 5 - newActiveCards.length;
    if (remainingSlots > 0 && unseenCards.length > 0) {
      // Sort unseen cards by index to start with earlier cards
      const sortedUnseenCards = [...unseenCards].sort((a, b) => a - b);
      newActiveCards = [...newActiveCards, ...sortedUnseenCards.slice(0, remainingSlots)];
    }
    
    // If we still have slots, add due cards
    remainingSlots = 5 - newActiveCards.length;
    if (remainingSlots > 0 && dueCards.length > 0) {
      // Sort due cards by next review date (earliest first)
      const sortedDueCards = [...dueCards].sort((a, b) => {
        const dateA = new Date(cardProgress[a].nextReviewDate);
        const dateB = new Date(cardProgress[b].nextReviewDate);
        return dateA.getTime() - dateB.getTime();
      });
      newActiveCards = [...newActiveCards, ...sortedDueCards.slice(0, remainingSlots)];
    }
    
    // If we still have fewer than 5 cards, add cards that haven't been seen in a while
    remainingSlots = 5 - newActiveCards.length;
    if (remainingSlots > 0) {
      // Get all cards that aren't already in newActiveCards
      const remainingCards = [];
      for (let i = 0; i < phrases.length; i++) {
        if (!newActiveCards.includes(i)) {
          remainingCards.push(i);
        }
      }
      
      // Sort by last review date (oldest first) or by index if never reviewed
      const sortedRemainingCards = remainingCards.sort((a, b) => {
        // If neither card has been reviewed, sort by index
        if ((!cardProgress[a] || !cardProgress[a].reviews || cardProgress[a].reviews.length === 0) &&
            (!cardProgress[b] || !cardProgress[b].reviews || cardProgress[b].reviews.length === 0)) {
          return a - b;
        }
        
        // If only a has been reviewed, b comes first
        if (!cardProgress[b] || !cardProgress[b].reviews || cardProgress[b].reviews.length === 0) {
          return 1;
        }
        
        // If only b has been reviewed, a comes first
        if (!cardProgress[a] || !cardProgress[a].reviews || cardProgress[a].reviews.length === 0) {
          return -1;
        }
        
        // Both have been reviewed, sort by last review date
        const lastReviewA = new Date(cardProgress[a].reviews[cardProgress[a].reviews.length - 1].date);
        const lastReviewB = new Date(cardProgress[b].reviews[cardProgress[b].reviews.length - 1].date);
        return lastReviewA.getTime() - lastReviewB.getTime();
      });
      
      newActiveCards = [...newActiveCards, ...sortedRemainingCards.slice(0, remainingSlots)];
    }
    
    // If newActiveCards is empty (should not happen), use the first 5 cards
    if (newActiveCards.length === 0) {
      newActiveCards = [0, 1, 2, 3, 4];
    }
    
    // Update active cards if they have changed
    if (JSON.stringify(newActiveCards) !== JSON.stringify(activeCards)) {
      setActiveCards(newActiveCards);
      
      // If current index is not in active cards, update it to the first active card
      if (!newActiveCards.includes(index)) {
        setIndex(newActiveCards[0]);
      }
    }
  };

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMnemonics(prev => ({
      ...prev,
      [index]: {
        text: e.target.value
      }
    }));
  };

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Function to generate a random sentence
  const generateRandomPhrase = () => {
    const currentWord = phrases[index].thai;
    const examples = phrases[index].examples || [];
    
    if (examples.length > 0) {
      const randomIndex = Math.floor(Math.random() * examples.length);
      const example = examples[randomIndex];
      setRandomSentence({
        thai: example.thai,
        english: example.translation
      });
      setDialogOpen(true);
      return example.thai;
    } else {
      setRandomSentence(null);
      setDialogOpen(true);
      return currentWord;
    }
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

  // Modify handleCardAction to use the active cards
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
    
    // Move to the next card in the active cards list
    const currentActiveIndex = activeCards.indexOf(index);
    const nextActiveIndex = (currentActiveIndex + 1) % activeCards.length;
    setIndex(activeCards[nextActiveIndex]);
    setShowAnswer(false);
    setRandomSentence(null);
  };

  const prevCard = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const nextCard = () => {
    if (index < phrases.length - 1) {
      setIndex(index + 1);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <div className="w-full max-w-lg mx-auto p-4 space-y-4">
        {/* Header with Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-full bg-[#222] rounded-xl p-6 mb-4 flex items-center justify-between relative overflow-hidden neumorphic">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
              <svg viewBox="0 0 500 500" className="w-full h-full">
                <g fill="#FFD700">
                  <path d="M200 150l50-30 50 30-20-60h-60z"/>
                  <path d="M150 200l30-50 30 50-60-20z"/>
                  <path d="M300 200l-30-50-30 50 60-20z"/>
                </g>
              </svg>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16">
                <svg viewBox="0 0 500 500" className="w-full h-full">
                  <circle cx="250" cy="250" r="240" fill="#1a1a1a"/>
                  <path d="M250 50c110.457 0 200 89.543 200 200s-89.543 200-200 200S50 360.457 50 250 139.543 50 250 50" fill="#222"/>
                  <g fill="#FFD700">
                    <path d="M200 150l50-30 50 30-20-60h-60z"/>
                    <path d="M150 200l30-50 30 50-60-20z"/>
                    <path d="M300 200l-30-50-30 50 60-20z"/>
                  </g>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Donkey Bridge</h1>
                <p className="text-gray-400 text-sm">Thai Learning</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="neumorphic-button text-sm px-3 py-1"
              >
                How It Works
              </button>
              <button
                onClick={() => setShowVocabulary(!showVocabulary)}
                className="neumorphic-button text-sm px-3 py-1"
              >
                Vocabulary
              </button>
            </div>
          </div>
        </div>

        {/* Card Status */}
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>Card {activeCards.indexOf(index) + 1} of {activeCards.length} active</div>
          <div>{index + 1} of {phrases.length} total</div>
        </div>

        {/* Main Card */}
        <div className="neumorphic p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {phrases[index].english}
            </h2>
          </div>

          {/* Display random sentence if available */}
          {randomSentence && (
            <div className="p-4 space-y-2 rounded-xl bg-[#222] border border-[#333] neumorphic">
              <h3 className="text-sm text-blue-400 uppercase tracking-wider mb-1">In Context</h3>
              <p className="text-base text-white font-medium">{randomSentence.thai}</p>
              <p className="text-sm text-gray-400 italic">{randomSentence.english}</p>
            </div>
          )}

          {showAnswer ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg">Thai: <span className="text-white">{phrases[index].thai}</span></p>
              </div>

              <div>
                <p className="text-gray-400">
                  Official pronunciation: <span className="text-gray-300">{phrases[index].pronunciation}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => speak(phrases[index].thai)}
                  disabled={isPlaying}
                  className="neumorphic-button flex-1"
                >
                  {isPlaying ? 'Playing...' : 'Play'}
                </button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => {
                        const phrase = generateRandomPhrase();
                        if (phrase) {
                          speak(phrase);
                        }
                      }}
                      disabled={isPlaying}
                      className="neumorphic-button flex-1"
                    >
                      In Context
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Example Usage</DialogTitle>
                      <DialogDescription className="pt-4">
                        {randomSentence ? (
                          <div className="space-y-4">
                            <div className="text-xl font-medium text-white">
                              {randomSentence.thai}
                            </div>
                            <div className="text-gray-400">
                              {randomSentence.english}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            No example sentences available for this word.
                          </div>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
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

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400">What does this sound like for you?</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setLocalMnemonics(prev => ({
                          ...prev,
                          [index]: {
                            text: phrases[index].mnemonic
                          }
                        }));
                      }}
                      className="neumorphic-button text-sm px-2 py-1"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(localMnemonics);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const exportFileDefaultName = 'mnemonics.json';
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      className="neumorphic-button text-sm px-2 py-1"
                    >
                      Export All
                    </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const importedMnemonics = JSON.parse(event.target?.result as string);
                                setLocalMnemonics(importedMnemonics);
                              } catch (error) {
                                alert('Invalid file format');
                              }
                            };
                            reader.readAsText(file);
                          }
                        };
                        input.click();
                      }}
                      className="neumorphic-button text-sm px-2 py-1"
                    >
                      Import All
                    </button>
                  </div>
                </div>
                <textarea
                  value={localMnemonics[index]?.text || phrases[index].mnemonic}
                  onChange={(e) => handleMnemonicChange(e)}
                  className="neumorphic-input w-full min-h-[120px] resize-none p-4 rounded-sm"
                  placeholder="Add your own way to remember this sound..."
                />
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

        {/* Reset Button and Autoplay toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleResetAll}
            className="neumorphic-button text-red-500"
          >
            Reset All
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Autoplay</span>
            <Switch checked={autoplay} onCheckedChange={setAutoplay} />
          </div>
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
          <div className="neumorphic max-w-md w-full p-6">
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
                <strong className="text-white">Donkey Bridge</strong> uses spaced repetition to help you learn Thai vocabulary efficiently.
              </p>
              
              <p>
                <strong className="text-white">Active Cards:</strong> The app keeps 5 cards in active rotation that need your attention. These are cards you haven't seen, got wrong, or are due for review today.
              </p>
              
              <p>
                <strong className="text-white">Spaced Repetition:</strong> When you rate a card:
              </p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-red-500">Wrong</strong> - You didn't remember it. Card will appear again soon.</li>
                <li><strong className="text-yellow-500">Correct</strong> - You remembered with some effort. Card will repeat at a moderate interval.</li>
                <li><strong className="text-green-500">Easy</strong> - You knew it well. Card will appear after a longer interval.</li>
              </ul>
              
              <p>
                <strong className="text-white">Personalization:</strong> You can customize mnemonics and phonetic spellings to help your learning.
              </p>
              
              <p>
                <strong className="text-white">Example Sentences:</strong> Each word comes with authentic Thai example sentences to learn the word in context.
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
                      <span>{phrase.english}</span>
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