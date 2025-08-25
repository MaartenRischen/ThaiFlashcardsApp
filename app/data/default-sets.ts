import { Phrase } from './phrases';

export interface DefaultSet {
  id: string;
  name: string;
  level: string;
  description: string;
  phrases: Phrase[];
}

export const DEFAULT_SETS: DefaultSet[] = [
  // Complete Beginner Sets (2 sets)
  {
    id: 'numbers-1-10',
    name: 'Numbers 1-10',
    level: 'Complete Beginner',
    description: 'Basic counting from 1 to 10 in Thai',
    phrases: [
      {
        english: "One",
        thai: "หนึ่ง",
        thaiMasculine: "หนึ่ง",
        thaiFeminine: "หนึ่ง",
        pronunciation: "nueng",
        mnemonic: "Think: 'Nung' - like 'one lung' breathing",
        examples: [
          {
            thai: "ขอกาแฟหนึ่งแก้ว",
            thaiMasculine: "ขอกาแฟหนึ่งแก้ว",
            thaiFeminine: "ขอกาแฟหนึ่งแก้ว",
            pronunciation: "khor ka-fae nueng gaew",
            translation: "One coffee please."
          },
          {
            thai: "มีหนึ่งอันเท่านั้น",
            thaiMasculine: "มีหนึ่งอันเท่านั้น",
            thaiFeminine: "มีหนึ่งอันเท่านั้น",
            pronunciation: "mee nueng an tao-nan",
            translation: "There is only one."
          }
        ]
      },
      {
        english: "Two",
        thai: "สอง",
        thaiMasculine: "สอง",
        thaiFeminine: "สอง",
        pronunciation: "song",
        mnemonic: "Think: 'Song' - two people singing a song",
        examples: [
          {
            thai: "สองคนมาด้วยกัน",
            thaiMasculine: "สองคนมาด้วยกัน",
            thaiFeminine: "สองคนมาด้วยกัน",
            pronunciation: "song kon ma duay gan",
            translation: "Two people came together."
          },
          {
            thai: "ขอข้าวสองจาน",
            thaiMasculine: "ขอข้าวสองจาน",
            thaiFeminine: "ขอข้าวสองจาน",
            pronunciation: "khor khao song jaan",
            translation: "Two plates of rice please."
          }
        ]
      },
      {
        english: "Three",
        thai: "สาม",
        thaiMasculine: "สาม",
        thaiFeminine: "สาม",
        pronunciation: "saam",
        mnemonic: "Think: 'Saam' - like 'Sam' has three letters",
        examples: [
          {
            thai: "สามวันแล้ว",
            thaiMasculine: "สามวันแล้ว",
            thaiFeminine: "สามวันแล้ว",
            pronunciation: "saam wan laew",
            translation: "Three days already."
          },
          {
            thai: "มีสามสีให้เลือก",
            thaiMasculine: "มีสามสีให้เลือก",
            thaiFeminine: "มีสามสีให้เลือก",
            pronunciation: "mee saam see hai lueak",
            translation: "There are three colors to choose from."
          }
        ]
      },
      {
        english: "Four",
        thai: "สี่",
        thaiMasculine: "สี่",
        thaiFeminine: "สี่",
        pronunciation: "see",
        mnemonic: "Think: 'See' - I can see four things",
        examples: [
          {
            thai: "สี่โมงเย็น",
            thaiMasculine: "สี่โมงเย็น",
            thaiFeminine: "สี่โมงเย็น",
            pronunciation: "see mong yen",
            translation: "Four o'clock in the afternoon."
          },
          {
            thai: "มีสี่คนในครอบครัว",
            thaiMasculine: "มีสี่คนในครอบครัว",
            thaiFeminine: "มีสี่คนในครอบครัว",
            pronunciation: "mee see kon nai krob-krua",
            translation: "There are four people in the family."
          }
        ]
      },
      {
        english: "Five",
        thai: "ห้า",
        thaiMasculine: "ห้าครับ",
        thaiFeminine: "ห้าค่ะ",
        pronunciation: "haa",
        mnemonic: "Think: 'Ha!' - laughing five times",
        examples: [
          {
            thai: "ห้านาที",
            thaiMasculine: "ห้านาทีครับ",
            thaiFeminine: "ห้านาทีค่ะ",
            pronunciation: "haa na-tee",
            translation: "Five minutes."
          },
          {
            thai: "เหลือห้าชิ้น",
            thaiMasculine: "เหลือห้าชิ้นครับ",
            thaiFeminine: "เหลือห้าชิ้นค่ะ",
            pronunciation: "luea haa chin",
            translation: "Five pieces left."
          }
        ]
      },
      {
        english: "Six",
        thai: "หก",
        thaiMasculine: "หกครับ",
        thaiFeminine: "หกค่ะ",
        pronunciation: "hok",
        mnemonic: "Think: 'Hock' - like a hockey team has six players",
        examples: [
          {
            thai: "หกโมงเช้า",
            thaiMasculine: "หกโมงเช้าครับ",
            thaiFeminine: "หกโมงเช้าค่ะ",
            pronunciation: "hok mong chao",
            translation: "Six o'clock in the morning."
          },
          {
            thai: "ซื้อหกอัน",
            thaiMasculine: "ซื้อหกอันครับ",
            thaiFeminine: "ซื้อหกอันค่ะ",
            pronunciation: "sue hok an",
            translation: "Buy six pieces."
          }
        ]
      },
      {
        english: "Seven",
        thai: "เจ็ด",
        thaiMasculine: "เจ็ดครับ",
        thaiFeminine: "เจ็ดค่ะ",
        pronunciation: "jet",
        mnemonic: "Think: 'Jet' - a 747 jet has seven in it",
        examples: [
          {
            thai: "เจ็ดวันในหนึ่งสัปดาห์",
            thaiMasculine: "เจ็ดวันในหนึ่งสัปดาห์ครับ",
            thaiFeminine: "เจ็ดวันในหนึ่งสัปดาห์ค่ะ",
            pronunciation: "jet wan nai nueng sap-daa",
            translation: "Seven days in one week."
          },
          {
            thai: "อายุเจ็ดขวบ",
            thaiMasculine: "อายุเจ็ดขวบครับ",
            thaiFeminine: "อายุเจ็ดขวบค่ะ",
            pronunciation: "aa-yu jet khuap",
            translation: "Seven years old."
          }
        ]
      },
      {
        english: "Eight",
        thai: "แปด",
        thaiMasculine: "แปดครับ",
        thaiFeminine: "แปดค่ะ",
        pronunciation: "paet",
        mnemonic: "Think: 'Pat' - pat your head eight times",
        examples: [
          {
            thai: "แปดโมงเช้า",
            thaiMasculine: "แปดโมงเช้าครับ",
            thaiFeminine: "แปดโมงเช้าค่ะ",
            pronunciation: "paet mong chao",
            translation: "Eight o'clock in the morning."
          },
          {
            thai: "มีแปดสี",
            thaiMasculine: "มีแปดสีครับ",
            thaiFeminine: "มีแปดสีค่ะ",
            pronunciation: "mee paet see",
            translation: "There are eight colors."
          }
        ]
      },
      {
        english: "Nine",
        thai: "เก้า",
        thaiMasculine: "เก้าครับ",
        thaiFeminine: "เก้าค่ะ",
        pronunciation: "gao",
        mnemonic: "Think: 'Gow' - a cow saying nine",
        examples: [
          {
            thai: "เก้าบาท",
            thaiMasculine: "เก้าบาทครับ",
            thaiFeminine: "เก้าบาทค่ะ",
            pronunciation: "gao baht",
            translation: "Nine baht."
          },
          {
            thai: "เหลือเก้าวัน",
            thaiMasculine: "เหลือเก้าวันครับ",
            thaiFeminine: "เหลือเก้าวันค่ะ",
            pronunciation: "luea gao wan",
            translation: "Nine days left."
          }
        ]
      },
      {
        english: "Ten",
        thai: "สิบ",
        thaiMasculine: "สิบครับ",
        thaiFeminine: "สิบค่ะ",
        pronunciation: "sip",
        mnemonic: "Think: 'Sip' - take ten sips",
        examples: [
          {
            thai: "สิบนาที",
            thaiMasculine: "สิบนาทีครับ",
            thaiFeminine: "สิบนาทีค่ะ",
            pronunciation: "sip na-tee",
            translation: "Ten minutes."
          },
          {
            thai: "ราคาสิบบาท",
            thaiMasculine: "ราคาสิบบาทครับ",
            thaiFeminine: "ราคาสิบบาทค่ะ",
            pronunciation: "raa-kaa sip baht",
            translation: "The price is ten baht."
          }
        ]
      }
    ]
  },
  {
    id: 'basic-colors',
    name: 'Basic Colors',
    level: 'Complete Beginner',
    description: 'Essential colors in Thai',
    phrases: [
      {
        english: "Red",
        thai: "สีแดง",
        thaiMasculine: "สีแดง",
        thaiFeminine: "สีแดง",
        pronunciation: "see daeng",
        mnemonic: "Think: 'See dang' - danger is red",
        examples: [
          {
            thai: "รถสีแดง",
            thaiMasculine: "รถสีแดง",
            thaiFeminine: "รถสีแดง",
            pronunciation: "rot see daeng",
            translation: "Red car."
          },
          {
            thai: "ชอบสีแดง",
            thaiMasculine: "ผมชอบสีแดง",
            thaiFeminine: "ฉันชอบสีแดง",
            pronunciation: "phom/chan chop see daeng",
            translation: "I like red."
          }
        ]
      },
      {
        english: "Blue",
        thai: "สีน้ำเงิน",
        thaiMasculine: "สีน้ำเงินครับ",
        thaiFeminine: "สีน้ำเงินค่ะ",
        pronunciation: "see nam-ngern",
        mnemonic: "Think: 'See nam-ngern' - water (nam) + money (ngern) = blue",
        examples: [
          {
            thai: "ท้องฟ้าสีน้ำเงิน",
            thaiMasculine: "ท้องฟ้าสีน้ำเงินครับ",
            thaiFeminine: "ท้องฟ้าสีน้ำเงินค่ะ",
            pronunciation: "tong-faa see nam-ngern",
            translation: "The sky is blue."
          },
          {
            thai: "เสื้อสีน้ำเงิน",
            thaiMasculine: "เสื้อสีน้ำเงินครับ",
            thaiFeminine: "เสื้อสีน้ำเงินค่ะ",
            pronunciation: "suea see nam-ngern",
            translation: "Blue shirt."
          }
        ]
      },
      {
        english: "Green",
        thai: "สีเขียว",
        thaiMasculine: "สีเขียวครับ",
        thaiFeminine: "สีเขียวค่ะ",
        pronunciation: "see khiaw",
        mnemonic: "Think: 'See key-ow' - green is the key color of nature",
        examples: [
          {
            thai: "ใบไม้สีเขียว",
            thaiMasculine: "ใบไม้สีเขียวครับ",
            thaiFeminine: "ใบไม้สีเขียวค่ะ",
            pronunciation: "bai-mai see khiaw",
            translation: "Green leaves."
          },
          {
            thai: "ไฟเขียว",
            thaiMasculine: "ไฟเขียวครับ",
            thaiFeminine: "ไฟเขียวค่ะ",
            pronunciation: "fai khiaw",
            translation: "Green light."
          }
        ]
      },
      {
        english: "Yellow",
        thai: "สีเหลือง",
        thaiMasculine: "สีเหลืองครับ",
        thaiFeminine: "สีเหลืองค่ะ",
        pronunciation: "see lueang",
        mnemonic: "Think: 'See Luang' - monks wear yellow",
        examples: [
          {
            thai: "กล้วยสีเหลือง",
            thaiMasculine: "กล้วยสีเหลืองครับ",
            thaiFeminine: "กล้วยสีเหลืองค่ะ",
            pronunciation: "gluay see lueang",
            translation: "Yellow banana."
          },
          {
            thai: "ดอกไม้สีเหลือง",
            thaiMasculine: "ดอกไม้สีเหลืองครับ",
            thaiFeminine: "ดอกไม้สีเหลืองค่ะ",
            pronunciation: "dok-mai see lueang",
            translation: "Yellow flower."
          }
        ]
      },
      {
        english: "Black",
        thai: "สีดำ",
        thaiMasculine: "สีดำครับ",
        thaiFeminine: "สีดำค่ะ",
        pronunciation: "see dam",
        mnemonic: "Think: 'See dam' - darkness is black",
        examples: [
          {
            thai: "แมวสีดำ",
            thaiMasculine: "แมวสีดำครับ",
            thaiFeminine: "แมวสีดำค่ะ",
            pronunciation: "maew see dam",
            translation: "Black cat."
          },
          {
            thai: "กาแฟดำ",
            thaiMasculine: "กาแฟดำครับ",
            thaiFeminine: "กาแฟดำค่ะ",
            pronunciation: "ka-fae dam",
            translation: "Black coffee."
          }
        ]
      },
      {
        english: "White",
        thai: "สีขาว",
        thaiMasculine: "สีขาวครับ",
        thaiFeminine: "สีขาวค่ะ",
        pronunciation: "see khaao",
        mnemonic: "Think: 'See cow' - many cows are white",
        examples: [
          {
            thai: "ข้าวขาว",
            thaiMasculine: "ข้าวขาวครับ",
            thaiFeminine: "ข้าวขาวค่ะ",
            pronunciation: "khaao khaao",
            translation: "White rice."
          },
          {
            thai: "เมฆสีขาว",
            thaiMasculine: "เมฆสีขาวครับ",
            thaiFeminine: "เมฆสีขาวค่ะ",
            pronunciation: "mek see khaao",
            translation: "White cloud."
          }
        ]
      }
    ]
  },

  // Basic Understanding Sets (2 sets)
  {
    id: 'days-of-week',
    name: 'Days of the Week',
    level: 'Basic Understanding',
    description: 'All seven days of the week in Thai',
    phrases: [
      {
        english: "Monday",
        thai: "วันจันทร์",
        thaiMasculine: "วันจันทร์ครับ",
        thaiFeminine: "วันจันทร์ค่ะ",
        pronunciation: "wan jan",
        mnemonic: "Think: 'One chan' - Monday is day one",
        examples: [
          {
            thai: "วันจันทร์หน้า",
            thaiMasculine: "วันจันทร์หน้าครับ",
            thaiFeminine: "วันจันทร์หน้าค่ะ",
            pronunciation: "wan jan naa",
            translation: "Next Monday."
          },
          {
            thai: "ทุกวันจันทร์",
            thaiMasculine: "ทุกวันจันทร์ครับ",
            thaiFeminine: "ทุกวันจันทร์ค่ะ",
            pronunciation: "took wan jan",
            translation: "Every Monday."
          }
        ]
      },
      {
        english: "Tuesday",
        thai: "วันอังคาร",
        thaiMasculine: "วันอังคารครับ",
        thaiFeminine: "วันอังคารค่ะ",
        pronunciation: "wan ang-khaan",
        mnemonic: "Think: 'Ankle car' - Tuesday I hurt my ankle getting in the car",
        examples: [
          {
            thai: "วันอังคารที่แล้ว",
            thaiMasculine: "วันอังคารที่แล้วครับ",
            thaiFeminine: "วันอังคารที่แล้วค่ะ",
            pronunciation: "wan ang-khaan tee laew",
            translation: "Last Tuesday."
          },
          {
            thai: "เจอกันวันอังคาร",
            thaiMasculine: "เจอกันวันอังคารครับ",
            thaiFeminine: "เจอกันวันอังคารค่ะ",
            pronunciation: "jer gan wan ang-khaan",
            translation: "See you on Tuesday."
          }
        ]
      },
      {
        english: "Wednesday",
        thai: "วันพุธ",
        thaiMasculine: "วันพุธครับ",
        thaiFeminine: "วันพุธค่ะ",
        pronunciation: "wan poot",
        mnemonic: "Think: 'One put' - Wednesday I put one thing away",
        examples: [
          {
            thai: "พรุ่งนี้วันพุธ",
            thaiMasculine: "พรุ่งนี้วันพุธครับ",
            thaiFeminine: "พรุ่งนี้วันพุธค่ะ",
            pronunciation: "proong-nee wan poot",
            translation: "Tomorrow is Wednesday."
          },
          {
            thai: "ปิดวันพุธ",
            thaiMasculine: "ปิดวันพุธครับ",
            thaiFeminine: "ปิดวันพุธค่ะ",
            pronunciation: "pit wan poot",
            translation: "Closed on Wednesday."
          }
        ]
      },
      {
        english: "Thursday",
        thai: "วันพฤหัสบดี",
        thaiMasculine: "วันพฤหัสบดีครับ",
        thaiFeminine: "วันพฤหัสบดีค่ะ",
        pronunciation: "wan pa-rue-hat-sa-bor-dee",
        mnemonic: "Think: 'Pour us buddy' - Thursday pour us a drink buddy",
        examples: [
          {
            thai: "วันพฤหัสนี้",
            thaiMasculine: "วันพฤหัสนี้ครับ",
            thaiFeminine: "วันพฤหัสนี้ค่ะ",
            pronunciation: "wan pa-rue-hat nee",
            translation: "This Thursday."
          },
          {
            thai: "หยุดวันพฤหัส",
            thaiMasculine: "หยุดวันพฤหัสครับ",
            thaiFeminine: "หยุดวันพฤหัสค่ะ",
            pronunciation: "yoot wan pa-rue-hat",
            translation: "Day off on Thursday."
          }
        ]
      },
      {
        english: "Friday",
        thai: "วันศุกร์",
        thaiMasculine: "วันศุกร์ครับ",
        thaiFeminine: "วันศุกร์ค่ะ",
        pronunciation: "wan sook",
        mnemonic: "Think: 'One sook' - Friday I soak in the tub",
        examples: [
          {
            thai: "วันศุกร์เย็น",
            thaiMasculine: "วันศุกร์เย็นครับ",
            thaiFeminine: "วันศุกร์เย็นค่ะ",
            pronunciation: "wan sook yen",
            translation: "Friday evening."
          },
          {
            thai: "ทำงานถึงวันศุกร์",
            thaiMasculine: "ทำงานถึงวันศุกร์ครับ",
            thaiFeminine: "ทำงานถึงวันศุกร์ค่ะ",
            pronunciation: "tam-ngan teung wan sook",
            translation: "Work until Friday."
          }
        ]
      },
      {
        english: "Saturday",
        thai: "วันเสาร์",
        thaiMasculine: "วันเสาร์ครับ",
        thaiFeminine: "วันเสาร์ค่ะ",
        pronunciation: "wan sao",
        mnemonic: "Think: 'One sow' - Saturday I saw one sow (pig)",
        examples: [
          {
            thai: "วันเสาร์อาทิตย์",
            thaiMasculine: "วันเสาร์อาทิตย์ครับ",
            thaiFeminine: "วันเสาร์อาทิตย์ค่ะ",
            pronunciation: "wan sao aa-tit",
            translation: "Weekend (Saturday-Sunday)."
          },
          {
            thai: "เปิดวันเสาร์",
            thaiMasculine: "เปิดวันเสาร์ครับ",
            thaiFeminine: "เปิดวันเสาร์ค่ะ",
            pronunciation: "perd wan sao",
            translation: "Open on Saturday."
          }
        ]
      },
      {
        english: "Sunday",
        thai: "วันอาทิตย์",
        thaiMasculine: "วันอาทิตย์ครับ",
        thaiFeminine: "วันอาทิตย์ค่ะ",
        pronunciation: "wan aa-tit",
        mnemonic: "Think: 'One artist' - Sunday the artist paints",
        examples: [
          {
            thai: "วันอาทิตย์นี้",
            thaiMasculine: "วันอาทิตย์นี้ครับ",
            thaiFeminine: "วันอาทิตย์นี้ค่ะ",
            pronunciation: "wan aa-tit nee",
            translation: "This Sunday."
          },
          {
            thai: "พักผ่อนวันอาทิตย์",
            thaiMasculine: "พักผ่อนวันอาทิตย์ครับ",
            thaiFeminine: "พักผ่อนวันอาทิตย์ค่ะ",
            pronunciation: "pak-pon wan aa-tit",
            translation: "Rest on Sunday."
          }
        ]
      }
    ]
  },
  {
    id: 'family-members',
    name: 'Family Members',
    level: 'Basic Understanding',
    description: 'Basic family relationships in Thai',
    phrases: [
      {
        english: "Father",
        thai: "พ่อ",
        thaiMasculine: "พ่อครับ",
        thaiFeminine: "พ่อค่ะ",
        pronunciation: "phor",
        mnemonic: "Think: 'Poor' dad works hard",
        examples: [
          {
            thai: "พ่อของฉัน",
            thaiMasculine: "พ่อของผมครับ",
            thaiFeminine: "พ่อของฉันค่ะ",
            pronunciation: "phor khong phom/chan",
            translation: "My father."
          },
          {
            thai: "พ่อทำงาน",
            thaiMasculine: "พ่อทำงานครับ",
            thaiFeminine: "พ่อทำงานค่ะ",
            pronunciation: "phor tam-ngan",
            translation: "Father is working."
          }
        ]
      },
      {
        english: "Mother",
        thai: "แม่",
        thaiMasculine: "แม่ครับ",
        thaiFeminine: "แม่ค่ะ",
        pronunciation: "mae",
        mnemonic: "Think: 'May' - Mother's day is in May",
        examples: [
          {
            thai: "แม่ทำอาหาร",
            thaiMasculine: "แม่ทำอาหารครับ",
            thaiFeminine: "แม่ทำอาหารค่ะ",
            pronunciation: "mae tam aa-han",
            translation: "Mother is cooking."
          },
          {
            thai: "รักแม่",
            thaiMasculine: "ผมรักแม่ครับ",
            thaiFeminine: "ฉันรักแม่ค่ะ",
            pronunciation: "phom/chan rak mae",
            translation: "I love mother."
          }
        ]
      },
      {
        english: "Older sibling",
        thai: "พี่",
        thaiMasculine: "พี่ครับ",
        thaiFeminine: "พี่ค่ะ",
        pronunciation: "pee",
        mnemonic: "Think: 'P' comes before in alphabet - older",
        examples: [
          {
            thai: "พี่ชาย",
            thaiMasculine: "พี่ชายครับ",
            thaiFeminine: "พี่ชายค่ะ",
            pronunciation: "pee chai",
            translation: "Older brother."
          },
          {
            thai: "พี่สาว",
            thaiMasculine: "พี่สาวครับ",
            thaiFeminine: "พี่สาวค่ะ",
            pronunciation: "pee sao",
            translation: "Older sister."
          }
        ]
      },
      {
        english: "Younger sibling",
        thai: "น้อง",
        thaiMasculine: "น้องครับ",
        thaiFeminine: "น้องค่ะ",
        pronunciation: "nong",
        mnemonic: "Think: 'Nong' - younger ones need nurturing",
        examples: [
          {
            thai: "น้องชาย",
            thaiMasculine: "น้องชายครับ",
            thaiFeminine: "น้องชายค่ะ",
            pronunciation: "nong chai",
            translation: "Younger brother."
          },
          {
            thai: "น้องสาว",
            thaiMasculine: "น้องสาวครับ",
            thaiFeminine: "น้องสาวค่ะ",
            pronunciation: "nong sao",
            translation: "Younger sister."
          }
        ]
      },
      {
        english: "Child",
        thai: "ลูก",
        thaiMasculine: "ลูกครับ",
        thaiFeminine: "ลูกค่ะ",
        pronunciation: "look",
        mnemonic: "Think: 'Look' at my child",
        examples: [
          {
            thai: "ลูกสาว",
            thaiMasculine: "ลูกสาวครับ",
            thaiFeminine: "ลูกสาวค่ะ",
            pronunciation: "look sao",
            translation: "Daughter."
          },
          {
            thai: "ลูกชาย",
            thaiMasculine: "ลูกชายครับ",
            thaiFeminine: "ลูกชายค่ะ",
            pronunciation: "look chai",
            translation: "Son."
          }
        ]
      }
      ,
      {
        english: "Older brother",
        thai: "พี่ชาย",
        thaiMasculine: "พี่ชายครับ",
        thaiFeminine: "พี่ชายค่ะ",
        pronunciation: "pee chaai",
        mnemonic: "P comes before → older; 'chai' sounds like 'chai' tea for bros",
        examples: [
          {
            thai: "พี่ชายของฉัน",
            thaiMasculine: "พี่ชายของผมครับ",
            thaiFeminine: "พี่ชายของฉันค่ะ",
            pronunciation: "pee chaai khong phom/chan",
            translation: "My older brother."
          },
          {
            thai: "พี่ชายอยู่กรุงเทพ",
            thaiMasculine: "พี่ชายอยู่กรุงเทพครับ",
            thaiFeminine: "พี่ชายอยู่กรุงเทพค่ะ",
            pronunciation: "pee chaai yuu krung-thep",
            translation: "My older brother lives in Bangkok."
          }
        ]
      },
      {
        english: "Older sister",
        thai: "พี่สาว",
        thaiMasculine: "พี่สาวครับ",
        thaiFeminine: "พี่สาวค่ะ",
        pronunciation: "pee saao",
        mnemonic: "P comes before → older; 'sao' is sister",
        examples: [
          {
            thai: "พี่สาวของฉันใจดี",
            thaiMasculine: "พี่สาวของผมใจดีครับ",
            thaiFeminine: "พี่สาวของฉันใจดีค่ะ",
            pronunciation: "pee saao khong phom/chan jai dee",
            translation: "My older sister is kind."
          },
          {
            thai: "พี่สาวทำงานเป็นพยาบาล",
            thaiMasculine: "พี่สาวทำงานเป็นพยาบาลครับ",
            thaiFeminine: "พี่สาวทำงานเป็นพยาบาลค่ะ",
            pronunciation: "pee saao tam-ngaan pen pha-yaa-baan",
            translation: "My older sister works as a nurse."
          }
        ]
      },
      {
        english: "Younger brother",
        thai: "น้องชาย",
        thaiMasculine: "น้องชายครับ",
        thaiFeminine: "น้องชายค่ะ",
        pronunciation: "nong chaai",
        mnemonic: "Nong = younger; 'chai' is brother",
        examples: [
          {
            thai: "น้องชายเรียนมหาวิทยาลัย",
            thaiMasculine: "น้องชายเรียนมหาวิทยาลัยครับ",
            thaiFeminine: "น้องชายเรียนมหาวิทยาลัยค่ะ",
            pronunciation: "nong chaai rian ma-ha-wit-tha-yaa-lai",
            translation: "My younger brother studies at university."
          },
          {
            thai: "น้องชายชอบฟุตบอล",
            thaiMasculine: "น้องชายชอบฟุตบอลครับ",
            thaiFeminine: "น้องชายชอบฟุตบอลค่ะ",
            pronunciation: "nong chaai chop foot-bon",
            translation: "My younger brother likes football."
          }
        ]
      },
      {
        english: "Younger sister",
        thai: "น้องสาว",
        thaiMasculine: "น้องสาวครับ",
        thaiFeminine: "น้องสาวค่ะ",
        pronunciation: "nong saao",
        mnemonic: "Nong = younger; 'sao' is sister",
        examples: [
          {
            thai: "น้องสาวไปโรงเรียน",
            thaiMasculine: "น้องสาวไปโรงเรียนครับ",
            thaiFeminine: "น้องสาวไปโรงเรียนค่ะ",
            pronunciation: "nong saao pai rohng-rian",
            translation: "My younger sister goes to school."
          },
          {
            thai: "น้องสาวชอบอ่านหนังสือ",
            thaiMasculine: "น้องสาวชอบอ่านหนังสือครับ",
            thaiFeminine: "น้องสาวชอบอ่านหนังสือค่ะ",
            pronunciation: "nong saao chop aan nang-seu",
            translation: "My younger sister likes reading."
          }
        ]
      },
      {
        english: "Uncle (older than parent)",
        thai: "ลุง",
        thaiMasculine: "ลุงครับ",
        thaiFeminine: "ลุงค่ะ",
        pronunciation: "lung",
        mnemonic: "Older uncle is 'lung' — long-lived elder",
        examples: [
          {
            thai: "ลุงของฉันอยู่เชียงใหม่",
            thaiMasculine: "ลุงของผมอยู่เชียงใหม่ครับ",
            thaiFeminine: "ลุงของฉันอยู่เชียงใหม่ค่ะ",
            pronunciation: "lung khong phom/chan yuu chiang-mai",
            translation: "My uncle lives in Chiang Mai."
          },
          {
            thai: "ลุงทำสวนผลไม้",
            thaiMasculine: "ลุงทำสวนผลไม้ครับ",
            thaiFeminine: "ลุงทำสวนผลไม้ค่ะ",
            pronunciation: "lung tam suan phon-la-mai",
            translation: "My uncle runs a fruit orchard."
          }
        ]
      },
      {
        english: "Aunt (older than parent)",
        thai: "ป้า",
        thaiMasculine: "ป้าครับ",
        thaiFeminine: "ป้าค่ะ",
        pronunciation: "paa",
        mnemonic: "Older aunt is 'paa' — like paaa-rents' elder",
        examples: [
          {
            thai: "ป้าทำกับข้าวอร่อยมาก",
            thaiMasculine: "ป้าทำกับข้าวอร่อยมากครับ",
            thaiFeminine: "ป้าทำกับข้าวอร่อยมากค่ะ",
            pronunciation: "paa tam gap khao a-roi mak",
            translation: "My aunt cooks very delicious food."
          },
          {
            thai: "ป้าอยู่ใกล้บ้านเรา",
            thaiMasculine: "ป้าอยู่ใกล้บ้านเราครับ",
            thaiFeminine: "ป้าอยู่ใกล้บ้านเราค่ะ",
            pronunciation: "paa yuu glai baan rao",
            translation: "My aunt lives near our house."
          }
        ]
      }
    ]
  },

  // Intermediate Sets (2 sets)
  {
    id: 'months-of-year',
    name: 'Months of the Year',
    level: 'Intermediate',
    description: 'All twelve months in Thai',
    phrases: [
      {
        english: "January",
        thai: "มกราคม",
        thaiMasculine: "เดือนมกราคมครับ",
        thaiFeminine: "เดือนมกราคมค่ะ",
        pronunciation: "mok-ga-raa-kom",
        mnemonic: "Think: 'Mock a rock home' - January is cold like a rock",
        examples: [
          {
            thai: "เดือนมกราคมหนาว",
            thaiMasculine: "เดือนมกราคมหนาวครับ",
            thaiFeminine: "เดือนมกราคมหนาวค่ะ",
            pronunciation: "duean mok-ga-raa-kom naao",
            translation: "January is cold."
          },
          {
            thai: "ปีใหม่ในเดือนมกราคม",
            thaiMasculine: "ปีใหม่ในเดือนมกราคมครับ",
            thaiFeminine: "ปีใหม่ในเดือนมกราคมค่ะ",
            pronunciation: "pee mai nai duean mok-ga-raa-kom",
            translation: "New Year in January."
          }
        ]
      },
      {
        english: "February",
        thai: "กุมภาพันธ์",
        thaiMasculine: "เดือนกุมภาพันธ์ครับ",
        thaiFeminine: "เดือนกุมภาพันธ์ค่ะ",
        pronunciation: "goom-paa-pan",
        mnemonic: "Think: 'Goom pa pan' - February cupid shoots from a pan",
        examples: [
          {
            thai: "วันวาเลนไทน์ในเดือนกุมภาพันธ์",
            thaiMasculine: "วันวาเลนไทน์ในเดือนกุมภาพันธ์ครับ",
            thaiFeminine: "วันวาเลนไทน์ในเดือนกุมภาพันธ์ค่ะ",
            pronunciation: "wan valentine nai duean goom-paa-pan",
            translation: "Valentine's Day in February."
          },
          {
            thai: "กุมภาพันธ์มี 28 วัน",
            thaiMasculine: "กุมภาพันธ์มี 28 วันครับ",
            thaiFeminine: "กุมภาพันธ์มี 28 วันค่ะ",
            pronunciation: "goom-paa-pan mee yee-sip paet wan",
            translation: "February has 28 days."
          }
        ]
      },
      {
        english: "March",
        thai: "มีนาคม",
        thaiMasculine: "เดือนมีนาคมครับ",
        thaiFeminine: "เดือนมีนาคมค่ะ",
        pronunciation: "mee-naa-kom",
        mnemonic: "Think: 'Me nah come' - March I'm coming",
        examples: [
          {
            thai: "ฤดูใบไม้ผลิในเดือนมีนาคม",
            thaiMasculine: "ฤดูใบไม้ผลิในเดือนมีนาคมครับ",
            thaiFeminine: "ฤดูใบไม้ผลิในเดือนมีนาคมค่ะ",
            pronunciation: "rue-doo bai-mai-pli nai duean mee-naa-kom",
            translation: "Spring in March."
          },
          {
            thai: "สิ้นเดือนมีนาคม",
            thaiMasculine: "สิ้นเดือนมีนาคมครับ",
            thaiFeminine: "สิ้นเดือนมีนาคมค่ะ",
            pronunciation: "sin duean mee-naa-kom",
            translation: "End of March."
          }
        ]
      },
      {
        english: "April",
        thai: "เมษายน",
        thaiMasculine: "เดือนเมษายนครับ",
        thaiFeminine: "เดือนเมษายนค่ะ",
        pronunciation: "may-saa-yon",
        mnemonic: "Think: 'May say yawn' - April makes me yawn",
        examples: [
          {
            thai: "สงกรานต์ในเดือนเมษายน",
            thaiMasculine: "สงกรานต์ในเดือนเมษายนครับ",
            thaiFeminine: "สงกรานต์ในเดือนเมษายนค่ะ",
            pronunciation: "song-graan nai duean may-saa-yon",
            translation: "Songkran in April."
          },
          {
            thai: "เมษายนร้อนมาก",
            thaiMasculine: "เมษายนร้อนมากครับ",
            thaiFeminine: "เมษายนร้อนมากค่ะ",
            pronunciation: "may-saa-yon ron maak",
            translation: "April is very hot."
          }
        ]
      },
      {
        english: "May",
        thai: "พฤษภาคม",
        thaiMasculine: "เดือนพฤษภาคมครับ",
        thaiFeminine: "เดือนพฤษภาคมค่ะ",
        pronunciation: "pruet-sa-paa-kom",
        mnemonic: "Think: 'Fruit spa come' - May fruits come to spa",
        examples: [
          {
            thai: "ฝนตกในเดือนพฤษภาคม",
            thaiMasculine: "ฝนตกในเดือนพฤษภาคมครับ",
            thaiFeminine: "ฝนตกในเดือนพฤษภาคมค่ะ",
            pronunciation: "fon tok nai duean pruet-sa-paa-kom",
            translation: "Rain in May."
          },
          {
            thai: "ต้นเดือนพฤษภาคม",
            thaiMasculine: "ต้นเดือนพฤษภาคมครับ",
            thaiFeminine: "ต้นเดือนพฤษภาคมค่ะ",
            pronunciation: "ton duean pruet-sa-paa-kom",
            translation: "Beginning of May."
          }
        ]
      },
      {
        english: "June",
        thai: "มิถุนายน",
        thaiMasculine: "เดือนมิถุนายนครับ",
        thaiFeminine: "เดือนมิถุนายนค่ะ",
        pronunciation: "mi-tu-naa-yon",
        mnemonic: "Think: 'Me too nah yawn' - June makes me yawn too",
        examples: [
          {
            thai: "ฤดูฝนในเดือนมิถุนายน",
            thaiMasculine: "ฤดูฝนในเดือนมิถุนายนครับ",
            thaiFeminine: "ฤดูฝนในเดือนมิถุนายนค่ะ",
            pronunciation: "rue-doo fon nai duean mi-tu-naa-yon",
            translation: "Rainy season in June."
          },
          {
            thai: "กลางเดือนมิถุนายน",
            thaiMasculine: "กลางเดือนมิถุนายนครับ",
            thaiFeminine: "กลางเดือนมิถุนายนค่ะ",
            pronunciation: "glaang duean mi-tu-naa-yon",
            translation: "Mid-June."
          }
        ]
      },
      {
        english: "July",
        thai: "กรกฎาคม",
        thaiMasculine: "เดือนกรกฎาคมครับ",
        thaiFeminine: "เดือนกรกฎาคมค่ะ",
        pronunciation: "ga-ra-ga-da-kom",
        mnemonic: "'Ga-ragga-da' — fireworks in July",
        examples: [
          {
            thai: "กรกฎาคมเป็นหน้าฝน",
            thaiMasculine: "กรกฎาคมเป็นหน้าฝนครับ",
            thaiFeminine: "กรกฎาคมเป็นหน้าฝนค่ะ",
            pronunciation: "ga-ra-ga-da-kom pen naa fon",
            translation: "July is in the rainy season."
          },
          {
            thai: "ฉันเกิดเดือนกรกฎาคม",
            thaiMasculine: "ผมเกิดเดือนกรกฎาคมครับ",
            thaiFeminine: "ฉันเกิดเดือนกรกฎาคมค่ะ",
            pronunciation: "chan/phom koet duean ga-ra-ga-da-kom",
            translation: "I was born in July."
          }
        ]
      },
      {
        english: "August",
        thai: "สิงหาคม",
        thaiMasculine: "เดือนสิงหาคมครับ",
        thaiFeminine: "เดือนสิงหาคมค่ะ",
        pronunciation: "sing-haa-kom",
        mnemonic: "'Singha' like the lion month",
        examples: [
          {
            thai: "สิงหาคมฝนตกบ่อย",
            thaiMasculine: "สิงหาคมฝนตกบ่อยครับ",
            thaiFeminine: "สิงหาคมฝนตกบ่อยค่ะ",
            pronunciation: "sing-haa-kom fon tok boi",
            translation: "It rains often in August."
          },
          {
            thai: "เราจะไปเที่ยวในเดือนสิงหาคม",
            thaiMasculine: "เราจะไปเที่ยวในเดือนสิงหาคมครับ",
            thaiFeminine: "เราจะไปเที่ยวในเดือนสิงหาคมค่ะ",
            pronunciation: "rao ja pai tiew nai duean sing-haa-kom",
            translation: "We will travel in August."
          }
        ]
      },
      {
        english: "September",
        thai: "กันยายน",
        thaiMasculine: "เดือนกันยายนครับ",
        thaiFeminine: "เดือนกันยายนค่ะ",
        pronunciation: "gan-yaa-yon",
        mnemonic: "'Kan-yaa' — school term starts",
        examples: [
          {
            thai: "กันยายนเปิดเทอม",
            thaiMasculine: "กันยายนเปิดเทอมครับ",
            thaiFeminine: "กันยายนเปิดเทอมค่ะ",
            pronunciation: "gan-yaa-yon pirt term",
            translation: "The term starts in September."
          },
          {
            thai: "กันยายนอากาศดี",
            thaiMasculine: "กันยายนอากาศดีครับ",
            thaiFeminine: "กันยายนอากาศดีค่ะ",
            pronunciation: "gan-yaa-yon aa-gaat dee",
            translation: "The weather is nice in September."
          }
        ]
      },
      {
        english: "October",
        thai: "ตุลาคม",
        thaiMasculine: "เดือนตุลาคมครับ",
        thaiFeminine: "เดือนตุลาคมค่ะ",
        pronunciation: "tu-laa-kom",
        mnemonic: "'Tu-la' — cool season approaches",
        examples: [
          {
            thai: "ตุลาคมเริ่มเย็น",
            thaiMasculine: "ตุลาคมเริ่มเย็นครับ",
            thaiFeminine: "ตุลาคมเริ่มเย็นค่ะ",
            pronunciation: "tu-laa-kom roem yen",
            translation: "October starts to get cooler."
          },
          {
            thai: "เรามีนัดเดือนตุลาคม",
            thaiMasculine: "เรามีนัดเดือนตุลาคมครับ",
            thaiFeminine: "เรามีนัดเดือนตุลาคมค่ะ",
            pronunciation: "rao mee nat duean tu-laa-kom",
            translation: "We have an appointment in October."
          }
        ]
      },
      {
        english: "November",
        thai: "พฤศจิกายน",
        thaiMasculine: "เดือนพฤศจิกายนครับ",
        thaiFeminine: "เดือนพฤศจิกายนค่ะ",
        pronunciation: "phruet-sa-ji-gaa-yon",
        mnemonic: "Long 'phruet-sa-ji' — Loy Krathong month",
        examples: [
          {
            thai: "ลอยกระทงมักอยู่ในเดือนพฤศจิกายน",
            thaiMasculine: "ลอยกระทงมักอยู่ในเดือนพฤศจิกายนครับ",
            thaiFeminine: "ลอยกระทงมักอยู่ในเดือนพฤศจิกายนค่ะ",
            pronunciation: "loy kra-thong mak yuu nai duean phruet-sa-ji-gaa-yon",
            translation: "Loy Krathong is often in November."
          },
          {
            thai: "พฤศจิกายนอากาศเย็นสบาย",
            thaiMasculine: "พฤศจิกายนอากาศเย็นสบายครับ",
            thaiFeminine: "พฤศจิกายนอากาศเย็นสบายค่ะ",
            pronunciation: "phruet-sa-ji-gaa-yon aa-gaat yen sa-baai",
            translation: "November weather is pleasantly cool."
          }
        ]
      },
      {
        english: "December",
        thai: "ธันวาคม",
        thaiMasculine: "เดือนธันวาคมครับ",
        thaiFeminine: "เดือนธันวาคมค่ะ",
        pronunciation: "than-waa-kom",
        mnemonic: "'Than-waa' — holidays month",
        examples: [
          {
            thai: "ธันวาคมเป็นเดือนสุดท้ายของปี",
            thaiMasculine: "ธันวาคมเป็นเดือนสุดท้ายของปีครับ",
            thaiFeminine: "ธันวาคมเป็นเดือนสุดท้ายของปีค่ะ",
            pronunciation: "than-waa-kom pen duean sut-thaai khong pii",
            translation: "December is the last month of the year."
          },
          {
            thai: "ปลายเดือนธันวาคมมีวันหยุดยาว",
            thaiMasculine: "ปลายเดือนธันวาคมมีวันหยุดยาวครับ",
            thaiFeminine: "ปลายเดือนธันวาคมมีวันหยุดยาวค่ะ",
            pronunciation: "plaai duean than-waa-kom mee wan yut yaao",
            translation: "At the end of December there is a long holiday."
          }
        ]
      }
    ]
  },
  {
    id: 'body-parts',
    name: 'Body Parts',
    level: 'Intermediate',
    description: 'Common body parts in Thai',
    phrases: [
      {
        english: "Head",
        thai: "หัว",
        thaiMasculine: "หัวครับ",
        thaiFeminine: "หัวค่ะ",
        pronunciation: "hua",
        mnemonic: "Think: 'Who-ah' - who hit my head?",
        examples: [
          {
            thai: "ปวดหัว",
            thaiMasculine: "ผมปวดหัวครับ",
            thaiFeminine: "ฉันปวดหัวค่ะ",
            pronunciation: "phom/chan puat hua",
            translation: "I have a headache."
          },
          {
            thai: "หัวของเขา",
            thaiMasculine: "หัวของเขาครับ",
            thaiFeminine: "หัวของเขาค่ะ",
            pronunciation: "hua khong khao",
            translation: "His/her head."
          }
        ]
      },
      {
        english: "Eye",
        thai: "ตา",
        thaiMasculine: "ตาครับ",
        thaiFeminine: "ตาค่ะ",
        pronunciation: "taa",
        mnemonic: "Think: 'Ta' - like 'ta-ta' waving goodbye with eyes",
        examples: [
          {
            thai: "ตาสีน้ำตาล",
            thaiMasculine: "ตาสีน้ำตาลครับ",
            thaiFeminine: "ตาสีน้ำตาลค่ะ",
            pronunciation: "taa see nam-taan",
            translation: "Brown eyes."
          },
          {
            thai: "หลับตา",
            thaiMasculine: "หลับตาครับ",
            thaiFeminine: "หลับตาค่ะ",
            pronunciation: "lap taa",
            translation: "Close eyes."
          }
        ]
      },
      {
        english: "Nose",
        thai: "จมูก",
        thaiMasculine: "จมูกครับ",
        thaiFeminine: "จมูกค่ะ",
        pronunciation: "ja-mook",
        mnemonic: "Think: 'Jam-ook' - jam looks like a nose",
        examples: [
          {
            thai: "จมูกโด่ง",
            thaiMasculine: "จมูกโด่งครับ",
            thaiFeminine: "จมูกโด่งค่ะ",
            pronunciation: "ja-mook dong",
            translation: "High nose bridge."
          },
          {
            thai: "เลือดกำเดาออก",
            thaiMasculine: "เลือดกำเดาออกครับ",
            thaiFeminine: "เลือดกำเดาออกค่ะ",
            pronunciation: "lueat gam-dao ok",
            translation: "Nosebleed."
          }
        ]
      },
      {
        english: "Mouth",
        thai: "ปาก",
        thaiMasculine: "ปากครับ",
        thaiFeminine: "ปากค่ะ",
        pronunciation: "paak",
        mnemonic: "Think: 'Pack' - pack food in your mouth",
        examples: [
          {
            thai: "เปิดปาก",
            thaiMasculine: "เปิดปากครับ",
            thaiFeminine: "เปิดปากค่ะ",
            pronunciation: "perd paak",
            translation: "Open mouth."
          },
          {
            thai: "ปากแห้ง",
            thaiMasculine: "ปากแห้งครับ",
            thaiFeminine: "ปากแห้งค่ะ",
            pronunciation: "paak haeng",
            translation: "Dry mouth."
          }
        ]
      },
      {
        english: "Hand",
        thai: "มือ",
        thaiMasculine: "มือครับ",
        thaiFeminine: "มือค่ะ",
        pronunciation: "mue",
        mnemonic: "Think: 'Moo' - cow's hoof like a hand",
        examples: [
          {
            thai: "ล้างมือ",
            thaiMasculine: "ล้างมือครับ",
            thaiFeminine: "ล้างมือค่ะ",
            pronunciation: "laang mue",
            translation: "Wash hands."
          },
          {
            thai: "จับมือ",
            thaiMasculine: "จับมือครับ",
            thaiFeminine: "จับมือค่ะ",
            pronunciation: "jap mue",
            translation: "Hold hands."
          }
        ]
      },
      {
        english: "Foot",
        thai: "เท้า",
        thaiMasculine: "เท้าครับ",
        thaiFeminine: "เท้าค่ะ",
        pronunciation: "tao",
        mnemonic: "Think: 'Tao' - the Tao of walking uses feet",
        examples: [
          {
            thai: "เท้าเปล่า",
            thaiMasculine: "เท้าเปล่าครับ",
            thaiFeminine: "เท้าเปล่าค่ะ",
            pronunciation: "tao plao",
            translation: "Bare feet."
          },
          {
            thai: "รองเท้า",
            thaiMasculine: "รองเท้าครับ",
            thaiFeminine: "รองเท้าค่ะ",
            pronunciation: "rong-tao",
            translation: "Shoes."
          }
        ]
      },
      {
        english: "Ear",
        thai: "หู",
        thaiMasculine: "หูครับ",
        thaiFeminine: "หูค่ะ",
        pronunciation: "hoo",
        mnemonic: "Two holes → two ears 'hoo'",
        examples: [
          {
            thai: "ปวดหู",
            thaiMasculine: "ผมปวดหูครับ",
            thaiFeminine: "ฉันปวดหูค่ะ",
            pronunciation: "puat hoo",
            translation: "I have an earache."
          },
          {
            thai: "ช่วยฟังด้วยหู",
            thaiMasculine: "ช่วยฟังด้วยหูครับ",
            thaiFeminine: "ช่วยฟังด้วยหูค่ะ",
            pronunciation: "chuai fang duai hoo",
            translation: "Please listen with your ears."
          }
        ]
      },
      {
        english: "Arm",
        thai: "แขน",
        thaiMasculine: "แขนครับ",
        thaiFeminine: "แขนค่ะ",
        pronunciation: "khaen",
        mnemonic: "Arm can 'khaen' carry",
        examples: [
          {
            thai: "ปวดแขน",
            thaiMasculine: "ผมปวดแขนครับ",
            thaiFeminine: "ฉันปวดแขนค่ะ",
            pronunciation: "puat khaen",
            translation: "My arm hurts."
          },
          {
            thai: "ยกแขนขึ้น",
            thaiMasculine: "ยกแขนขึ้นครับ",
            thaiFeminine: "ยกแขนขึ้นค่ะ",
            pronunciation: "yok khaen khen",
            translation: "Raise your arm."
          }
        ]
      },
      {
        english: "Leg",
        thai: "ขา",
        thaiMasculine: "ขาครับ",
        thaiFeminine: "ขาค่ะ",
        pronunciation: "khaa",
        mnemonic: "Legs carry 'khaa' body",
        examples: [
          {
            thai: "ปวดขา",
            thaiMasculine: "ผมปวดขาครับ",
            thaiFeminine: "ฉันปวดขาค่ะ",
            pronunciation: "puat khaa",
            translation: "My leg hurts."
          },
          {
            thai: "ยืดขา",
            thaiMasculine: "ยืดขาครับ",
            thaiFeminine: "ยืดขาค่ะ",
            pronunciation: "yuet khaa",
            translation: "Stretch your leg."
          }
        ]
      },
      {
        english: "Heart",
        thai: "หัวใจ",
        thaiMasculine: "หัวใจครับ",
        thaiFeminine: "หัวใจค่ะ",
        pronunciation: "hua-jai",
        mnemonic: "'Hua' head + 'jai' heart",
        examples: [
          {
            thai: "หัวใจเต้นเร็ว",
            thaiMasculine: "หัวใจเต้นเร็วครับ",
            thaiFeminine: "หัวใจเต้นเร็วค่ะ",
            pronunciation: "hua-jai ten reo",
            translation: "My heart is beating fast."
          },
          {
            thai: "ดูแลหัวใจให้ดี",
            thaiMasculine: "ดูแลหัวใจให้ดีครับ",
            thaiFeminine: "ดูแลหัวใจให้ดีค่ะ",
            pronunciation: "doo-lae hua-jai hai dee",
            translation: "Take good care of your heart."
          }
        ]
      },
      {
        english: "Stomach",
        thai: "ท้อง",
        thaiMasculine: "ท้องครับ",
        thaiFeminine: "ท้องค่ะ",
        pronunciation: "thong",
        mnemonic: "Hungry? empty 'thong'",
        examples: [
          {
            thai: "ปวดท้อง",
            thaiMasculine: "ผมปวดท้องครับ",
            thaiFeminine: "ฉันปวดท้องค่ะ",
            pronunciation: "puat thong",
            translation: "I have a stomachache."
          },
          {
            thai: "ท้องหิว",
            thaiMasculine: "ผมหิวท้องครับ",
            thaiFeminine: "ฉันท้องหิวค่ะ",
            pronunciation: "thong hiu",
            translation: "I'm hungry."
          }
        ]
      },
      {
        english: "Back",
        thai: "หลัง",
        thaiMasculine: "หลังครับ",
        thaiFeminine: "หลังค่ะ",
        pronunciation: "lang",
        mnemonic: "Lean back 'lang'",
        examples: [
          {
            thai: "ปวดหลัง",
            thaiMasculine: "ผมปวดหลังครับ",
            thaiFeminine: "ฉันปวดหลังค่ะ",
            pronunciation: "puat lang",
            translation: "I have back pain."
          },
          {
            thai: "นั่งหลังตรง",
            thaiMasculine: "นั่งหลังตรงครับ",
            thaiFeminine: "นั่งหลังตรงค่ะ",
            pronunciation: "nang lang trong",
            translation: "Sit with a straight back."
          }
        ]
      }
    ]
  },
];

// Import common words sets
import { COMMON_WORDS_SETS } from './common-words-sets';

// Export combined sets
export const ALL_DEFAULT_SETS = [...DEFAULT_SETS, ...COMMON_WORDS_SETS];