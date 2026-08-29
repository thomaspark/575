export interface Word {
  word: string;
  syllables: number;
}

export interface WordList {
  constants: Word[];
  adverbs: Word[];
  adjectives: Word[];
  prepositions: Word[];
  pronouns: Word[];
  verbs: Word[];
  nouns: Word[];
  longs: Word[];
  suffixes: Word[];
}

/**
 * Draw n words uniformly at random. Uses a partial Fisher-Yates shuffle over a
 * copy, so the source list is left untouched and only n swaps are performed.
 */
function sample(arr: Word[], n: number): Word[] {
  const pool = arr.slice();
  const count = Math.min(n, pool.length);

  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

export function pickWords (words: WordList): Word[] {
  const arr: Word[] = [];
  const seen = new Set<string>();

  // Categories overlap heavily (776 words are in both nouns and longs), so a
  // word already drawn is withheld from later draws to keep the board unique.
  const take = (pool: Word[], n: number) => {
    for (const word of sample(pool.filter((w) => !seen.has(w.word)), n)) {
      seen.add(word.word);
      arr.push(word);
    }
  };

  take(words.constants, words.constants.length);
  take(words.adverbs, 5);
  take(words.adjectives, 15);
  take(words.prepositions, 10);
  take(words.pronouns, 10);
  take(words.verbs, 15);
  take(words.nouns, 15);
  take(words.longs, 5);

  arr.sort((a, b) => a.word.localeCompare(b.word));
  arr.push(...words.suffixes);

  return arr;
}
