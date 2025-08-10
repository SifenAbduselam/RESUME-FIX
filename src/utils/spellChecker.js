// Simple fake spell checker - returns list of "misspelled" words
export function spellCheck(text) {
  // Example: Just check for some common typos, really basic
  const commonTypos = ["teh", "recieve", "adress", "langauge"];
  const foundTypos = [];

  commonTypos.forEach((word) => {
    if (text.toLowerCase().includes(word)) {
      foundTypos.push(word);
    }
  });

  return foundTypos;
}
