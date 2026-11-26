// The GitHub Action: fetch the user's contribution calendar, build the city, write the SVG(s).
// No dependencies: inputs come in as INPUT_* environment variables, Node's own fetch talks to GitHub.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { renderCity } from '../src/render.mjs';

const input = (name) => (process.env[`INPUT_${name.toUpperCase()}`] || '').trim();
const fail = (msg) => {
  console.log(`::error::${msg}`);
  process.exit(1);
};

const login = input('github_user_name');
const token = input('github_token');
const outputs = input('outputs')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);
if (!login) fail('github_user_name is required');
if (!token) fail('github_token is required (the default ${{ github.token }} is fine)');
if (!outputs.length) outputs.push('dist/city.svg');
const theme = input('theme') || 'auto';
if (!['auto', 'night', 'snow', 'newyear'].includes(theme)) fail(`theme must be auto, night, snow or newyear (got "${theme}")`);

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date weekday } }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'commit-city' },
  body: JSON.stringify({ query, variables: { login } }),
});
if (!res.ok) fail(`GitHub API answered ${res.status} ${res.statusText}`);
const json = await res.json();
if (json.errors?.length) fail(json.errors.map((e) => e.message).join('; '));
const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar) fail(`No contribution calendar for "${login}"`);

const svg = renderCity(calendar, { login, theme });
for (const path of outputs) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, svg);
  console.log(`Built ${path} (${(svg.length / 1024).toFixed(1)} KB) from ${calendar.totalContributions} contributions`);
}
