import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCity } from '../src/render.mjs';

const year = (count) => ({
  totalContributions: count * 53 * 7,
  weeks: Array.from({ length: 53 }, () => ({ contributionDays: Array.from({ length: 7 }, (_, d) => ({ contributionCount: count, weekday: d })) })),
});

test('builds one self-contained SVG', () => {
  const svg = renderCity(year(2), { login: 'octocat', date: new Date(2026, 10, 26) });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/);
  assert.match(svg, /@octocat · 742 contributions in the last year/);
  assert.doesNotMatch(svg, /<script|href="http/); // nothing that a README image would refuse to load
});

test('a year with no contributions still draws a quiet city', () => {
  const svg = renderCity(year(0), { login: 'new' });
  assert.match(svg, /0 contributions/);
  assert.match(svg, /id="city"/);
  assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
});

test('busier years build taller buildings, never past the sky', () => {
  const tops = (svg) => [...svg.matchAll(/<rect x="\d+" y="(-?\d+)" width="7"/g)].map((m) => Number(m[1]));
  const quiet = Math.min(...tops(renderCity(year(0))));
  const busy = Math.min(...tops(renderCity(year(9))));
  assert.ok(busy < quiet);
  assert.ok(busy > 0);
});

test('the same data on the same night gives the same picture', () => {
  const night = new Date(2026, 0, 1);
  assert.equal(renderCity(year(3), { date: night }), renderCity(year(3), { date: night }));
});

test('escapes the login in the caption', () => {
  const svg = renderCity(year(1), { login: 'a<b>&"c' });
  assert.doesNotMatch(svg, /a<b>/);
});
