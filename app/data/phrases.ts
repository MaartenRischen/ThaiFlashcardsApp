export interface ExampleSentence {
  thai: string;
  thaiMasculine?: string;
  thaiFeminine?: string;
  pronunciation: string;
  translation: string;
}

export interface Phrase {
  english: string;
  thai: string;
  thaiMasculine?: string;
  thaiFeminine?: string;
  pronunciation: string;
  examples?: ExampleSentence[];
}

export const INITIAL_PHRASES: Phrase[] = [
  {
    english: "Hello",
    thai: "สวัสดี",
    thaiMasculine: "สวัสดีครับ",
    thaiFeminine: "สวัสดีค่ะ",
    pronunciation: "sa-wat-dee krap/ka",
    examples: [
      {
        thai: "สวัสดีตอนเช้า",
        thaiMasculine: "สวัสดีตอนเช้าครับ",
        thaiFeminine: "สวัสดีตอนเช้าค่ะ",
        pronunciation: "sa-wat-dee ton chao krap/ka",
        translation: "Good morning."
      },
      {
        thai: "สวัสดี คุณสบายดีไหม",
        thaiMasculine: "สวัสดีครับ คุณสบายดีไหมครับ",
        thaiFeminine: "สวัสดีค่ะ คุณสบายดีไหมคะ",
        pronunciation: "sa-wat-dee krap/ka, khun sa-bai-dee mai krap/ka",
        translation: "Hello, how are you?"
      },
      {
        thai: "สวัสดี คุณต้องการความช่วยเหลือไหม",
        thaiMasculine: "สวัสดีครับ คุณต้องการความช่วยเหลือไหมครับ",
        thaiFeminine: "สวัสดีค่ะ คุณต้องการความช่วยเหลือไหมคะ",
        pronunciation: "sa-wat-dee krap/ka, khun tong-kan kwam chuay-lue mai krap/ka",
        translation: "Hello, do you need any help?"
      },
      {
        thai: "สวัสดี ขอโทษที่มาสาย",
        thaiMasculine: "สวัสดีครับ ขอโทษที่มาสายครับ",
        thaiFeminine: "สวัสดีค่ะ ขอโทษที่มาสายค่ะ",
        pronunciation: "sa-wat-dee krap/ka, khor-thot thee ma sai krap/ka",
        translation: "Hello, sorry I'm late."
      },
      {
        thai: "สวัสดี อากาศดีนะวันนี้",
        thaiMasculine: "สวัสดีครับ อากาศดีนะวันนี้ครับ",
        thaiFeminine: "สวัสดีค่ะ อากาศดีนะวันนี้ค่ะ",
        pronunciation: "sa-wat-dee krap/ka, a-kat dee na wan-nee krap/ka",
        translation: "Hello, the weather is nice today."
      }
    ]
  },
  {
    english: "Thank you",
    thai: "ขอบคุณ",
    thaiMasculine: "ขอบคุณครับ",
    thaiFeminine: "ขอบคุณค่ะ",
    pronunciation: "khop-khun krap/ka",
    examples: [
      {
        thai: "ขอบคุณมากสำหรับความช่วยเหลือ",
        thaiMasculine: "ขอบคุณมากสำหรับความช่วยเหลือครับ",
        thaiFeminine: "ขอบคุณมากสำหรับความช่วยเหลือค่ะ",
        pronunciation: "khop-khun mak samrap kwam chuay-lue krap/ka",
        translation: "Thank you very much for your help."
      },
      {
        thai: "ขอบคุณมากสำหรับอาหารอร่อย",
        thaiMasculine: "ขอบคุณมากสำหรับอาหารอร่อยครับ",
        thaiFeminine: "ขอบคุณมากสำหรับอาหารอร่อยค่ะ",
        pronunciation: "khop-khun mak samrap a-han a-roi krap/ka",
        translation: "Thank you for the delicious food."
      }
    ]
  },
  {
    english: "Yes",
    thai: "ใช่",
    thaiMasculine: "ใช่ครับ",
    thaiFeminine: "ใช่ค่ะ",
    pronunciation: "chai krap/ka",
    examples: [
      {
        thai: "ใช่ ฉันเข้าใจ",
        thaiMasculine: "ใช่ครับ ผมเข้าใจครับ",
        thaiFeminine: "ใช่ค่ะ ฉันเข้าใจค่ะ",
        pronunciation: "chai krap/ka, phom/chan kao-jai krap/ka",
        translation: "Yes, I understand."
      }
    ]
  },
  {
    english: "No",
    thai: "ไม่",
    thaiMasculine: "ไม่ครับ",
    thaiFeminine: "ไม่ค่ะ",
    pronunciation: "mai krap/ka",
    examples: [
      {
        thai: "ไม่ ขอบคุณ",
        thaiMasculine: "ไม่ครับ ขอบคุณครับ",
        thaiFeminine: "ไม่ค่ะ ขอบคุณค่ะ",
        pronunciation: "mai krap/ka, khop-khun krap/ka",
        translation: "No, thank you."
      }
    ]
  },
  {
    english: "How are you?",
    thai: "สบายดีไหม",
    thaiMasculine: "สบายดีไหมครับ",
    thaiFeminine: "สบายดีไหมคะ",
    pronunciation: "sa-bai-dee-mai krap/ka",
    examples: [
      {
        thai: "สบายดีไหม วันนี้",
        thaiMasculine: "สบายดีไหมครับ วันนี้",
        thaiFeminine: "สบายดีไหมคะ วันนี้",
        pronunciation: "sa-bai-dee-mai krap/ka wan-nee",
        translation: "How are you today?"
      }
    ]
  },
  {
    english: "What is your name?",
    thai: "คุณชื่ออะไร",
    thaiMasculine: "คุณชื่ออะไรครับ",
    thaiFeminine: "คุณชื่ออะไรคะ",
    pronunciation: "khun cheu a-rai krap/ka",
    examples: [
      {
        thai: "คุณชื่ออะไร",
        thaiMasculine: "คุณชื่ออะไรครับ",
        thaiFeminine: "คุณชื่ออะไรคะ",
        pronunciation: "khun cheu a-rai krap/ka",
        translation: "What is your name?"
      }
    ]
  },
  {
    english: "My name is...",
    thai: "ชื่อ...",
    thaiMasculine: "ผมชื่อ...",
    thaiFeminine: "ฉันชื่อ...",
    pronunciation: "phom/chan cheu...",
    examples: [
      {
        thai: "ชื่อปีเตอร์ ยินดีที่ได้รู้จัก",
        thaiMasculine: "ผมชื่อปีเตอร์ ยินดีที่ได้รู้จักครับ",
        thaiFeminine: "ฉันชื่อปีเตอร์ ยินดีที่ได้รู้จักค่ะ",
        pronunciation: "phom/chan cheu Peter, yin-dee thee dai ru-jak krap/ka",
        translation: "My name is Peter. Nice to meet you."
      }
    ]
  },
  {
    english: "I don't understand",
    thai: "ไม่เข้าใจ",
    thaiMasculine: "ผมไม่เข้าใจครับ",
    thaiFeminine: "ฉันไม่เข้าใจค่ะ",
    pronunciation: "phom/chan mai kao-jai krap/ka",
    examples: [
      {
        thai: "ไม่เข้าใจ พูดช้าๆ ได้ไหม",
        thaiMasculine: "ผมไม่เข้าใจ พูดช้าๆ ได้ไหมครับ",
        thaiFeminine: "ฉันไม่เข้าใจ พูดช้าๆ ได้ไหมคะ",
        pronunciation: "phom/chan mai kao-jai, pood cha-cha dai mai krap/ka",
        translation: "I don't understand. Can you speak more slowly?"
      },
      {
        thai: "ขอโทษ ไม่เข้าใจภาษาไทยดีนัก",
        thaiMasculine: "ขอโทษครับ ผมไม่เข้าใจภาษาไทยดีนักครับ",
        thaiFeminine: "ขอโทษค่ะ ฉันไม่เข้าใจภาษาไทยดีนักค่ะ",
        pronunciation: "khor-thot krap/ka, phom/chan mai kao-jai phasa-thai dee nak krap/ka",
        translation: "Sorry, I don't understand Thai very well."
      }
    ]
  },
  {
    english: "Please speak slowly",
    thai: "กรุณาพูดช้าๆ",
    thaiMasculine: "กรุณาพูดช้าๆ ครับ",
    thaiFeminine: "กรุณาพูดช้าๆ ค่ะ",
    pronunciation: "ga-ru-na pood cha-cha krap/ka",
    examples: [
      {
        thai: "กรุณาพูดช้าๆ ฉันกำลังเรียนภาษาไทย",
        thaiMasculine: "กรุณาพูดช้าๆ ครับ ผมกำลังเรียนภาษาไทย",
        thaiFeminine: "กรุณาพูดช้าๆ ค่ะ ฉันกำลังเรียนภาษาไทย",
        pronunciation: "ga-ru-na pood cha-cha krap/ka, phom/chan gam-lang rian phasa-thai",
        translation: "Please speak slowly. I'm learning Thai."
      }
    ]
  },
  {
    english: "Where is the bathroom?",
    thai: "ห้องน้ำอยู่ที่ไหน",
    thaiMasculine: "ห้องน้ำอยู่ที่ไหนครับ",
    thaiFeminine: "ห้องน้ำอยู่ที่ไหนคะ",
    pronunciation: "hong-nam yoo tee-nai krap/ka",
    examples: [
      {
        thai: "ห้องน้ำอยู่ที่ไหน",
        thaiMasculine: "ห้องน้ำอยู่ที่ไหนครับ",
        thaiFeminine: "ห้องน้ำอยู่ที่ไหนคะ",
        pronunciation: "hong-nam yoo tee-nai krap/ka",
        translation: "Where is the bathroom?"
      }
    ]
  },
  {
    english: "How much is this?",
    thai: "อันนี้เท่าไหร่",
    thaiMasculine: "อันนี้เท่าไหร่ครับ",
    thaiFeminine: "อันนี้เท่าไหร่คะ",
    pronunciation: "an-nee tao-rai krap/ka",
    examples: [
      {
        thai: "อันนี้เท่าไหร่",
        thaiMasculine: "อันนี้เท่าไหร่ครับ",
        thaiFeminine: "อันนี้เท่าไหร่คะ",
        pronunciation: "an-nee tao-rai krap/ka",
        translation: "How much is this?"
      }
    ]
  },
  {
    english: "Delicious",
    thai: "อร่อย",
    thaiMasculine: "อร่อยครับ",
    thaiFeminine: "อร่อยค่ะ",
    pronunciation: "a-roi krap/ka",
    examples: [
      {
        thai: "อาหารนี้อร่อยมาก",
        thaiMasculine: "อาหารนี้อร่อยมากครับ",
        thaiFeminine: "อาหารนี้อร่อยมากค่ะ",
        pronunciation: "a-han nee a-roi mak krap/ka",
        translation: "This food is very delicious."
      }
    ]
  },
  {
    english: "Today",
    thai: "วันนี้",
    thaiMasculine: "วันนี้ครับ",
    thaiFeminine: "วันนี้ค่ะ",
    pronunciation: "wan-nee krap/ka",
    examples: [
      {
        thai: "วันนี้อากาศดีมาก",
        thaiMasculine: "วันนี้อากาศดีมากครับ",
        thaiFeminine: "วันนี้อากาศดีมากค่ะ",
        pronunciation: "wan-nee a-kat dee mak krap/ka",
        translation: "Today the weather is very good."
      }
    ]
  },
  {
    english: "Tomorrow",
    thai: "พรุ่งนี้",
    thaiMasculine: "พรุ่งนี้ครับ",
    thaiFeminine: "พรุ่งนี้ค่ะ",
    pronunciation: "proong-nee krap/ka",
    examples: [
      {
        thai: "พรุ่งนี้เราจะไปเที่ยว",
        thaiMasculine: "พรุ่งนี้เราจะไปเที่ยวครับ",
        thaiFeminine: "พรุ่งนี้เราจะไปเที่ยวค่ะ",
        pronunciation: "proong-nee rao ja pai tiew krap/ka",
        translation: "Tomorrow we will go sightseeing."
      }
    ]
  },
  {
    english: "Yesterday",
    thai: "เมื่อวาน",
    thaiMasculine: "เมื่อวานครับ", 
    thaiFeminine: "เมื่อวานค่ะ",
    pronunciation: "meua-wan krap/ka",
    examples: [
      {
        thai: "เมื่อวานไปตลาด",
        thaiMasculine: "เมื่อวานผมไปตลาด",
        thaiFeminine: "เมื่อวานฉันไปตลาด",
        pronunciation: "meua-wan phom/chan pai ta-lad",
        translation: "Yesterday I went to the market."
      }
    ]
  },
  {
    english: "Water",
    thai: "น้ำ",
    thaiMasculine: "น้ำครับ",
    thaiFeminine: "น้ำค่ะ",
    pronunciation: "nam krap/ka",
    examples: [
      {
        thai: "ขอน้ำหน่อย",
        thaiMasculine: "ขอน้ำหน่อยครับ",
        thaiFeminine: "ขอน้ำหน่อยค่ะ",
        pronunciation: "khor nam noi krap/ka",
        translation: "May I have some water please?"
      }
    ]
  },
  {
    english: "Food",
    thai: "อาหาร",
    thaiMasculine: "อาหารครับ", 
    thaiFeminine: "อาหารค่ะ",
    pronunciation: "a-han krap/ka",
    examples: [
      {
        thai: "อาหารไทยอร่อย",
        thaiMasculine: "อาหารไทยอร่อยมากครับ",
        thaiFeminine: "อาหารไทยอร่อยมากค่ะ",
        pronunciation: "a-han thai a-roi mak krap/ka",
        translation: "Thai food is very delicious."
      }
    ]
  },
  {
    english: "Hot (temperature)",
    thai: "ร้อน",
    thaiMasculine: "ร้อนครับ",
    thaiFeminine: "ร้อนค่ะ",
    pronunciation: "ron krap/ka",
    examples: [
      {
        thai: "วันนี้อากาศร้อนมาก",
        thaiMasculine: "วันนี้อากาศร้อนมากครับ",
        thaiFeminine: "วันนี้อากาศร้อนมากค่ะ",
        pronunciation: "wan-nee a-kat ron mak krap/ka",
        translation: "Today the weather is very hot."
      }
    ]
  }
]; 