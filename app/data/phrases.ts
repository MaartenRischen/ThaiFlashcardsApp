export interface ExampleSentence {
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  translation: string;
}

export interface Phrase {
  english: string;
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  mnemonic?: string;
  // Optional literal/verbatim meaning to display before the idiomatic English
  literal?: string;
  examples: ExampleSentence[]; // REQUIRED: Must have at least 2 example sentences
}

export const INITIAL_PHRASES: Phrase[] = [
  {
    english: "Hello",
    thai: "สวัสดี",
    thaiMasculine: "สวัสดีครับ",
    thaiFeminine: "สวัสดีค่ะ",
    pronunciation: "sa-wat-dee",
    mnemonic: "Think: 'Swadee' - like saying 'sweet day' quickly",
    literal: "Safe auspicious",
    examples: [
      {
        thai: "สวัสดีตอนเช้า",
        thaiMasculine: "สวัสดีตอนเช้าครับ",
        thaiFeminine: "สวัสดีตอนเช้าค่ะ",
        pronunciation: "sa-wat-dee ton chao",
        translation: "Good morning."
      },
      {
        thai: "สวัสดี คุณสบายดีไหม",
        thaiMasculine: "สวัสดีครับ คุณสบายดีไหมครับ",
        thaiFeminine: "สวัสดีค่ะ คุณสบายดีไหมคะ",
        pronunciation: "sa-wat-dee, khun sa-bai-dee mai",
        translation: "Hello, how are you?"
      },
      {
        thai: "สวัสดี คุณต้องการความช่วยเหลือไหม",
        thaiMasculine: "สวัสดีครับ คุณต้องการความช่วยเหลือไหมครับ",
        thaiFeminine: "สวัสดีค่ะ คุณต้องการความช่วยเหลือไหมคะ",
        pronunciation: "sa-wat-dee, khun tong-kan kwam chuay-lue mai",
        translation: "Hello, do you need any help?"
      },
      {
        thai: "สวัสดี ขอโทษที่มาสาย",
        thaiMasculine: "สวัสดีครับ ขอโทษที่มาสายครับ",
        thaiFeminine: "สวัสดีค่ะ ขอโทษที่มาสายค่ะ",
        pronunciation: "sa-wat-dee, khor-thot thee ma sai",
        translation: "Hello, sorry I'm late."
      },
      {
        thai: "สวัสดี อากาศดีนะวันนี้",
        thaiMasculine: "สวัสดีครับ อากาศดีนะวันนี้ครับ",
        thaiFeminine: "สวัสดีค่ะ อากาศดีนะวันนี้ค่ะ",
        pronunciation: "sa-wat-dee, a-kat dee na wan-nee",
        translation: "Hello, the weather is nice today."
      }
    ]
  },
  {
    english: "Thank you",
    thai: "ขอบคุณ",
    thaiMasculine: "ขอบคุณครับ",
    thaiFeminine: "ขอบคุณค่ะ",
    pronunciation: "khop-khun",
    mnemonic: "Think: 'Cope-Kun' - you cope with kindness",
    literal: "Request merit",
    examples: [
      {
        thai: "ขอบคุณมากสำหรับความช่วยเหลือ",
        thaiMasculine: "ขอบคุณมากสำหรับความช่วยเหลือครับ",
        thaiFeminine: "ขอบคุณมากสำหรับความช่วยเหลือค่ะ",
        pronunciation: "khop-khun mak samrap kwam chuay-lue",
        translation: "Thank you very much for your help."
      },
      {
        thai: "ขอบคุณมากสำหรับอาหารอร่อย",
        thaiMasculine: "ขอบคุณมากสำหรับอาหารอร่อยครับ",
        thaiFeminine: "ขอบคุณมากสำหรับอาหารอร่อยค่ะ",
        pronunciation: "khop-khun mak samrap a-han a-roi",
        translation: "Thank you for the delicious food."
      },
      {
        thai: "ขอบคุณสำหรับของขวัญ",
        thaiMasculine: "ขอบคุณสำหรับของขวัญครับ",
        thaiFeminine: "ขอบคุณสำหรับของขวัญค่ะ",
        pronunciation: "khop-khun samrap kong-kwan",
        translation: "Thank you for the gift."
      },
      {
        thai: "ขอบคุณที่มาตรงเวลา",
        thaiMasculine: "ขอบคุณที่มาตรงเวลาครับ",
        thaiFeminine: "ขอบคุณที่มาตรงเวลาค่ะ",
        pronunciation: "khop-khun tee ma trong we-la",
        translation: "Thank you for being on time."
      },
      {
        thai: "ขอบคุณที่เข้าใจ",
        thaiMasculine: "ขอบคุณที่เข้าใจครับ",
        thaiFeminine: "ขอบคุณที่เข้าใจค่ะ",
        pronunciation: "khop-khun tee kao-jai",
        translation: "Thank you for understanding."
      }
    ]
  },
  {
    english: "Yes",
    thai: "ใช่",
    thaiMasculine: "ใช่ครับ",
    thaiFeminine: "ใช่ค่ะ",
    pronunciation: "chai",
    mnemonic: "Think: 'Chai' - like the tea, say 'yes' to chai",
    literal: "Yes",
    examples: [
      {
        thai: "ใช่ ฉันเข้าใจ",
        thaiMasculine: "ใช่ครับ ผมเข้าใจครับ",
        thaiFeminine: "ใช่ค่ะ ฉันเข้าใจค่ะ",
        pronunciation: "chai, phom/chan kao-jai",
        translation: "Yes, I understand."
      },
      {
        thai: "ใช่ นั่นถูกต้อง",
        thaiMasculine: "ใช่ครับ นั่นถูกต้องครับ",
        thaiFeminine: "ใช่ค่ะ นั่นถูกต้องค่ะ",
        pronunciation: "chai, nan took-tong",
        translation: "Yes, that's correct."
      },
      {
        thai: "ใช่ ฉันต้องการ",
        thaiMasculine: "ใช่ครับ ผมต้องการครับ",
        thaiFeminine: "ใช่ค่ะ ฉันต้องการค่ะ",
        pronunciation: "chai, phom/chan tong-kan",
        translation: "Yes, I want it."
      },
      {
        thai: "ใช่ ฉันเป็นคนไทย",
        thaiMasculine: "ใช่ครับ ผมเป็นคนไทยครับ",
        thaiFeminine: "ใช่ค่ะ ฉันเป็นคนไทยค่ะ",
        pronunciation: "chai, phom/chan pen kon thai",
        translation: "Yes, I am Thai."
      },
      {
        thai: "ใช่ ฉันเคยไปที่นั่นมาแล้ว",
        thaiMasculine: "ใช่ครับ ผมเคยไปที่นั่นมาแล้วครับ",
        thaiFeminine: "ใช่ค่ะ ฉันเคยไปที่นั่นมาแล้วค่ะ",
        pronunciation: "chai, phom/chan koey pai tee nan ma laew",
        translation: "Yes, I have been there before."
      }
    ]
  },
  {
    english: "No",
    thai: "ไม่",
    thaiMasculine: "ไม่ครับ",
    thaiFeminine: "ไม่ค่ะ",
    pronunciation: "mai",
    mnemonic: "Think: 'My' - 'My answer is no'",
    literal: "Not",
    examples: [
      {
        thai: "ไม่ ขอบคุณ",
        thaiMasculine: "ไม่ครับ ขอบคุณครับ",
        thaiFeminine: "ไม่ค่ะ ขอบคุณค่ะ",
        pronunciation: "mai, khop-khun",
        translation: "No, thank you."
      },
      {
        thai: "ไม่ ฉันไม่ชอบอาหารเผ็ด",
        thaiMasculine: "ไม่ครับ ผมไม่ชอบอาหารเผ็ด",
        thaiFeminine: "ไม่ค่ะ ฉันไม่ชอบอาหารเผ็ด",
        pronunciation: "mai, phom/chan mai chop a-han pet",
        translation: "No, I don't like spicy food."
      },
      {
        thai: "ไม่ ฉันไม่มีเวลา",
        thaiMasculine: "ไม่ครับ ผมไม่มีเวลา",
        thaiFeminine: "ไม่ค่ะ ฉันไม่มีเวลา",
        pronunciation: "mai, phom/chan mai mee we-la",
        translation: "No, I don't have time."
      },
      {
        thai: "ไม่ มันไม่ใช่ของฉัน",
        thaiMasculine: "ไม่ครับ มันไม่ใช่ของผม",
        thaiFeminine: "ไม่ค่ะ มันไม่ใช่ของฉัน",
        pronunciation: "mai, man mai chai kong phom/chan",
        translation: "No, it's not mine."
      },
      {
        thai: "ไม่ ฉันไม่เคยไปที่นั่น",
        thaiMasculine: "ไม่ครับ ผมไม่เคยไปที่นั่น",
        thaiFeminine: "ไม่ค่ะ ฉันไม่เคยไปที่นั่น",
        pronunciation: "mai, phom/chan mai koey pai tee nan",
        translation: "No, I've never been there."
      }
    ]
  },
  {
    english: "How are you?",
    thai: "สบายดีไหม",
    thaiMasculine: "สบายดีไหมครับ",
    thaiFeminine: "สบายดีไหมคะ",
    pronunciation: "sa-bai-dee-mai",
    mnemonic: "Think: 'So bye, did I?' - asking about their well-being",
    examples: [
      {
        thai: "สบายดีไหม วันนี้",
        thaiMasculine: "สบายดีไหมครับ วันนี้",
        thaiFeminine: "สบายดีไหมคะ วันนี้",
        pronunciation: "sa-bai-dee-mai wan-nee",
        translation: "How are you today?"
      },
      {
        thai: "คุณสบายดีไหม ไม่ได้เจอกันนานแล้ว",
        thaiMasculine: "คุณสบายดีไหมครับ ไม่ได้เจอกันนานแล้ว",
        thaiFeminine: "คุณสบายดีไหมคะ ไม่ได้เจอกันนานแล้ว",
        pronunciation: "khun sa-bai-dee-mai, mai dai jer gan naan laew",
        translation: "How are you? Haven't seen you in a long time."
      },
      {
        thai: "คุณสบายดีไหม หลังจากเดินทาง",
        thaiMasculine: "คุณสบายดีไหมครับ หลังจากเดินทาง",
        thaiFeminine: "คุณสบายดีไหมคะ หลังจากเดินทาง",
        pronunciation: "khun sa-bai-dee-mai, lang jak dern tang",
        translation: "How are you after your trip?"
      },
      {
        thai: "สบายดีไหม ดูคุณเหนื่อย",
        thaiMasculine: "สบายดีไหมครับ ดูคุณเหนื่อย",
        thaiFeminine: "สบายดีไหมคะ ดูคุณเหนื่อย",
        pronunciation: "sa-bai-dee-mai, doo khun neuay",
        translation: "How are you? You look tired."
      },
      {
        thai: "ครอบครัวคุณสบายดีไหม",
        thaiMasculine: "ครอบครัวคุณสบายดีไหมครับ",
        thaiFeminine: "ครอบครัวคุณสบายดีไหมคะ",
        pronunciation: "krob-krua khun sa-bai-dee-mai",
        translation: "How is your family?"
      }
    ]
  },
  {
    english: "What is your name?",
    thai: "คุณชื่ออะไร",
    thaiMasculine: "คุณชื่ออะไรครับ",
    thaiFeminine: "คุณชื่ออะไรคะ",
    pronunciation: "khun cheu a-rai",
    mnemonic: "Think: 'Koon chew a rye' - asking someone's name over rye bread",
    examples: [
      {
        thai: "คุณชื่ออะไร",
        thaiMasculine: "คุณชื่ออะไรครับ",
        thaiFeminine: "คุณชื่ออะไรคะ",
        pronunciation: "khun cheu a-rai",
        translation: "What is your name?"
      },
      {
        thai: "ขอถามหน่อย คุณชื่ออะไร",
        thaiMasculine: "ขอถามหน่อยครับ คุณชื่ออะไรครับ",
        thaiFeminine: "ขอถามหน่อยค่ะ คุณชื่ออะไรคะ",
        pronunciation: "khor tam noi, khun cheu a-rai",
        translation: "May I ask, what is your name?"
      },
      {
        thai: "ผมยังไม่ทราบชื่อคุณ",
        thaiMasculine: "ผมยังไม่ทราบชื่อคุณครับ",
        thaiFeminine: "ฉันยังไม่ทราบชื่อคุณค่ะ",
        pronunciation: "phom/chan yang mai sap cheu khun",
        translation: "I don't know your name yet."
      },
      {
        thai: "คุณชื่ออะไร ฉันชื่อนิดา",
        thaiMasculine: "คุณชื่ออะไรครับ ผมชื่อนิดา",
        thaiFeminine: "คุณชื่ออะไรคะ ฉันชื่อนิดา",
        pronunciation: "khun cheu a-rai, phom/chan cheu Nida",
        translation: "What is your name? My name is Nida."
      },
      {
        thai: "รบกวนบอกชื่อของคุณหน่อย",
        thaiMasculine: "รบกวนบอกชื่อของคุณหน่อยครับ",
        thaiFeminine: "รบกวนบอกชื่อของคุณหน่อยค่ะ",
        pronunciation: "rob-kuan bok cheu khong khun noi",
        translation: "Could you please tell me your name?"
      }
    ]
  },
  {
    english: "My name is...",
    thai: "ชื่อ...",
    thaiMasculine: "ผมชื่อ...",
    thaiFeminine: "ฉันชื่อ...",
    pronunciation: "phom/chan cheu...",
    mnemonic: "Think: 'Phom/Chan chew' - I'm chewing as I tell my name",
    examples: [
      {
        thai: "ชื่อปีเตอร์ ยินดีที่ได้รู้จัก",
        thaiMasculine: "ผมชื่อปีเตอร์ ยินดีที่ได้รู้จักครับ",
        thaiFeminine: "ฉันชื่อปีเตอร์ ยินดีที่ได้รู้จักค่ะ",
        pronunciation: "phom/chan cheu Peter, yin-dee thee dai ru-jak",
        translation: "My name is Peter. Nice to meet you."
      },
      {
        thai: "ชื่อแอนนา มาจากอเมริกา",
        thaiMasculine: "ผมชื่อแอนนา มาจากอเมริกาครับ",
        thaiFeminine: "ฉันชื่อแอนนา มาจากอเมริกาค่ะ",
        pronunciation: "phom/chan cheu Anna, ma jak America",
        translation: "My name is Anna. I'm from America."
      },
      {
        thai: "ชื่อมาร์ค เป็นนักท่องเที่ยว",
        thaiMasculine: "ผมชื่อมาร์ค เป็นนักท่องเที่ยวครับ",
        thaiFeminine: "ฉันชื่อมาร์ค เป็นนักท่องเที่ยวค่ะ",
        pronunciation: "phom/chan cheu Mark, pen nak-tong-tiew",
        translation: "My name is Mark. I'm a tourist."
      },
      {
        thai: "ชื่อโทมัส ชอบอาหารไทยมาก",
        thaiMasculine: "ผมชื่อโทมัส ชอบอาหารไทยมากครับ",
        thaiFeminine: "ฉันชื่อโทมัส ชอบอาหารไทยมากค่ะ",
        pronunciation: "phom/chan cheu Thomas, chop a-han thai mak",
        translation: "My name is Thomas. I really like Thai food."
      },
      {
        thai: "ชื่อซาร่า กำลังเรียนภาษาไทย",
        thaiMasculine: "ผมชื่อซาร่า กำลังเรียนภาษาไทยครับ",
        thaiFeminine: "ฉันชื่อซาร่า กำลังเรียนภาษาไทยค่ะ",
        pronunciation: "phom/chan cheu Sarah, gam-lang rian phasa-thai",
        translation: "My name is Sarah. I'm learning Thai."
      }
    ]
  },
  {
    english: "I don't understand",
    thai: "ไม่เข้าใจ",
    thaiMasculine: "ผมไม่เข้าใจครับ",
    thaiFeminine: "ฉันไม่เข้าใจค่ะ",
    pronunciation: "phom/chan mai kao-jai",
    mnemonic: "Think: 'My cow-chai' - my cow doesn't understand",
    examples: [
      {
        thai: "ไม่เข้าใจ พูดช้าๆ ได้ไหม",
        thaiMasculine: "ผมไม่เข้าใจ พูดช้าๆ ได้ไหมครับ",
        thaiFeminine: "ฉันไม่เข้าใจ พูดช้าๆ ได้ไหมคะ",
        pronunciation: "phom/chan mai kao-jai, pood cha-cha dai mai",
        translation: "I don't understand. Can you speak more slowly?"
      },
      {
        thai: "ขอโทษ ไม่เข้าใจภาษาไทยดีนัก",
        thaiMasculine: "ขอโทษครับ ผมไม่เข้าใจภาษาไทยดีนักครับ",
        thaiFeminine: "ขอโทษค่ะ ฉันไม่เข้าใจภาษาไทยดีนักค่ะ",
        pronunciation: "khor-thot, phom/chan mai kao-jai phasa-thai dee nak",
        translation: "Sorry, I don't understand Thai very well."
      },
      {
        thai: "ฉันไม่เข้าใจ ช่วยอธิบายอีกครั้งได้ไหม",
        thaiMasculine: "ผมไม่เข้าใจครับ ช่วยอธิบายอีกครั้งได้ไหมครับ",
        thaiFeminine: "ฉันไม่เข้าใจค่ะ ช่วยอธิบายอีกครั้งได้ไหมคะ",
        pronunciation: "phom/chan mai kao-jai krap/ka, chuay a-ti-bai eek krang dai mai",
        translation: "I don't understand. Could you explain again, please?"
      },
      {
        thai: "ฉันไม่เข้าใจคำนี้ มันแปลว่าอะไร",
        thaiMasculine: "ผมไม่เข้าใจคำนี้ครับ มันแปลว่าอะไร",
        thaiFeminine: "ฉันไม่เข้าใจคำนี้ค่ะ มันแปลว่าอะไร",
        pronunciation: "phom/chan mai kao-jai kam nee, man plae wa a-rai",
        translation: "I don't understand this word. What does it mean?"
      },
      {
        thai: "ฉันฟังไม่เข้าใจ คุณช่วยเขียนให้ดูได้ไหม",
        thaiMasculine: "ผมฟังไม่เข้าใจครับ คุณช่วยเขียนให้ดูได้ไหมครับ",
        thaiFeminine: "ฉันฟังไม่เข้าใจค่ะ คุณช่วยเขียนให้ดูได้ไหมคะ",
        pronunciation: "phom/chan fang mai kao-jai krap/ka, khun chuay kian hai doo dai mai",
        translation: "I don't understand what I'm hearing. Could you write it down for me?"
      }
    ]
  },
  {
    english: "Please speak slowly",
    thai: "กรุณาพูดช้าๆ",
    thaiMasculine: "กรุณาพูดช้าๆ ครับ",
    thaiFeminine: "กรุณาพูดช้าๆ ค่ะ",
    pronunciation: "ga-ru-na pood cha-cha",
    mnemonic: "Think: 'Karuna' (kindness) 'pood cha-cha' (speak cha-cha dance - slowly)",
    examples: [
      {
        thai: "กรุณาพูดช้าๆ ฉันกำลังเรียนภาษาไทย",
        thaiMasculine: "กรุณาพูดช้าๆ ครับ ผมกำลังเรียนภาษาไทย",
        thaiFeminine: "กรุณาพูดช้าๆ ค่ะ ฉันกำลังเรียนภาษาไทย",
        pronunciation: "ga-ru-na pood cha-cha, phom/chan gam-lang rian phasa-thai",
        translation: "Please speak slowly. I'm learning Thai."
      },
      {
        thai: "กรุณาพูดช้าๆ ฉันไม่เข้าใจเมื่อคุณพูดเร็ว",
        thaiMasculine: "กรุณาพูดช้าๆ ครับ ผมไม่เข้าใจเมื่อคุณพูดเร็ว",
        thaiFeminine: "กรุณาพูดช้าๆ ค่ะ ฉันไม่เข้าใจเมื่อคุณพูดเร็ว",
        pronunciation: "ga-ru-na pood cha-cha, phom/chan mai kao-jai meua khun pood reo",
        translation: "Please speak slowly. I don't understand when you speak fast."
      },
      {
        thai: "กรุณาพูดช้าๆ และใช้คำง่ายๆ",
        thaiMasculine: "กรุณาพูดช้าๆ และใช้คำง่ายๆ ครับ",
        thaiFeminine: "กรุณาพูดช้าๆ และใช้คำง่ายๆ ค่ะ",
        pronunciation: "ga-ru-na pood cha-cha lae chai kam ngai-ngai",
        translation: "Please speak slowly and use simple words."
      },
      {
        thai: "กรุณาพูดช้าๆ ภาษาไทยเป็นภาษาที่สองของฉัน",
        thaiMasculine: "กรุณาพูดช้าๆ ครับ ภาษาไทยเป็นภาษาที่สองของผม",
        thaiFeminine: "กรุณาพูดช้าๆ ค่ะ ภาษาไทยเป็นภาษาที่สองของฉัน",
        pronunciation: "ga-ru-na pood cha-cha, phasa-thai pen phasa tee song kong phom/chan",
        translation: "Please speak slowly. Thai is my second language."
      },
      {
        thai: "กรุณาพูดช้าๆ คุณช่วยพูดซ้ำได้ไหม",
        thaiMasculine: "กรุณาพูดช้าๆ ครับ คุณช่วยพูดซ้ำได้ไหมครับ",
        thaiFeminine: "กรุณาพูดช้าๆ ค่ะ คุณช่วยพูดซ้ำได้ไหมคะ",
        pronunciation: "ga-ru-na pood cha-cha, khun chuay pood sam dai mai",
        translation: "Please speak slowly. Could you repeat that?"
      }
    ]
  },
  {
    english: "Where is the bathroom?",
    thai: "ห้องน้ำอยู่ที่ไหน",
    thaiMasculine: "ห้องน้ำอยู่ที่ไหนครับ",
    thaiFeminine: "ห้องน้ำอยู่ที่ไหนคะ",
    pronunciation: "hong-nam yoo tee-nai",
    mnemonic: "Think: 'Hong-nam' sounds like 'home' with 'nam' (water) - where's the water room?",
    examples: [
      {
        thai: "ห้องน้ำอยู่ที่ไหน",
        thaiMasculine: "ห้องน้ำอยู่ที่ไหนครับ",
        thaiFeminine: "ห้องน้ำอยู่ที่ไหนคะ",
        pronunciation: "hong-nam yoo tee-nai",
        translation: "Where is the bathroom?"
      },
      {
        thai: "ห้องน้ำอยู่ชั้นบนหรือชั้นล่าง",
        thaiMasculine: "ห้องน้ำอยู่ชั้นบนหรือชั้นล่างครับ",
        thaiFeminine: "ห้องน้ำอยู่ชั้นบนหรือชั้นล่างคะ",
        pronunciation: "hong-nam yoo chan bon rue chan lang",
        translation: "Is the bathroom upstairs or downstairs?"
      },
      {
        thai: "ห้องน้ำอยู่ทางด้านหลังร้าน",
        thaiMasculine: "ห้องน้ำอยู่ทางด้านหลังร้านครับ",
        thaiFeminine: "ห้องน้ำอยู่ทางด้านหลังร้านค่ะ",
        pronunciation: "hong-nam yoo tang dan lang ran",
        translation: "The bathroom is at the back of the store."
      },
      {
        thai: "ห้องน้ำสาธารณะอยู่ที่ไหน",
        thaiMasculine: "ห้องน้ำสาธารณะอยู่ที่ไหนครับ",
        thaiFeminine: "ห้องน้ำสาธารณะอยู่ที่ไหนคะ",
        pronunciation: "hong-nam sa-ta-ra-na yoo tee-nai",
        translation: "Where is the public restroom?"
      },
      {
        thai: "กรุณาบอกทางไปห้องน้ำหน่อย",
        thaiMasculine: "กรุณาบอกทางไปห้องน้ำหน่อยครับ",
        thaiFeminine: "กรุณาบอกทางไปห้องน้ำหน่อยค่ะ",
        pronunciation: "ga-ru-na bok tang pai hong-nam noi",
        translation: "Please tell me the way to the bathroom."
      }
    ]
  },
  {
    english: "How much is this?",
    thai: "อันนี้เท่าไหร่",
    thaiMasculine: "อันนี้เท่าไหร่ครับ",
    thaiFeminine: "อันนี้เท่าไหร่คะ",
    pronunciation: "an-nee tao-rai",
    mnemonic: "Think: 'Annie, tell me how much!'",
    examples: [
      {
        thai: "อันนี้เท่าไหร่",
        thaiMasculine: "อันนี้เท่าไหร่ครับ",
        thaiFeminine: "อันนี้เท่าไหร่คะ",
        pronunciation: "an-nee tao-rai",
        translation: "How much is this?"
      },
      {
        thai: "อันนี้ราคาเท่าไหร่ มันแพงไป",
        thaiMasculine: "อันนี้ราคาเท่าไหร่ครับ มันแพงไปไหมครับ",
        thaiFeminine: "อันนี้ราคาเท่าไหร่คะ มันแพงไปไหมคะ",
        pronunciation: "an-nee ra-ka tao-rai, man paeng pai mai krap/ka",
        translation: "How much is this? Is it expensive?"
      },
      {
        thai: "ลดราคาได้ไหม อันนี้เท่าไหร่",
        thaiMasculine: "ลดราคาได้ไหมครับ อันนี้เท่าไหร่ครับ",
        thaiFeminine: "ลดราคาได้ไหมคะ อันนี้เท่าไหร่คะ",
        pronunciation: "lot ra-ka dai mai krap/ka, an-nee tao-rai",
        translation: "Can you give a discount? How much is this?"
      },
      {
        thai: "อันนี้กับอันนั้น อันไหนราคาถูกกว่า",
        thaiMasculine: "อันนี้กับอันนั้น อันไหนราคาถูกกว่าครับ",
        thaiFeminine: "อันนี้กับอันนั้น อันไหนราคาถูกกว่าคะ",
        pronunciation: "an-nee gap an-nan, an-nai ra-ka took gwa krap/ka",
        translation: "Between this one and that one, which one is cheaper?"
      },
      {
        thai: "อันนี้เท่าไหร่ ฉันจะเอาสองชิ้น",
        thaiMasculine: "อันนี้เท่าไหร่ครับ ผมจะเอาสองชิ้น",
        thaiFeminine: "อันนี้เท่าไหร่คะ ฉันจะเอาสองชิ้น",
        pronunciation: "an-nee tao-rai, phom/chan ja ao song chin",
        translation: "How much is this? I want two pieces."
      }
    ]
  },
  {
    english: "Delicious",
    thai: "อร่อย",
    thaiMasculine: "อร่อยครับ",
    thaiFeminine: "อร่อยค่ะ",
    pronunciation: "a-roi",
    mnemonic: "Think: 'Ah, royal' - food fit for royalty",
    examples: [
      {
        thai: "อาหารนี้อร่อยมาก",
        thaiMasculine: "อาหารนี้อร่อยมากครับ",
        thaiFeminine: "อาหารนี้อร่อยมากค่ะ",
        pronunciation: "a-han nee a-roi mak krap/ka",
        translation: "This food is very delicious."
      },
      {
        thai: "ผัดไทยร้านนี้อร่อยที่สุด",
        thaiMasculine: "ผัดไทยร้านนี้อร่อยที่สุดครับ",
        thaiFeminine: "ผัดไทยร้านนี้อร่อยที่สุดค่ะ",
        pronunciation: "pad-thai ran nee a-roi tee-sut krap/ka",
        translation: "The Pad Thai at this restaurant is the most delicious."
      },
      {
        thai: "แกงเขียวหวานอร่อยมาก ฉันชอบมาก",
        thaiMasculine: "แกงเขียวหวานอร่อยมากครับ ผมชอบมาก",
        thaiFeminine: "แกงเขียวหวานอร่อยมากค่ะ ฉันชอบมาก",
        pronunciation: "gaeng khiao wan a-roi mak krap/ka, phom/chan chop mak",
        translation: "The green curry is very delicious. I like it very much."
      },
      {
        thai: "รสชาติอร่อย ใส่เครื่องเทศพอดี",
        thaiMasculine: "รสชาติอร่อยครับ ใส่เครื่องเทศพอดี",
        thaiFeminine: "รสชาติอร่อยค่ะ ใส่เครื่องเทศพอดี",
        pronunciation: "rot-chat a-roi krap/ka, sai kreuang-tet por-dee",
        translation: "The taste is delicious. The spices are just right."
      },
      {
        thai: "ขนมหวานอร่อยมาก อยากสั่งเพิ่ม",
        thaiMasculine: "ขนมหวานอร่อยมากครับ อยากสั่งเพิ่ม",
        thaiFeminine: "ขนมหวานอร่อยมากค่ะ อยากสั่งเพิ่ม",
        pronunciation: "ka-nom wan a-roi mak krap/ka, yak sang perm",
        translation: "The dessert is very delicious. I want to order more."
      }
    ]
  },
  {
    english: "Today",
    thai: "วันนี้",
    thaiMasculine: "วันนี้ครับ",
    thaiFeminine: "วันนี้ค่ะ",
    pronunciation: "wan-nee",
    mnemonic: "Think: 'One knee' - today I hurt one knee",
    examples: [
      {
        thai: "วันนี้อากาศดีมาก",
        thaiMasculine: "วันนี้อากาศดีมากครับ",
        thaiFeminine: "วันนี้อากาศดีมากค่ะ",
        pronunciation: "wan-nee a-kat dee mak krap/ka",
        translation: "Today the weather is very good."
      },
      {
        thai: "วันนี้คุณมีแผนอะไร",
        thaiMasculine: "วันนี้คุณมีแผนอะไรครับ",
        thaiFeminine: "วันนี้คุณมีแผนอะไรคะ",
        pronunciation: "wan-nee khun mee paen a-rai krap/ka",
        translation: "What are your plans for today?"
      },
      {
        thai: "วันนี้ฉันไม่สบาย ต้องไปหาหมอ",
        thaiMasculine: "วันนี้ผมไม่สบายครับ ต้องไปหาหมอ",
        thaiFeminine: "วันนี้ฉันไม่สบายค่ะ ต้องไปหาหมอ",
        pronunciation: "wan-nee phom/chan mai sa-bai krap/ka, tong pai ha mor",
        translation: "Today I'm not feeling well. I need to see a doctor."
      },
      {
        thai: "วันนี้ร้านปิดเร็ว ปิดตอนห้าโมงเย็น",
        thaiMasculine: "วันนี้ร้านปิดเร็วครับ ปิดตอนห้าโมงเย็น",
        thaiFeminine: "วันนี้ร้านปิดเร็วค่ะ ปิดตอนห้าโมงเย็น",
        pronunciation: "wan-nee ran pit rew krap/ka, pit ton ha mong yen",
        translation: "Today the shop closes early. It closes at 5 PM."
      },
      {
        thai: "วันนี้เป็นวันพิเศษ เป็นวันเกิดของฉัน",
        thaiMasculine: "วันนี้เป็นวันพิเศษครับ เป็นวันเกิดของผม",
        thaiFeminine: "วันนี้เป็นวันพิเศษค่ะ เป็นวันเกิดของฉัน",
        pronunciation: "wan-nee pen wan pi-set krap/ka, pen wan-gerd kong phom/chan",
        translation: "Today is a special day. It's my birthday."
      }
    ]
  },
  {
    english: "Tomorrow",
    thai: "พรุ่งนี้",
    thaiMasculine: "พรุ่งนี้ครับ",
    thaiFeminine: "พรุ่งนี้ค่ะ",
    pronunciation: "proong-nee",
    mnemonic: "Think: 'Prune-knee' - tomorrow I'll fix my pruned knee",
    examples: [
      {
        thai: "พรุ่งนี้เราจะไปเที่ยว",
        thaiMasculine: "พรุ่งนี้เราจะไปเที่ยวครับ",
        thaiFeminine: "พรุ่งนี้เราจะไปเที่ยวค่ะ",
        pronunciation: "proong-nee rao ja pai tiew krap/ka",
        translation: "Tomorrow we will go sightseeing."
      },
      {
        thai: "พรุ่งนี้ฉันต้องตื่นเช้า",
        thaiMasculine: "พรุ่งนี้ผมต้องตื่นเช้าครับ",
        thaiFeminine: "พรุ่งนี้ฉันต้องตื่นเช้าค่ะ",
        pronunciation: "proong-nee phom/chan tong teun chao krap/ka",
        translation: "Tomorrow I have to wake up early."
      },
      {
        thai: "พรุ่งนี้จะฝนตก อย่าลืมพกร่ม",
        thaiMasculine: "พรุ่งนี้จะฝนตกครับ อย่าลืมพกร่ม",
        thaiFeminine: "พรุ่งนี้จะฝนตกค่ะ อย่าลืมพกร่ม",
        pronunciation: "proong-nee ja fon tok krap/ka, ya luem pok rom",
        translation: "Tomorrow it will rain. Don't forget to bring an umbrella."
      },
      {
        thai: "พรุ่งนี้คุณว่างไหม อยากชวนไปทานข้าว",
        thaiMasculine: "พรุ่งนี้คุณว่างไหมครับ อยากชวนไปทานข้าว",
        thaiFeminine: "พรุ่งนี้คุณว่างไหมคะ อยากชวนไปทานข้าว",
        pronunciation: "proong-nee khun wang mai krap/ka, yak chuan pai tan khao",
        translation: "Are you free tomorrow? I'd like to invite you to have a meal."
      },
      {
        thai: "พรุ่งนี้เป็นวันหยุด เราไม่ต้องไปทำงาน",
        thaiMasculine: "พรุ่งนี้เป็นวันหยุดครับ เราไม่ต้องไปทำงาน",
        thaiFeminine: "พรุ่งนี้เป็นวันหยุดค่ะ เราไม่ต้องไปทำงาน",
        pronunciation: "proong-nee pen wan-yut krap/ka, rao mai tong pai tam-ngan",
        translation: "Tomorrow is a holiday. We don't have to go to work."
      }
    ]
  },
  {
    english: "Yesterday",
    thai: "เมื่อวาน",
    thaiMasculine: "เมื่อวานครับ", 
    thaiFeminine: "เมื่อวานค่ะ",
    pronunciation: "meua-wan",
    mnemonic: "Think: 'Mew-a-waan' - the cat meowed all day yesterday",
    examples: [
      {
        thai: "เมื่อวานไปตลาด",
        thaiMasculine: "เมื่อวานผมไปตลาด",
        thaiFeminine: "เมื่อวานฉันไปตลาด",
        pronunciation: "meua-wan phom/chan pai ta-lad",
        translation: "Yesterday I went to the market."
      },
      {
        thai: "เมื่อวานอากาศร้อนมาก",
        thaiMasculine: "เมื่อวานอากาศร้อนมากครับ",
        thaiFeminine: "เมื่อวานอากาศร้อนมากค่ะ",
        pronunciation: "meua-wan a-kat ron mak krap/ka",
        translation: "Yesterday the weather was very hot."
      },
      {
        thai: "เมื่อวานคุณทำอะไร",
        thaiMasculine: "เมื่อวานคุณทำอะไรครับ",
        thaiFeminine: "เมื่อวานคุณทำอะไรคะ",
        pronunciation: "meua-wan khun tam a-rai krap/ka",
        translation: "What did you do yesterday?"
      },
      {
        thai: "เมื่อวานฉันเห็นหนังเรื่องนี้",
        thaiMasculine: "เมื่อวานผมเห็นหนังเรื่องนี้ครับ",
        thaiFeminine: "เมื่อวานฉันเห็นหนังเรื่องนี้ค่ะ",
        pronunciation: "meua-wan phom/chan hen nang reuang nee krap/ka",
        translation: "Yesterday I saw this movie."
      },
      {
        thai: "เมื่อวานเราคุยกันเรื่องนี้แล้ว",
        thaiMasculine: "เมื่อวานเราคุยกันเรื่องนี้แล้วครับ",
        thaiFeminine: "เมื่อวานเราคุยกันเรื่องนี้แล้วค่ะ",
        pronunciation: "meua-wan rao kui gan reuang nee laew krap/ka",
        translation: "Yesterday we already talked about this."
      }
    ]
  },
  {
    english: "Water",
    thai: "น้ำ",
    thaiMasculine: "น้ำครับ",
    thaiFeminine: "น้ำค่ะ",
    pronunciation: "nam",
    mnemonic: "Think: 'Nom' - like 'nom nom' drinking water",
    literal: "Water",
    examples: [
      {
        thai: "ขอน้ำหน่อย",
        thaiMasculine: "ขอน้ำหน่อยครับ",
        thaiFeminine: "ขอน้ำหน่อยค่ะ",
        pronunciation: "khor nam noi krap/ka",
        translation: "May I have some water please?"
      },
      {
        thai: "น้ำเปล่าหนึ่งขวด",
        thaiMasculine: "ขอน้ำเปล่าหนึ่งขวดครับ",
        thaiFeminine: "ขอน้ำเปล่าหนึ่งขวดค่ะ",
        pronunciation: "khor nam plao nueng khuad krap/ka",
        translation: "One bottle of plain water, please."
      },
      {
        thai: "น้ำร้อนหรือน้ำเย็น",
        thaiMasculine: "ขอน้ำร้อนหรือน้ำเย็นครับ",
        thaiFeminine: "ขอน้ำร้อนหรือน้ำเย็นคะ",
        pronunciation: "khor nam ron rue nam yen krap/ka",
        translation: "Hot water or cold water?"
      },
      {
        thai: "น้ำไม่สะอาด ดื่มไม่ได้",
        thaiMasculine: "น้ำไม่สะอาดครับ ดื่มไม่ได้",
        thaiFeminine: "น้ำไม่สะอาดค่ะ ดื่มไม่ได้",
        pronunciation: "nam mai sa-ad krap/ka, duem mai dai",
        translation: "The water is not clean. It's not drinkable."
      },
      {
        thai: "ฉันชอบดื่มน้ำเปล่า ไม่ชอบน้ำอัดลม",
        thaiMasculine: "ผมชอบดื่มน้ำเปล่าครับ ไม่ชอบน้ำอัดลม",
        thaiFeminine: "ฉันชอบดื่มน้ำเปล่าค่ะ ไม่ชอบน้ำอัดลม",
        pronunciation: "phom/chan chop duem nam plao krap/ka, mai chop nam at-lom",
        translation: "I like to drink plain water. I don't like soda."
      }
    ]
  },
  {
    english: "Food",
    thai: "อาหาร",
    thaiMasculine: "อาหารครับ", 
    thaiFeminine: "อาหารค่ะ",
    pronunciation: "a-han",
    mnemonic: "Think: 'A-han' - 'a hand' full of food",
    literal: "Food",
    examples: [
      {
        thai: "อาหารไทยอร่อย",
        thaiMasculine: "อาหารไทยอร่อยมากครับ",
        thaiFeminine: "อาหารไทยอร่อยมากค่ะ",
        pronunciation: "a-han thai a-roi mak krap/ka",
        translation: "Thai food is very delicious."
      },
      {
        thai: "คุณชอบอาหารอะไร",
        thaiMasculine: "คุณชอบอาหารอะไรครับ",
        thaiFeminine: "คุณชอบอาหารอะไรคะ",
        pronunciation: "khun chop a-han a-rai krap/ka",
        translation: "What food do you like?"
      },
      {
        thai: "อาหารเช้าสำคัญที่สุด",
        thaiMasculine: "อาหารเช้าสำคัญที่สุดครับ",
        thaiFeminine: "อาหารเช้าสำคัญที่สุดค่ะ",
        pronunciation: "a-han chao sam-khan tee-sut krap/ka",
        translation: "Breakfast is the most important meal."
      },
      {
        thai: "เราหาร้านอาหารกัน",
        thaiMasculine: "เราหาร้านอาหารกันครับ",
        thaiFeminine: "เราหาร้านอาหารกันค่ะ",
        pronunciation: "rao ha ran a-han gan krap/ka",
        translation: "Let's find a restaurant."
      },
      {
        thai: "อาหารของที่นี่เผ็ดมาก",
        thaiMasculine: "อาหารของที่นี่เผ็ดมากครับ",
        thaiFeminine: "อาหารของที่นี่เผ็ดมากค่ะ",
        pronunciation: "a-han kong tee-nee pet mak krap/ka",
        translation: "The food here is very spicy."
      }
    ]
  },
  {
    english: "Hot (temperature)",
    thai: "ร้อน",
    thaiMasculine: "ร้อนครับ",
    thaiFeminine: "ร้อนค่ะ",
    pronunciation: "ron",
    mnemonic: "Think: 'Ron is hot' - Ron is always complaining about the heat",
    examples: [
      {
        thai: "วันนี้อากาศร้อนมาก",
        thaiMasculine: "วันนี้อากาศร้อนมากครับ",
        thaiFeminine: "วันนี้อากาศร้อนมากค่ะ",
        pronunciation: "wan-nee a-kat ron mak krap/ka",
        translation: "Today the weather is very hot."
      },
      {
        thai: "กาแฟนี้ร้อนเกินไป",
        thaiMasculine: "กาแฟนี้ร้อนเกินไปครับ",
        thaiFeminine: "กาแฟนี้ร้อนเกินไปค่ะ",
        pronunciation: "ka-fae nee ron gern pai krap/ka",
        translation: "This coffee is too hot."
      },
      {
        thai: "ฉันรู้สึกร้อน เปิดแอร์หน่อยได้ไหม",
        thaiMasculine: "ผมรู้สึกร้อนครับ เปิดแอร์หน่อยได้ไหม",
        thaiFeminine: "ฉันรู้สึกร้อนค่ะ เปิดแอร์หน่อยได้ไหม",
        pronunciation: "phom/chan ru-suek ron krap/ka, perd air noi dai mai",
        translation: "I feel hot. Can you turn on the air conditioner?"
      },
      {
        thai: "อากาศร้อนทำให้ฉันเหนื่อย",
        thaiMasculine: "อากาศร้อนทำให้ผมเหนื่อยครับ",
        thaiFeminine: "อากาศร้อนทำให้ฉันเหนื่อยค่ะ",
        pronunciation: "a-kat ron tam hai phom/chan neuay krap/ka",
        translation: "The hot weather makes me tired."
      },
      {
        thai: "ในหน้าร้อน ประเทศไทยร้อนมาก",
        thaiMasculine: "ในหน้าร้อน ประเทศไทยร้อนมากครับ",
        thaiFeminine: "ในหน้าร้อน ประเทศไทยร้อนมากค่ะ",
        pronunciation: "nai na ron, pra-tet thai ron mak krap/ka",
        translation: "During the hot season, Thailand is very hot."
      }
    ]
  }
]; 