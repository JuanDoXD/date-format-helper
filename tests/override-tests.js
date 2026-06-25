#!/usr/bin/env node
// Date Format Helper — override tests
// Verifies that compose() respects includePrefix / includeDate / includeTime overrides.

const { compose, naturalBlocks } = require('../src/compose.js');

const base = {
  locale: 'es-ES',
  referenceDate: '2026-05-23', // Saturday
  timeStart: '20:00',
};

const cases = [
  // ============ Quitar Prefix ============
  {
    name: 'past_near + quitar prefix',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', includePrefix: false },
    expected: 'Sábado, 20:00',  // capitalize because no prefix
  },
  {
    name: 'live + quitar prefix',
    input: { ...base, domain: 'no_grabacion', level: 'live', timeEnd: '20:40', includePrefix: false },
    expected: '20:00 - 20:40',
  },
  {
    name: 'grabacion past_immediate + quitar prefix',
    input: { ...base, referenceDate: '2026-05-26', domain: 'grabacion', level: 'past_immediate', includePrefix: false },
    expected: 'Ayer, 20:00',
  },

  // ============ Quitar Date ============
  {
    name: 'past_near + quitar date',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', includeDate: false },
    expected: 'Emitido, 20:00',  // prefix only + time
  },
  {
    name: 'past_other_years + quitar date',
    input: { ...base, referenceDate: '2025-04-15', domain: 'no_grabacion', level: 'past_other_years', includeDate: false },
    expected: 'Emitido',  // no date, no time → just prefix
  },

  // ============ Quitar Time ============
  {
    name: 'past_near + quitar time',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', includeTime: false },
    expected: 'Emitido sábado',
  },
  {
    name: 'live + quitar time',
    input: { ...base, domain: 'no_grabacion', level: 'live', timeEnd: '20:40', includeTime: false },
    expected: 'En emisión',
  },
  {
    name: 'future_immediate + quitar time',
    input: { ...base, referenceDate: '2026-05-28', domain: 'no_grabacion', level: 'future_immediate', includeTime: false },
    expected: 'Mañana',
  },

  // ============ Forzar Time on level without natural time ============
  {
    name: 'past_other_years + forzar time',
    input: { ...base, referenceDate: '2025-04-15', domain: 'no_grabacion', level: 'past_other_years', includeTime: true },
    expected: 'Emitido 15/04/25, 20:00',
  },
  {
    name: 'past_same_year + forzar time',
    input: { ...base, referenceDate: '2026-05-10', domain: 'no_grabacion', level: 'past_same_year', includeTime: true },
    expected: 'Emitido 10 mayo, 20:00',
  },
  {
    name: 'future_far + forzar time',
    input: { ...base, referenceDate: '2026-06-10', domain: 'no_grabacion', level: 'future_far', includeTime: true },
    expected: '10 junio, 20:00',
  },
  {
    name: 'grabacion future_far + forzar time',
    input: { ...base, referenceDate: '2026-06-10', domain: 'grabacion', level: 'future_far', includeTime: true },
    expected: 'Programado 10 junio, 20:00',
  },

  // ============ Multiple overrides ============
  {
    name: 'past_near + quitar prefix + quitar time',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', includePrefix: false, includeTime: false },
    expected: 'Sábado',
  },
  {
    name: 'past_other_years + quitar prefix + forzar time',
    input: { ...base, referenceDate: '2025-04-15', domain: 'no_grabacion', level: 'past_other_years', includePrefix: false, includeTime: true },
    expected: '15/04/25, 20:00',
  },
  {
    name: 'all blocks off',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', includePrefix: false, includeDate: false, includeTime: false },
    expected: '',
  },

  // ============ Forzar-on no-op cases (block has no natural value) ============
  {
    name: 'no_grabacion future_immediate + forzar prefix (no-op — no natural prefix)',
    input: { ...base, referenceDate: '2026-05-28', domain: 'no_grabacion', level: 'future_immediate', includePrefix: true },
    expected: 'Mañana, 20:00',  // same as default — there is no prefix to force on
  },
  {
    name: 'live + forzar date (no-op — live has no natural date)',
    input: { ...base, domain: 'no_grabacion', level: 'live', timeEnd: '20:40', includeDate: true },
    expected: 'En emisión, 20:00 - 20:40',
  },

  // ============ DE / PT-BR coverage with overrides ============
  {
    name: 'DE past_near + quitar prefix',
    input: { ...base, locale: 'de-DE', domain: 'no_grabacion', level: 'past_near', includePrefix: false },
    expected: 'Samstag, 20:00',
  },
  {
    name: 'PT-BR future_far + forzar time',
    input: { ...base, locale: 'pt-BR', referenceDate: '2026-06-10', domain: 'no_grabacion', level: 'future_far', includeTime: true },
    expected: '10 junho, 20:00',
  },

  // ============ New mode-based API (prefixMode / dateMode / timeMode) ============
  {
    name: 'mode auto = natural state (past_near)',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', prefixMode: 'auto', dateMode: 'auto', timeMode: 'auto' },
    expected: 'Emitido sábado, 20:00',
  },
  {
    name: 'mode off prefix (past_near)',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', prefixMode: 'off' },
    expected: 'Sábado, 20:00',
  },
  {
    name: 'mode off time (past_near)',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', timeMode: 'off' },
    expected: 'Emitido sábado',
  },
  {
    name: 'mode on time (past_other_years — natural off)',
    input: { ...base, referenceDate: '2025-04-15', domain: 'no_grabacion', level: 'past_other_years', timeMode: 'on' },
    expected: 'Emitido 15/04/25, 20:00',
  },
  {
    name: 'mode off all (past_near)',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', prefixMode: 'off', dateMode: 'off', timeMode: 'off' },
    expected: '',
  },
  {
    name: 'mode mix: prefix off + time on (past_other_years)',
    input: { ...base, referenceDate: '2025-04-15', domain: 'no_grabacion', level: 'past_other_years', prefixMode: 'off', timeMode: 'on' },
    expected: '15/04/25, 20:00',
  },
  {
    name: 'mode wins over legacy boolean',
    input: { ...base, domain: 'no_grabacion', level: 'past_near', prefixMode: 'off', includePrefix: true },
    expected: 'Sábado, 20:00',  // mode 'off' beats legacy includePrefix: true
  },

  // ============ Airing V2 — DE word order swap (date + prefix-suffix) ============
  {
    name: 'V2 DE past_near no_grabacion',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', domain: 'no_grabacion', level: 'past_near' },
    expected: 'Samstag, 20:00 gesendet',
  },
  {
    name: 'V2 DE past_immediate no_grabacion',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2026-05-26', domain: 'no_grabacion', level: 'past_immediate' },
    expected: 'Gestern, 20:00 gesendet',
  },
  {
    name: 'V2 DE past_same_year no_grabacion (no time)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2026-05-10', domain: 'no_grabacion', level: 'past_same_year' },
    expected: '10. Mai gesendet',
  },
  {
    name: 'V2 DE past_other_years no_grabacion',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2025-04-15', domain: 'no_grabacion', level: 'past_other_years' },
    expected: '15.04.25 gesendet',
  },
  {
    name: 'V2 DE grabacion past_near (aufgenommen suffix)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', domain: 'grabacion', level: 'past_near' },
    expected: 'Samstag, 20:00 aufgenommen',
  },
  {
    name: 'V2 DE grabacion future_immediate (geplant suffix)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2026-05-28', domain: 'grabacion', level: 'future_immediate' },
    expected: 'Morgen, 20:00 geplant',
  },
  {
    name: 'V2 DE live no_grabacion (Live is not a participle — unchanged)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2026-05-27', timeEnd: '20:40', domain: 'no_grabacion', level: 'live' },
    expected: 'Live, 20:00 - 20:40',
  },
  {
    name: 'V2 DE grabacion live (Aufnahme is not a participle — unchanged)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2026-05-27', timeEnd: '20:40', domain: 'grabacion', level: 'live' },
    expected: 'Aufnahme, 20:00 - 20:40',
  },
  {
    name: 'V2 DE no_grabacion future_immediate (no prefix — unchanged)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'de-DE', referenceDate: '2026-05-28', domain: 'no_grabacion', level: 'future_immediate' },
    expected: 'Morgen, 20:00',
  },
  {
    name: 'V2 ES is identical to V1 (no change for non-DE)',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'es-ES', domain: 'no_grabacion', level: 'past_near' },
    expected: 'Emitido sábado, 20:00',
  },
  {
    name: 'V2 PT-BR is identical to V1',
    input: { ...base, defType: 'airing', defVersion: 'v2', locale: 'pt-BR', domain: 'no_grabacion', level: 'past_near' },
    expected: 'Exibido sábado, 20:00',
  },

  // ============ Caption V1 (stub — falls back to Airing V1) ============
  {
    name: 'Caption V1 falls back to Airing V1 for now',
    input: { ...base, defType: 'caption', defVersion: 'v1', domain: 'no_grabacion', level: 'past_near' },
    expected: 'Emitido sábado, 20:00',
  },
];

// ============ naturalBlocks tests ============
const naturalCases = [
  { level: 'past_other_years', locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: true,  includeDate: true,  includeTime: false } },
  { level: 'past_same_year',   locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: true,  includeDate: true,  includeTime: false } },
  { level: 'past_near',        locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: true,  includeDate: true,  includeTime: true  } },
  { level: 'past_immediate',   locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: true,  includeDate: true,  includeTime: true  } },
  { level: 'live',             locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: true,  includeDate: false, includeTime: true  } },
  { level: 'future_immediate', locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: false, includeDate: true,  includeTime: true  } },
  { level: 'future_near',      locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: false, includeDate: true,  includeTime: true  } },
  { level: 'future_far',       locale: 'es-ES', domain: 'no_grabacion', expected: { includePrefix: false, includeDate: true,  includeTime: false } },
  { level: 'future_far',       locale: 'es-ES', domain: 'grabacion',    expected: { includePrefix: true,  includeDate: true,  includeTime: false } },
  { level: 'live',             locale: 'es-ES', domain: 'grabacion',    expected: { includePrefix: true,  includeDate: false, includeTime: true  } },
];

console.log('');
console.log('Date Format Helper — Override Tests');
console.log('=====================================');

let pass = 0, fail = 0;
const failures = [];

// compose() override behavior
for (const c of cases) {
  const actual = compose(c.input);
  if (actual === c.expected) {
    pass++;
  } else {
    fail++;
    failures.push({ name: c.name, expected: c.expected, actual });
  }
}

// naturalBlocks() correctness
for (const c of naturalCases) {
  const actual = naturalBlocks(c.level, c.locale, c.domain);
  const ok = actual.includePrefix === c.expected.includePrefix &&
             actual.includeDate   === c.expected.includeDate &&
             actual.includeTime   === c.expected.includeTime;
  if (ok) pass++;
  else {
    fail++;
    failures.push({
      name: 'naturalBlocks ' + c.level + '/' + c.domain,
      expected: JSON.stringify(c.expected),
      actual:   JSON.stringify(actual),
    });
  }
}

console.log('Total: ' + (pass + fail));
console.log('Pass:  ' + pass);
console.log('Fail:  ' + fail);

if (fail === 0) {
  console.log('');
  console.log('All override tests pass ✓');
  process.exit(0);
}
console.log('');
console.log('Failures:');
for (const f of failures) {
  console.log('  ' + f.name);
  console.log('    expected: ' + JSON.stringify(f.expected));
  console.log('    actual:   ' + JSON.stringify(f.actual));
}
process.exit(1);
