// Thai Language Facts Database
export interface ThaiFact {
  id: string;
  fact: string;
  category: 'grammar' | 'culture' | 'writing' | 'pronunciation' | 'history' | 'fun';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const thaiFactsDatabase: ThaiFact[] = [
  // Grammar Facts
  {
    id: 'grammar-001',
    fact: 'Thai has no verb conjugations - the same verb form is used regardless of tense, person, or number.',
    category: 'grammar',
    difficulty: 'beginner'
  },
  {
    id: 'grammar-002',
    fact: 'Thai uses particles like "แล้ว" (láew) and "จะ" (jà) to indicate past and future tenses instead of changing the verb.',
    category: 'grammar',
    difficulty: 'intermediate'
  },
  {
    id: 'grammar-003',
    fact: 'Thai has no plural forms - "หนังสือ" (nǎng-sǔu) means both "book" and "books".',
    category: 'grammar',
    difficulty: 'beginner'
  },
  {
    id: 'grammar-004',
    fact: 'Thai adjectives come after nouns, so "red car" is "รถแดง" (rót daeng) - literally "car red".',
    category: 'grammar',
    difficulty: 'beginner'
  },
  {
    id: 'grammar-005',
    fact: 'Thai has 20+ different classifier words (ลักษณนาม) used when counting objects, like "คน" for people and "ตัว" for animals.',
    category: 'grammar',
    difficulty: 'intermediate'
  },

  // Writing System Facts
  {
    id: 'writing-001',
    fact: 'Thai script has 44 consonants, 15 vowel symbols, and 4 tone marks, but only 21 consonant sounds and 18 vowel sounds.',
    category: 'writing',
    difficulty: 'intermediate'
  },
  {
    id: 'writing-002',
    fact: 'Thai is written left-to-right with no spaces between words - readers must recognize where words begin and end.',
    category: 'writing',
    difficulty: 'beginner'
  },
  {
    id: 'writing-003',
    fact: 'Some Thai vowels are written before, after, above, or below the consonant they modify.',
    category: 'writing',
    difficulty: 'intermediate'
  },
  {
    id: 'writing-004',
    fact: 'The Thai script was adapted from the Khmer script around 1283 CE by King Ramkhamhaeng.',
    category: 'writing',
    difficulty: 'advanced'
  },
  {
    id: 'writing-005',
    fact: 'Thai consonants are divided into three classes (high, mid, low) which affect tone pronunciation.',
    category: 'writing',
    difficulty: 'advanced'
  },

  // Pronunciation Facts
  {
    id: 'pronunciation-001',
    fact: 'Thai has 5 tones: mid, low, falling, high, and rising. Changing the tone changes the meaning completely.',
    category: 'pronunciation',
    difficulty: 'beginner'
  },
  {
    id: 'pronunciation-002',
    fact: 'The word "mai" can mean "new", "wood", "burn", "not", or "silk" depending on the tone used.',
    category: 'pronunciation',
    difficulty: 'intermediate'
  },
  {
    id: 'pronunciation-003',
    fact: 'Thai has sounds that don\'t exist in English, like the unaspirated "p", "t", "k" sounds.',
    category: 'pronunciation',
    difficulty: 'intermediate'
  },
  {
    id: 'pronunciation-004',
    fact: 'The "r" sound in Thai is often pronounced as "l" in casual speech, especially in Bangkok.',
    category: 'pronunciation',
    difficulty: 'intermediate'
  },
  {
    id: 'pronunciation-005',
    fact: 'Thai has long and short vowels that change word meanings - "khao" (rice) vs "khaao" (white).',
    category: 'pronunciation',
    difficulty: 'intermediate'
  },

  // Cultural Facts
  {
    id: 'culture-001',
    fact: 'Thai has different pronouns and verb forms based on social hierarchy and politeness levels.',
    category: 'culture',
    difficulty: 'intermediate'
  },
  {
    id: 'culture-002',
    fact: 'The polite particles "ครับ" (kráp) for men and "ค่ะ" (kâ) for women are added to most sentences.',
    category: 'culture',
    difficulty: 'beginner'
  },
  {
    id: 'culture-003',
    fact: 'Thai has special "royal language" (ราชาศัพท์) used when speaking about or to royalty.',
    category: 'culture',
    difficulty: 'advanced'
  },
  {
    id: 'culture-004',
    fact: 'Calling someone by their first name without a title is considered rude - use "คุณ" (khun) or other titles.',
    category: 'culture',
    difficulty: 'beginner'
  },
  {
    id: 'culture-005',
    fact: 'Thai people often use nicknames in daily life, even in professional settings.',
    category: 'culture',
    difficulty: 'beginner'
  },

  // History Facts
  {
    id: 'history-001',
    fact: 'Thai belongs to the Tai-Kadai language family and is related to Lao, Shan, and Zhuang languages.',
    category: 'history',
    difficulty: 'advanced'
  },
  {
    id: 'history-002',
    fact: 'Modern Thai evolved from Old Thai, which was heavily influenced by Sanskrit and Pali from Buddhism.',
    category: 'history',
    difficulty: 'advanced'
  },
  {
    id: 'history-003',
    fact: 'Many Thai words for abstract concepts come from Sanskrit, while everyday words are native Thai.',
    category: 'history',
    difficulty: 'intermediate'
  },
  {
    id: 'history-004',
    fact: 'The Thai language has borrowed words from Chinese, English, Portuguese, and other languages over time.',
    category: 'history',
    difficulty: 'intermediate'
  },
  {
    id: 'history-005',
    fact: 'Standard Thai is based on the Central Thai dialect spoken in and around Bangkok.',
    category: 'history',
    difficulty: 'intermediate'
  },

  // Fun Facts
  {
    id: 'fun-001',
    fact: 'The longest Thai word is "กรุงเทพมหานครอมรรัตนโกสินทร์มหินทรายุธยามหาดิลกภพนพรัตนราชธานีบุรีรมย์อุดมราชนิเวศน์มหาสถานอมรพิมานอวตารสถิตสักกะทัตติยวิษณุกรรมประสิทธิ์" - the full ceremonial name of Bangkok!',
    category: 'fun',
    difficulty: 'advanced'
  },
  {
    id: 'fun-002',
    fact: 'Thai has a special way to count using fingers - they use the thumb to count segments on the other four fingers.',
    category: 'fun',
    difficulty: 'beginner'
  },
  {
    id: 'fun-003',
    fact: 'The phrase "jai yen yen" (cool heart) means to stay calm and is a core concept in Thai culture.',
    category: 'fun',
    difficulty: 'beginner'
  },
  {
    id: 'fun-004',
    fact: 'Thai has many onomatopoeia words like "กบ กบ" (gòp gòp) for frog sounds and "หวู หวู" (wǔu wǔu) for wind.',
    category: 'fun',
    difficulty: 'intermediate'
  },
  {
    id: 'fun-005',
    fact: 'The Thai word "สนุก" (sà-nùk) means fun, but it\'s also a philosophy - life should be enjoyable!',
    category: 'fun',
    difficulty: 'beginner'
  },
  {
    id: 'fun-006',
    fact: 'Thai has reduplication for emphasis: "เร็วเร็ว" (rew rew) means "quickly quickly" = very quickly.',
    category: 'fun',
    difficulty: 'intermediate'
  },
  {
    id: 'fun-007',
    fact: 'The Thai greeting "สวัสดี" (sà-wàt-dii) comes from Sanskrit and literally means "well-being".',
    category: 'fun',
    difficulty: 'intermediate'
  },
  {
    id: 'fun-008',
    fact: 'Thai has special words for different types of smiles: "ยิ้ม" (yím) is a regular smile, "หัวเราะ" (hǔa-róh) is laughter.',
    category: 'fun',
    difficulty: 'intermediate'
  },
  {
    id: 'fun-009',
    fact: 'The number 9 is considered very lucky in Thai because "เก้า" (gâo) sounds like "ก้าว" (gâao) meaning "to progress".',
    category: 'fun',
    difficulty: 'beginner'
  },
  {
    id: 'fun-010',
    fact: 'Thai has a special particle "นะ" (ná) that makes any sentence sound friendlier and more polite.',
    category: 'fun',
    difficulty: 'beginner'
  }
];

export function getRandomThaiFact(): ThaiFact {
  const randomIndex = Math.floor(Math.random() * thaiFactsDatabase.length);
  return thaiFactsDatabase[randomIndex];
}

export function getThaiFactsByCategory(category: ThaiFact['category']): ThaiFact[] {
  return thaiFactsDatabase.filter(fact => fact.category === category);
}

export function getThaiFactsByDifficulty(difficulty: ThaiFact['difficulty']): ThaiFact[] {
  return thaiFactsDatabase.filter(fact => fact.difficulty === difficulty);
}

export function getRandomThaiFactByCategory(category: ThaiFact['category']): ThaiFact | null {
  const facts = getThaiFactsByCategory(category);
  if (facts.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * facts.length);
  return facts[randomIndex];
}
