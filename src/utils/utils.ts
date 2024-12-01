function shuffle(arr) {
  return arr.sort(() => 0.5 - Math.random())
}

export function pickWords (words) {
  let arr = [];
  arr.push(...words.always);
  arr.push(...shuffle(words.adjectives).slice(0, 15));
  arr.push(...shuffle(words.prepositions).slice(0, 10));
  arr.push(...shuffle(words.pronouns).slice(0, 10));
  arr.push(...shuffle(words.verbs).slice(0, 15));
  arr.push(...shuffle(words.nouns).slice(0, 15));
  arr.sort();

  return arr;
}
