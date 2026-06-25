#!/usr/bin/env node
// Date Format Helper — anchor logic tests
// Verifies that generateForLevel produces coherent date/time inside
// the expected range for each level, across many random runs.

const { generateForLevel, nowSnapped, snapToTenMin, computeDayOffset } = require('../src/compose.js');

const NOW = new Date(2026, 4, 27, 21, 34, 17); // Wed 27 May 2026, 21:34:17

const TV_MINUTES = new Set([0, 10, 20, 30, 40, 50]);

function dayDiff(a, b) {
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aMid - bMid) / 86400000);
}

const cases = [
  {
    name: 'past_other_years',
    level: 'past_other_years',
    iterations: 200,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff > -366) return 'expected diff < -365, got ' + diff;
      if (diff < -365 * 3) return 'expected diff > -' + (365 * 3) + ', got ' + diff;
      if (result.timeStart) {
        const [h, m] = result.timeStart.split(':').map(Number);
        if (!TV_MINUTES.has(m)) return 'minute not on 10-min slot: ' + result.timeStart;
        if (h < 6 || h > 23) return 'hour out of TV window: ' + h;
      }
      return null;
    },
  },
  {
    name: 'past_same_year',
    level: 'past_same_year',
    iterations: 200,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff > -8) return 'expected diff <= -8, got ' + diff;
      if (d.getFullYear() !== now.getFullYear()) return 'expected same year, got ' + d.getFullYear() + ' vs ' + now.getFullYear();
      return null;
    },
  },
  {
    name: 'past_near',
    level: 'past_near',
    iterations: 200,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff < -7 || diff > -2) return 'expected diff in [-7, -2], got ' + diff;
      const [h, m] = result.timeStart.split(':').map(Number);
      if (!TV_MINUTES.has(m)) return 'minute not on 10-min slot: ' + result.timeStart;
      if (h < 6 || h > 23) return 'hour out of TV window: ' + h;
      return null;
    },
  },
  {
    name: 'past_immediate',
    level: 'past_immediate',
    iterations: 100,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff !== -1) return 'expected diff = -1 (yesterday), got ' + diff;
      const [, m] = result.timeStart.split(':').map(Number);
      if (!TV_MINUTES.has(m)) return 'minute not on 10-min slot: ' + result.timeStart;
      return null;
    },
  },
  {
    name: 'live',
    level: 'live',
    iterations: 50,
    check(result, now) {
      if (!result.timeEnd) return 'live should have timeEnd';
      const start = result.timeStart.split(':').map(Number);
      const end = result.timeEnd.split(':').map(Number);
      if (!TV_MINUTES.has(start[1])) return 'start minute not on 10-min slot: ' + result.timeStart;
      if (!TV_MINUTES.has(end[1])) return 'end minute not on 10-min slot: ' + result.timeEnd;
      const d = new Date(result.referenceDate + 'T12:00:00');
      if (dayDiff(d, now) !== 0) return 'live referenceDate should be today';
      return null;
    },
  },
  {
    name: 'future_immediate',
    level: 'future_immediate',
    iterations: 100,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff !== 1) return 'expected diff = 1 (tomorrow), got ' + diff;
      return null;
    },
  },
  {
    name: 'future_near',
    level: 'future_near',
    iterations: 200,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff < 2 || diff > 7) return 'expected diff in [2, 7], got ' + diff;
      return null;
    },
  },
  {
    name: 'future_far',
    level: 'future_far',
    iterations: 200,
    check(result, now) {
      const d = new Date(result.referenceDate + 'T12:00:00');
      const diff = dayDiff(d, now);
      if (diff < 8) return 'expected diff >= 8, got ' + diff;
      if (d.getFullYear() !== now.getFullYear()) return 'expected same year, got ' + d.getFullYear() + ' vs ' + now.getFullYear();
      return null;
    },
  },
];

function testRandomnessSpread(level, n) {
  // Verify multiple calls produce different results when the level allows variability
  const dates = new Set();
  const times = new Set();
  for (let i = 0; i < n; i++) {
    const r = generateForLevel(level, NOW);
    dates.add(r.referenceDate);
    times.add(r.timeStart);
  }
  return { dates: dates.size, times: times.size };
}

function testSnapToTenMin() {
  const cases = [
    [new Date(2026, 4, 27, 21, 34, 17), '21:30'],
    [new Date(2026, 4, 27, 21, 36, 0),  '21:40'],
    [new Date(2026, 4, 27, 21, 55, 0),  '22:00'],
    [new Date(2026, 4, 27, 21, 5, 0),   '21:10'],
    [new Date(2026, 4, 27, 21, 4, 0),   '21:00'],
    [new Date(2026, 4, 27, 21, 0, 0),   '21:00'],
  ];
  for (const [input, expected] of cases) {
    const snapped = snapToTenMin(input);
    const actual = String(snapped.getHours()).padStart(2, '0') + ':' + String(snapped.getMinutes()).padStart(2, '0');
    if (actual !== expected) return 'snapToTenMin(' + input.toISOString() + ') = ' + actual + ', expected ' + expected;
  }
  return null;
}

console.log('');
console.log('Date Format Helper — Anchor Tests');
console.log('==================================');

let totalChecks = 0;
let failures = [];

// Test snapToTenMin first
const snapResult = testSnapToTenMin();
totalChecks++;
if (snapResult) failures.push({ name: 'snapToTenMin', error: snapResult });

// Test each level
for (const c of cases) {
  for (let i = 0; i < c.iterations; i++) {
    const result = generateForLevel(c.level, NOW);
    const err = c.check(result, NOW);
    totalChecks++;
    if (err) {
      failures.push({
        name: c.name,
        iteration: i,
        result,
        error: err,
      });
      break; // only report first failure per level
    }
  }
  console.log('  ' + c.name.padEnd(20) + '  ×' + c.iterations + ' iterations');
}

// Randomness sanity
console.log('');
console.log('Randomness spread (300 iterations):');
for (const level of ['past_near', 'past_same_year', 'future_far', 'past_other_years', 'future_near']) {
  const spread = testRandomnessSpread(level, 300);
  console.log('  ' + level.padEnd(20) + '  ' + spread.dates + ' unique dates  ·  ' + spread.times + ' unique times');
  // Sanity: should have at least a few unique values
  if (level === 'past_near' && spread.dates < 5) failures.push({ name: level + ' spread', error: 'expected ≥5 unique dates over 300 runs, got ' + spread.dates });
}

console.log('');
console.log('Total checks: ' + totalChecks);
console.log('Failures:     ' + failures.length);
if (failures.length === 0) {
  console.log('');
  console.log('All anchor tests pass ✓');
  process.exit(0);
}
console.log('');
for (const f of failures) {
  console.log('FAIL  ' + f.name);
  if (f.error)  console.log('  error:  ' + f.error);
  if (f.result) console.log('  result: ' + JSON.stringify(f.result));
}
process.exit(1);
