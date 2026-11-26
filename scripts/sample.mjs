// Make a made-up contribution calendar, to see how a quieter year looks.
// usage: node scripts/sample.mjs <out.json> <rough total> [seed]
import { writeFileSync } from 'node:fs';
const [out, total = '150', seed = '7'] = process.argv.slice(2);
let s = Number(seed);
const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
const weeks = [];
let sum = 0;
const busy = Number(total) / 365;
for (let w = 0; w < 53; w++) {
  const season = 0.4 + Math.sin(w / 8) ** 2; // some stretches busier than others
  const days = Array.from({ length: 7 }, (_, d) => {
    const n = rnd() < Math.min(0.9, busy * season * (d > 0 && d < 6 ? 1.2 : 0.5)) ? 1 + Math.floor(rnd() * 4) : 0;
    sum += n;
    return { contributionCount: n, weekday: d };
  });
  weeks.push({ contributionDays: days });
}
writeFileSync(out, JSON.stringify({ totalContributions: sum, weeks }));
console.log(out, sum);
