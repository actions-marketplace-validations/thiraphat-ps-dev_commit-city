// Build a city from a saved contribution calendar.
// usage: node scripts/build.mjs <data.json> <out.svg> [login]
// (data.json is the GitHub GraphQL response for user.contributionsCollection.contributionCalendar)
import { readFileSync, writeFileSync } from 'node:fs';
import { renderCity } from '../src/render.mjs';

const [input = 'out/data.json', output = 'out/city.svg', login = ''] = process.argv.slice(2);
const json = JSON.parse(readFileSync(input, 'utf8'));
const calendar = json.data?.user?.contributionsCollection?.contributionCalendar ?? json;
const svg = renderCity(calendar, { login });
writeFileSync(output, svg);
console.log(`${output}: ${(svg.length / 1024).toFixed(1)} KB`);
