interface Word {
  word: string;
  syllables: number;
}

function shuffle(arr: Word[]) {
  return arr.sort(() => 0.5 - Math.random())
}

export function pickWords (words) {
  let arr = [];
  arr.push(...words.constants);
  arr.push(...shuffle(words.adverbs).slice(0, 5));
  arr.push(...shuffle(words.adjectives).slice(0, 15));
  arr.push(...shuffle(words.prepositions).slice(0, 10));
  arr.push(...shuffle(words.pronouns).slice(0, 10));
  arr.push(...shuffle(words.verbs).slice(0, 15));
  arr.push(...shuffle(words.nouns).slice(0, 15));
  arr.sort((a, b) => {
    return a.word > b.word ? 1 : -1;
  });
  arr.push(...words.suffixes);

  return arr;
}
