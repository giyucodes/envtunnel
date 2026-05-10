const WORDS = [
  "alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel",
  "india","juliet","kilo","lima","mike","november","oscar","papa",
  "quebec","romeo","sierra","tango","uniform","victor","whiskey","xray",
  "yankee","zulu","amber","blaze","cipher","drift","ember","frost",
  "glitch","haze","iris","jade","karma","lunar","mango","nexus",
  "orbit","prism","quark","raven","solar","titan","ultra","vapor",
  "warp","xenon","yield","zenith","anchor","bridge","cobalt","dagger",
  "eagle","falcon","ghost","hunter","iron","jungle","knight","laser",
  "metro","nova","onyx","pixel","quasar","relay","spark","torch",
  "umbra","vortex","wolf","xtreme","yonder","zinc","arcade","burst",
  "cloud","dense","epoch","flare","grove","helix","input","jetstream",
];

export function generatePassphrase(wordCount = 4): string {
  const picked: string[] = [];
  const arr = new Uint32Array(wordCount);
  crypto.getRandomValues(arr);
  for (let i = 0; i < wordCount; i++) {
    picked.push(WORDS[arr[i] % WORDS.length]);
  }
  // Add a random 2-digit number at the end for extra entropy
  const num = new Uint8Array(1);
  crypto.getRandomValues(num);
  picked.push(String(10 + (num[0] % 90)));
  return picked.join("-");
}
