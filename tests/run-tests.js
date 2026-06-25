#!/usr/bin/env node
// Date Format Helper — test runner
// Runs every case in cases.json through compose() and asserts the output.
// Cases are extracted from the test suite xlsx (single source of truth).

const fs = require('fs');
const path = require('path');
const { compose } = require('../src/compose.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8'));

let pass = 0;
let fail = 0;
const failures = [];

for (const c of cases) {
  const actual = compose({
    domain: c.domain,
    level: c.level,
    locale: c.locale,
    referenceDate: c.referenceDate,
    timeStart: c.timeStart,
    timeEnd: c.timeEnd || undefined,
  });

  if (actual === c.expected) {
    pass++;
  } else {
    fail++;
    failures.push({
      case_id: c.case_id,
      status: c.status,
      locale: c.locale,
      domain: c.domain,
      level: c.level,
      expected: c.expected,
      actual: actual,
    });
  }
}

console.log('');
console.log('Date Format Helper — Test Suite');
console.log('================================');
console.log('Total:    ' + cases.length);
console.log('Pass:     ' + pass);
console.log('Fail:     ' + fail);

if (fail === 0) {
  console.log('');
  console.log('All cases pass ✓');
  process.exit(0);
}

console.log('');
console.log('Failures:');
console.log('---------');
for (const f of failures) {
  console.log('');
  console.log('  ' + f.case_id + '  [' + f.status + ']  ' + f.locale + ' / ' + f.domain + ' / ' + f.level);
  console.log('    expected: ' + JSON.stringify(f.expected));
  console.log('    actual:   ' + JSON.stringify(f.actual));
}

process.exit(1);
