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
      }
    ]
  },

  // Advanced Sets (2 sets)
  {
    id: 'weather-terms',
    name: 'Weather & Climate',
    level: 'Advanced',
    description: 'Weather conditions and climate terms',
    phrases: [
      {
        english: "It's raining heavily",
        thai: "ฝนตกหนัก",
        thaiMasculine: "ฝนตกหนักครับ",
        thaiFeminine: "ฝนตกหนักค่ะ",
        pronunciation: "fon tok nak",
        mnemonic: "Think: 'Phone talk knock' - rain knocks while on phone",
        examples: [
          {
            thai: "วันนี้ฝนตกหนักมาก ออกไปไม่ได้",
            thaiMasculine: "วันนี้ฝนตกหนักมากครับ ออกไปไม่ได้",
            thaiFeminine: "วันนี้ฝนตกหนักมากค่ะ ออกไปไม่ได้",
            pronunciation: "wan-nee fon tok nak maak, ok pai mai dai",
            translation: "It's raining very heavily today, can't go out."
          },
          {
            thai: "ฝนตกหนักตั้งแต่เมื่อวาน",
            thaiMasculine: "ฝนตกหนักตั้งแต่เมื่อวานครับ",
            thaiFeminine: "ฝนตกหนักตั้งแต่เมื่อวานค่ะ",
            pronunciation: "fon tok nak tang-tae meua-wan",
            translation: "It has been raining heavily since yesterday."
          }
        ]
      },
      {
        english: "The weather is humid",
        thai: "อากาศชื้น",
        thaiMasculine: "อากาศชื้นครับ",
        thaiFeminine: "อากาศชื้นค่ะ",
        pronunciation: "aa-gaat chuen",
        mnemonic: "Think: 'Ah got chewin' - humid makes you chew air",
        examples: [
          {
            thai: "อากาศชื้นมาก รู้สึกไม่สบาย",
            thaiMasculine: "อากาศชื้นมากครับ รู้สึกไม่สบาย",
            thaiFeminine: "อากาศชื้นมากค่ะ รู้สึกไม่สบาย",
            pronunciation: "aa-gaat chuen maak, ruu-seuk mai sa-baai",
            translation: "The weather is very humid, feeling uncomfortable."
          },
          {
            thai: "ในหน้าฝน อากาศชื้นตลอด",
            thaiMasculine: "ในหน้าฝน อากาศชื้นตลอดครับ",
            thaiFeminine: "ในหน้าฝน อากาศชื้นตลอดค่ะ",
            pronunciation: "nai naa fon, aa-gaat chuen ta-lot",
            translation: "During rainy season, the weather is always humid."
          }
        ]
      },
      {
        english: "Thunder and lightning",
        thai: "ฟ้าร้องฟ้าผ่า",
        thaiMasculine: "ฟ้าร้องฟ้าผ่าครับ",
        thaiFeminine: "ฟ้าร้องฟ้าผ่าค่ะ",
        pronunciation: "faa rong faa paa",
        mnemonic: "Think: 'Far wrong, far pass' - thunder wrong, lightning pass",
        examples: [
          {
            thai: "เมื่อคืนฟ้าร้องฟ้าผ่าดังมาก",
            thaiMasculine: "เมื่อคืนฟ้าร้องฟ้าผ่าดังมากครับ",
            thaiFeminine: "เมื่อคืนฟ้าร้องฟ้าผ่าดังมากค่ะ",
            pronunciation: "meua-khuen faa rong faa paa dang maak",
            translation: "Last night there was very loud thunder and lightning."
          },
          {
            thai: "เด็กๆ กลัวฟ้าร้องฟ้าผ่า",
            thaiMasculine: "เด็กๆ กลัวฟ้าร้องฟ้าผ่าครับ",
            thaiFeminine: "เด็กๆ กลัวฟ้าร้องฟ้าผ่าค่ะ",
            pronunciation: "dek-dek glua faa rong faa paa",
            translation: "Children are afraid of thunder and lightning."
          }
        ]
      },
      {
        english: "Cloudy with chance of rain",
        thai: "มีเมฆมาก ฝนอาจจะตก",
        thaiMasculine: "มีเมฆมาก ฝนอาจจะตกครับ",
        thaiFeminine: "มีเมฆมาก ฝนอาจจะตกค่ะ",
        pronunciation: "mee mek maak, fon aat ja tok",
        mnemonic: "Think: 'Me make mark, phone at jaw talk' - clouds mark rain talk",
        examples: [
          {
            thai: "วันนี้มีเมฆมาก ฝนอาจจะตกในช่วงบ่าย",
            thaiMasculine: "วันนี้มีเมฆมาก ฝนอาจจะตกในช่วงบ่ายครับ",
            thaiFeminine: "วันนี้มีเมฆมาก ฝนอาจจะตกในช่วงบ่ายค่ะ",
            pronunciation: "wan-nee mee mek maak, fon aat ja tok nai chuang baai",
            translation: "Today is very cloudy, it might rain in the afternoon."
          },
          {
            thai: "ท้องฟ้ามีเมฆมาก ควรพกร่มไว้",
            thaiMasculine: "ท้องฟ้ามีเมฆมาก ควรพกร่มไว้ครับ",
            thaiFeminine: "ท้องฟ้ามีเมฆมาก ควรพกร่มไว้ค่ะ",
            pronunciation: "tong-faa mee mek maak, khuan pok rom wai",
            translation: "The sky is very cloudy, should bring an umbrella."
          }
        ]
      },
      {
        english: "The sun is scorching hot",
        thai: "แดดร้อนจัด",
        thaiMasculine: "แดดร้อนจัดครับ",
        thaiFeminine: "แดดร้อนจัดค่ะ",
        pronunciation: "daet ron jat",
        mnemonic: "Think: 'Date ron chat' - date in hot sun chat",
        examples: [
          {
            thai: "แดดร้อนจัด ต้องใส่ครีมกันแดด",
            thaiMasculine: "แดดร้อนจัดครับ ต้องใส่ครีมกันแดด",
            thaiFeminine: "แดดร้อนจัดค่ะ ต้องใส่ครีมกันแดด",
            pronunciation: "daet ron jat, tong sai cream gan daet",
            translation: "The sun is scorching hot, need to apply sunscreen."
          },
          {
            thai: "อย่าออกไปข้างนอก แดดร้อนจัดเกินไป",
            thaiMasculine: "อย่าออกไปข้างนอกครับ แดดร้อนจัดเกินไป",
            thaiFeminine: "อย่าออกไปข้างนอกค่ะ แดดร้อนจัดเกินไป",
            pronunciation: "yaa ok pai khaang-nok, daet ron jat gern pai",
            translation: "Don't go outside, the sun is too scorching hot."
          }
        ]
      }
    ]
  },
  {
    id: 'time-expressions',
    name: 'Time Expressions',
    level: 'Advanced',
    description: 'Complex time-related phrases',
    phrases: [
      {
        english: "In the early morning",
        thai: "ในตอนเช้าตรู่",
        thaiMasculine: "ในตอนเช้าตรู่ครับ",
        thaiFeminine: "ในตอนเช้าตรู่ค่ะ",
        pronunciation: "nai ton chao truu",
        mnemonic: "Think: 'Night turn chow true' - night turns to morning true",
        examples: [
          {
            thai: "ในตอนเช้าตรู่ อากาศเย็นสบาย",
            thaiMasculine: "ในตอนเช้าตรู่ อากาศเย็นสบายครับ",
            thaiFeminine: "ในตอนเช้าตรู่ อากาศเย็นสบายค่ะ",
            pronunciation: "nai ton chao truu, aa-gaat yen sa-baai",
            translation: "In the early morning, the weather is cool and comfortable."
          },
          {
            thai: "ฉันชอบวิ่งในตอนเช้าตรู่",
            thaiMasculine: "ผมชอบวิ่งในตอนเช้าตรู่ครับ",
            thaiFeminine: "ฉันชอบวิ่งในตอนเช้าตรู่ค่ะ",
            pronunciation: "phom/chan chop wing nai ton chao truu",
            translation: "I like to run in the early morning."
          }
        ]
      },
      {
        english: "Every other day",
        thai: "วันเว้นวัน",
        thaiMasculine: "วันเว้นวันครับ",
        thaiFeminine: "วันเว้นวันค่ะ",
        pronunciation: "wan wen wan",
        mnemonic: "Think: 'One when one' - one day when another passes",
        examples: [
          {
            thai: "ฉันออกกำลังกายวันเว้นวัน",
            thaiMasculine: "ผมออกกำลังกายวันเว้นวันครับ",
            thaiFeminine: "ฉันออกกำลังกายวันเว้นวันค่ะ",
            pronunciation: "phom/chan ok gam-lang-gaai wan wen wan",
            translation: "I exercise every other day."
          },
          {
            thai: "กินยาวันเว้นวัน",
            thaiMasculine: "กินยาวันเว้นวันครับ",
            thaiFeminine: "กินยาวันเว้นวันค่ะ",
            pronunciation: "gin yaa wan wen wan",
            translation: "Take medicine every other day."
          }
        ]
      },
      {
        english: "Once in a while",
        thai: "นานๆ ครั้ง",
        thaiMasculine: "นานๆ ครั้งครับ",
        thaiFeminine: "นานๆ ครั้งค่ะ",
        pronunciation: "naan-naan khrang",
        mnemonic: "Think: 'Nan nan crown' - grandmother's crown worn rarely",
        examples: [
          {
            thai: "เราเจอกันนานๆ ครั้ง",
            thaiMasculine: "เราเจอกันนานๆ ครั้งครับ",
            thaiFeminine: "เราเจอกันนานๆ ครั้งค่ะ",
            pronunciation: "rao jer gan naan-naan khrang",
            translation: "We meet once in a while."
          },
          {
            thai: "นานๆ ครั้งจะกินอาหารฝรั่ง",
            thaiMasculine: "นานๆ ครั้งจะกินอาหารฝรั่งครับ",
            thaiFeminine: "นานๆ ครั้งจะกินอาหารฝรั่งค่ะ",
            pronunciation: "naan-naan khrang ja gin aa-haan fa-rang",
            translation: "Once in a while I eat Western food."
          }
        ]
      },
      {
        english: "As soon as possible",
        thai: "โดยเร็วที่สุด",
        thaiMasculine: "โดยเร็วที่สุดครับ",
        thaiFeminine: "โดยเร็วที่สุดค่ะ",
        pronunciation: "doi reo tee sut",
        mnemonic: "Think: 'Do it ray-o the suit' - do it quick in the suit",
        examples: [
          {
            thai: "กรุณาตอบกลับโดยเร็วที่สุด",
            thaiMasculine: "กรุณาตอบกลับโดยเร็วที่สุดครับ",
            thaiFeminine: "กรุณาตอบกลับโดยเร็วที่สุดค่ะ",
            pronunciation: "ga-ru-naa top glap doi reo tee sut",
            translation: "Please reply as soon as possible."
          },
          {
            thai: "ต้องการให้ซ่อมโดยเร็วที่สุด",
            thaiMasculine: "ต้องการให้ซ่อมโดยเร็วที่สุดครับ",
            thaiFeminine: "ต้องการให้ซ่อมโดยเร็วที่สุดค่ะ",
            pronunciation: "tong-gaan hai som doi reo tee sut",
            translation: "Need it repaired as soon as possible."
          }
        ]
      },
      {
        english: "Running late",
        thai: "มาสาย",
        thaiMasculine: "มาสายครับ",
        thaiFeminine: "มาสายค่ะ",
        pronunciation: "maa saai",
        mnemonic: "Think: 'Ma sigh' - mother sighs when you're late",
        examples: [
          {
            thai: "ขอโทษที่มาสาย รถติดมาก",
            thaiMasculine: "ขอโทษที่มาสายครับ รถติดมาก",
            thaiFeminine: "ขอโทษที่มาสายค่ะ รถติดมาก",
            pronunciation: "khor-tot tee maa saai, rot tit maak",
            translation: "Sorry for being late, traffic was heavy."
          },
          {
            thai: "อย่ามาสายนะ",
            thaiMasculine: "อย่ามาสายนะครับ",
            thaiFeminine: "อย่ามาสายนะคะ",
            pronunciation: "yaa maa saai na",
            translation: "Don't be late."
          }
        ]
      }
    ]
  },

  // Native/Fluent Set (1 set)
  {
    id: 'formal-business',
    name: 'Formal Business Thai',
    level: 'Native/Fluent',
    description: 'Professional and business language',
    phrases: [
      {
        english: "I would like to schedule a meeting",
        thai: "ข้าพเจ้าต้องการนัดหมายการประชุม",
        thaiMasculine: "กระผมต้องการนัดหมายการประชุมครับ",
        thaiFeminine: "ดิฉันต้องการนัดหมายการประชุมค่ะ",
        pronunciation: "kra-phom/di-chan tong-gaan nat-maai gaan pra-chum",
        mnemonic: "Business formality requires proper pronouns and structure",
        examples: [
          {
            thai: "กระผมต้องการนัดหมายการประชุมกับท่านผู้จัดการ",
            thaiMasculine: "กระผมต้องการนัดหมายการประชุมกับท่านผู้จัดการครับ",
            thaiFeminine: "ดิฉันต้องการนัดหมายการประชุมกับท่านผู้จัดการค่ะ",
            pronunciation: "kra-phom/di-chan tong-gaan nat-maai gaan pra-chum gap tan puu-jat-gaan",
            translation: "I would like to schedule a meeting with the manager."
          },
          {
            thai: "ท่านสะดวกให้เข้าพบเมื่อใด",
            thaiMasculine: "ท่านสะดวกให้เข้าพบเมื่อใดครับ",
            thaiFeminine: "ท่านสะดวกให้เข้าพบเมื่อใดคะ",
            pronunciation: "tan sa-duak hai khao phop meua dai",
            translation: "When would it be convenient for you to meet?"
          }
        ]
      },
      {
        english: "Thank you for your cooperation",
        thai: "ขอขอบคุณสำหรับความร่วมมือ",
        thaiMasculine: "ขอขอบคุณสำหรับความร่วมมือครับ",
        thaiFeminine: "ขอขอบคุณสำหรับความร่วมมือค่ะ",
        pronunciation: "khor khop-khun sam-rap khwaam ruam-mue",
        mnemonic: "Formal thanks emphasizes collaboration",
        examples: [
          {
            thai: "ขอขอบคุณสำหรับความร่วมมือของทุกท่านในโครงการนี้",
            thaiMasculine: "ขอขอบคุณสำหรับความร่วมมือของทุกท่านในโครงการนี้ครับ",
            thaiFeminine: "ขอขอบคุณสำหรับความร่วมมือของทุกท่านในโครงการนี้ค่ะ",
            pronunciation: "khor khop-khun sam-rap khwaam ruam-mue khong took tan nai khrong-gaan nee",
            translation: "Thank you for everyone's cooperation on this project."
          },
          {
            thai: "ความร่วมมือของท่านมีค่ายิ่ง",
            thaiMasculine: "ความร่วมมือของท่านมีค่ายิ่งครับ",
            thaiFeminine: "ความร่วมมือของท่านมีค่ายิ่งค่ะ",
            pronunciation: "khwaam ruam-mue khong tan mee khaa ying",
            translation: "Your cooperation is greatly valued."
          }
        ]
      },
      {
        english: "The quarterly report shows improvement",
        thai: "รายงานประจำไตรมาสแสดงให้เห็นถึงความก้าวหน้า",
        thaiMasculine: "รายงานประจำไตรมาสแสดงให้เห็นถึงความก้าวหน้าครับ",
        thaiFeminine: "รายงานประจำไตรมาสแสดงให้เห็นถึงความก้าวหน้าค่ะ",
        pronunciation: "raai-ngaan pra-jam trai-maat sa-daeng hai hen theung khwaam gaao-naa",
        mnemonic: "Formal reporting language for business contexts",
        examples: [
          {
            thai: "รายงานประจำไตรมาสแสดงให้เห็นถึงความก้าวหน้าในทุกภาคส่วน",
            thaiMasculine: "รายงานประจำไตรมาสแสดงให้เห็นถึงความก้าวหน้าในทุกภาคส่วนครับ",
            thaiFeminine: "รายงานประจำไตรมาสแสดงให้เห็นถึงความก้าวหน้าในทุกภาคส่วนค่ะ",
            pronunciation: "raai-ngaan pra-jam trai-maat sa-daeng hai hen theung khwaam gaao-naa nai took paak suan",
            translation: "The quarterly report shows improvement in all sectors."
          },
          {
            thai: "ผลประกอบการดีขึ้นอย่างมีนัยสำคัญ",
            thaiMasculine: "ผลประกอบการดีขึ้นอย่างมีนัยสำคัญครับ",
            thaiFeminine: "ผลประกอบการดีขึ้นอย่างมีนัยสำคัญค่ะ",
            pronunciation: "phon pra-gop gaan dee kheun yaang mee nai sam-khan",
            translation: "Performance has improved significantly."
          }
        ]
      },
      {
        english: "Please submit the proposal by the deadline",
        thai: "กรุณาส่งข้อเสนอภายในกำหนดเวลา",
        thaiMasculine: "กรุณาส่งข้อเสนอภายในกำหนดเวลาครับ",
        thaiFeminine: "กรุณาส่งข้อเสนอภายในกำหนดเวลาค่ะ",
        pronunciation: "ga-ru-naa song khor sa-ner paai-nai gam-not we-laa",
        mnemonic: "Professional request with deadline emphasis",
        examples: [
          {
            thai: "กรุณาส่งข้อเสนอภายในกำหนดเวลาเพื่อการพิจารณา",
            thaiMasculine: "กรุณาส่งข้อเสนอภายในกำหนดเวลาเพื่อการพิจารณาครับ",
            thaiFeminine: "กรุณาส่งข้อเสนอภายในกำหนดเวลาเพื่อการพิจารณาค่ะ",
            pronunciation: "ga-ru-naa song khor sa-ner paai-nai gam-not we-laa pheua gaan pi-jaa-ra-naa",
            translation: "Please submit the proposal by the deadline for consideration."
          },
          {
            thai: "เอกสารทั้งหมดต้องครบถ้วนสมบูรณ์",
            thaiMasculine: "เอกสารทั้งหมดต้องครบถ้วนสมบูรณ์ครับ",
            thaiFeminine: "เอกสารทั้งหมดต้องครบถ้วนสมบูรณ์ค่ะ",
            pronunciation: "ek-ga-saan tang-mot tong khrop-thuan som-buun",
            translation: "All documents must be complete."
          }
        ]
      },
      {
        english: "The investment shows promising returns",
        thai: "การลงทุนแสดงผลตอบแทนที่น่าพอใจ",
        thaiMasculine: "การลงทุนแสดงผลตอบแทนที่น่าพอใจครับ",
        thaiFeminine: "การลงทุนแสดงผลตอบแทนที่น่าพอใจค่ะ",
        pronunciation: "gaan long-tun sa-daeng phon top-taen tee naa por-jai",
        mnemonic: "Financial terminology for professional contexts",
        examples: [
          {
            thai: "การลงทุนในไตรมาสนี้แสดงผลตอบแทนที่น่าพอใจเป็นอย่างยิ่ง",
            thaiMasculine: "การลงทุนในไตรมาสนี้แสดงผลตอบแทนที่น่าพอใจเป็นอย่างยิ่งครับ",
            thaiFeminine: "การลงทุนในไตรมาสนี้แสดงผลตอบแทนที่น่าพอใจเป็นอย่างยิ่งค่ะ",
            pronunciation: "gaan long-tun nai trai-maat nee sa-daeng phon top-taen tee naa por-jai pen yaang ying",
            translation: "This quarter's investment shows highly satisfactory returns."
          },
          {
            thai: "อัตราผลตอบแทนสูงกว่าที่คาดการณ์ไว้",
            thaiMasculine: "อัตราผลตอบแทนสูงกว่าที่คาดการณ์ไว้ครับ",
            thaiFeminine: "อัตราผลตอบแทนสูงกว่าที่คาดการณ์ไว้ค่ะ",
            pronunciation: "at-traa phon top-taen suung gwaa tee khaat-gaan wai",
            translation: "The return rate is higher than projected."
          }
        ]
      }
    ]
  },

  // God Mode Set (1 set)
  {
    id: 'thai-proverbs',
    name: 'Thai Proverbs & Idioms',
    level: 'God Mode',
    description: 'Advanced Thai proverbs and cultural expressions',
    phrases: [
      {
        english: "Don't count your chickens before they hatch (Thai equivalent)",
        thai: "อย่าวางใจไก่ก่อนฟักออกจากไข่",
        thaiMasculine: "อย่าวางใจไก่ก่อนฟักออกจากไข่ครับ",
        thaiFeminine: "อย่าวางใจไก่ก่อนฟักออกจากไข่ค่ะ",
        pronunciation: "yaa waang jai gai gon fak ok jaak khai",
        mnemonic: "Literally: Don't trust the chicken before it hatches from the egg",
        examples: [
          {
            thai: "เขาเริ่มใช้เงินก่อนได้โบนัส อย่าวางใจไก่ก่อนฟักออกจากไข่",
            thaiMasculine: "เขาเริ่มใช้เงินก่อนได้โบนัสครับ อย่าวางใจไก่ก่อนฟักออกจากไข่",
            thaiFeminine: "เขาเริ่มใช้เงินก่อนได้โบนัสค่ะ อย่าวางใจไก่ก่อนฟักออกจากไข่",
            pronunciation: "khao rerm chai ngern gon dai bonus, yaa waang jai gai gon fak ok jaak khai",
            translation: "He started spending money before getting the bonus, don't count your chickens before they hatch."
          },
          {
            thai: "การวางแผนล่วงหน้าดี แต่อย่าวางใจไก่ก่อนฟักออกจากไข่",
            thaiMasculine: "การวางแผนล่วงหน้าดีครับ แต่อย่าวางใจไก่ก่อนฟักออกจากไข่",
            thaiFeminine: "การวางแผนล่วงหน้าดีค่ะ แต่อย่าวางใจไก่ก่อนฟักออกจากไข่",
            pronunciation: "gaan waang paen luang-naa dee, tae yaa waang jai gai gon fak ok jaak khai",
            translation: "Planning ahead is good, but don't count your chickens before they hatch."
          }
        ]
      },
      {
        english: "Water flows, fish swim (go with the flow)",
        thai: "น้ำไหลไฟดับ",
        thaiMasculine: "น้ำไหลไฟดับครับ",
        thaiFeminine: "น้ำไหลไฟดับค่ะ",
        pronunciation: "nam lai fai dap",
        mnemonic: "Water extinguishes fire - natural order prevails",
        examples: [
          {
            thai: "ไม่ต้องเครียด ปล่อยให้เป็นไปตามน้ำไหลไฟดับ",
            thaiMasculine: "ไม่ต้องเครียดครับ ปล่อยให้เป็นไปตามน้ำไหลไฟดับ",
            thaiFeminine: "ไม่ต้องเครียดค่ะ ปล่อยให้เป็นไปตามน้ำไหลไฟดับ",
            pronunciation: "mai tong khriat, ploy hai pen pai taam nam lai fai dap",
            translation: "Don't stress, let things flow naturally."
          },
          {
            thai: "บางครั้งต้องยอมรับความจริงแบบน้ำไหลไฟดับ",
            thaiMasculine: "บางครั้งต้องยอมรับความจริงแบบน้ำไหลไฟดับครับ",
            thaiFeminine: "บางครั้งต้องยอมรับความจริงแบบน้ำไหลไฟดับค่ะ",
            pronunciation: "baang khrang tong yom rap khwaam jing baep nam lai fai dap",
            translation: "Sometimes you must accept reality and go with the flow."
          }
        ]
      },
      {
        english: "The dog that barks doesn't bite",
        thai: "สุนัขขี้เห่าไม่กัด",
        thaiMasculine: "สุนัขขี้เห่าไม่กัดครับ",
        thaiFeminine: "สุนัขขี้เห่าไม่กัดค่ะ",
        pronunciation: "su-nak khee hao mai gat",
        mnemonic: "Those who threaten loudly rarely take action",
        examples: [
          {
            thai: "เขาพูดแต่ปากแต่ไม่ทำอะไร สุนัขขี้เห่าไม่กัด",
            thaiMasculine: "เขาพูดแต่ปากแต่ไม่ทำอะไรครับ สุนัขขี้เห่าไม่กัด",
            thaiFeminine: "เขาพูดแต่ปากแต่ไม่ทำอะไรค่ะ สุนัขขี้เห่าไม่กัด",
            pronunciation: "khao phuut tae paak tae mai tam a-rai, su-nak khee hao mai gat",
            translation: "He's all talk but no action, the dog that barks doesn't bite."
          },
          {
            thai: "อย่ากลัวคำขู่ของเขา สุนัขขี้เห่าไม่กัดหรอก",
            thaiMasculine: "อย่ากลัวคำขู่ของเขาครับ สุนัขขี้เห่าไม่กัดหรอก",
            thaiFeminine: "อย่ากลัวคำขู่ของเขาค่ะ สุนัขขี้เห่าไม่กัดหรอก",
            pronunciation: "yaa glua kham khuu khong khao, su-nak khee hao mai gat rok",
            translation: "Don't fear his threats, the barking dog doesn't bite."
          }
        ]
      },
      {
        english: "Riding an elephant to catch a grasshopper (overkill)",
        thai: "ขี่ช้างจับตั๊กแตน",
        thaiMasculine: "ขี่ช้างจับตั๊กแตนครับ",
        thaiFeminine: "ขี่ช้างจับตั๊กแตนค่ะ",
        pronunciation: "khee chaang jap tak-ga-taen",
        mnemonic: "Using excessive force for a simple task",
        examples: [
          {
            thai: "ใช้ทีมทั้งหมดทำงานเล็กๆ นี่มันขี่ช้างจับตั๊กแตน",
            thaiMasculine: "ใช้ทีมทั้งหมดทำงานเล็กๆ นี่มันขี่ช้างจับตั๊กแตนครับ",
            thaiFeminine: "ใช้ทีมทั้งหมดทำงานเล็กๆ นี่มันขี่ช้างจับตั๊กแตนค่ะ",
            pronunciation: "chai team tang-mot tam ngaan lek-lek, nee man khee chaang jap tak-ga-taen",
            translation: "Using the whole team for this small task is overkill."
          },
          {
            thai: "ซื้อรถใหม่เพื่อขับไปร้านข้างบ้าน ขี่ช้างจับตั๊กแตนไปหน่อย",
            thaiMasculine: "ซื้อรถใหม่เพื่อขับไปร้านข้างบ้าน ขี่ช้างจับตั๊กแตนไปหน่อยครับ",
            thaiFeminine: "ซื้อรถใหม่เพื่อขับไปร้านข้างบ้าน ขี่ช้างจับตั๊กแตนไปหน่อยค่ะ",
            pronunciation: "sue rot mai pheua khap pai raan khaang baan, khee chaang jap tak-ga-taen pai noy",
            translation: "Buying a new car just to drive to the neighborhood store is a bit overkill."
          }
        ]
      },
      {
        english: "Teaching a crocodile to swim (teaching grandmother to suck eggs)",
        thai: "สอนจระเข้ให้ว่ายน้ำ",
        thaiMasculine: "สอนจระเข้ให้ว่ายน้ำครับ",
        thaiFeminine: "สอนจระเข้ให้ว่ายน้ำค่ะ",
        pronunciation: "sorn jo-ra-khay hai waai nam",
        mnemonic: "Teaching someone something they already know better than you",
        examples: [
          {
            thai: "เขาเป็นเชฟมา 20 ปี คุณจะไปสอนทำอาหาร นั่นมันสอนจระเข้ให้ว่ายน้ำ",
            thaiMasculine: "เขาเป็นเชฟมา 20 ปีครับ คุณจะไปสอนทำอาหาร นั่นมันสอนจระเข้ให้ว่ายน้ำ",
            thaiFeminine: "เขาเป็นเชฟมา 20 ปีค่ะ คุณจะไปสอนทำอาหาร นั่นมันสอนจระเข้ให้ว่ายน้ำ",
            pronunciation: "khao pen chef maa yee-sip pee, khun ja pai sorn tam aa-haan, nan man sorn jo-ra-khay hai waai nam",
            translation: "He's been a chef for 20 years, you teaching him to cook is like teaching a crocodile to swim."
          },
          {
            thai: "อย่าไปสอนผู้เชี่ยวชาญ เป็นการสอนจระเข้ให้ว่ายน้ำ",
            thaiMasculine: "อย่าไปสอนผู้เชี่ยวชาญครับ เป็นการสอนจระเข้ให้ว่ายน้ำ",
            thaiFeminine: "อย่าไปสอนผู้เชี่ยวชาญค่ะ เป็นการสอนจระเข้ให้ว่ายน้ำ",
            pronunciation: "yaa pai sorn puu chiao-chaan, pen gaan sorn jo-ra-khay hai waai nam",
            translation: "Don't teach the expert, it's like teaching a crocodile to swim."
          }
        ]
      }
    ]
  }
]; 