// Date Format Helper — core composition logic
// This module is the single source of truth for date string composition.
// It is loaded by ui.html (inlined at copy time) and by tests/run-tests.js (CommonJS).
//
// Implements ZH "Time & Date format" v0.2.
// IMPORTANT: If you modify this file, run `node tests/run-tests.js` and copy the
// updated function bodies into ui.html script tag.

const PREFIXES = {
  'es-ES': {
    no_grabacion: {
      past_other_years: 'Emitido',
      past_same_year:   'Emitido',
      past_near:        'Emitido',
      past_immediate:   'Emitido',
      live:             'En emisión',
      future_immediate: '',
      future_near:      '',
      future_far:       '',
    },
    grabacion: {
      past_other_years: 'Grabado',
      past_same_year:   'Grabado',
      past_near:        'Grabado',
      past_immediate:   'Grabado',
      live:             'Grabando',
      future_immediate: 'Programado',
      future_near:      'Programado',
      future_far:       'Programado',
    },
  },
  'de-DE': {
    no_grabacion: {
      past_other_years: 'Gesendet',
      past_same_year:   'Gesendet',
      past_near:        'Gesendet',
      past_immediate:   'Gesendet',
      live:             'Live',
      future_immediate: '',
      future_near:      '',
      future_far:       '',
    },
    grabacion: {
      past_other_years: 'Aufgenommen',
      past_same_year:   'Aufgenommen',
      past_near:        'Aufgenommen',
      past_immediate:   'Aufgenommen',
      live:             'Aufnahme',
      future_immediate: 'Geplant',
      future_near:      'Geplant',
      future_far:       'Geplant',
    },
  },
  'pt-BR': {
    no_grabacion: {
      past_other_years: 'Exibido',
      past_same_year:   'Exibido',
      past_near:        'Exibido',
      past_immediate:   'Exibido',
      live:             'No ar',
      future_immediate: '',
      future_near:      '',
      future_far:       '',
    },
    grabacion: {
      past_other_years: 'Gravado',
      past_same_year:   'Gravado',
      past_near:        'Gravado',
      past_immediate:   'Gravado',
      live:             'Gravando',
      future_immediate: 'Programado',
      future_near:      'Programado',
      future_far:       'Programado',
    },
  },
};

const MONTHS = {
  'es-ES': ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  'de-DE': ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  'pt-BR': ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
};

// Indexed by getDay() — 0 = Sunday ... 6 = Saturday
const WEEKDAYS = {
  'es-ES': ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],
  'de-DE': ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
  // pt-BR uses condensed weekday names ("segunda" not "segunda-feira") for EPG-style consistency with ES.
  // Pending validation by VIVO Localization.
  'pt-BR': ['domingo','segunda','terça','quarta','quinta','sexta','sábado'],
};

const YESTERDAY = { 'es-ES': 'ayer',   'de-DE': 'gestern', 'pt-BR': 'ontem' };
const TOMORROW  = { 'es-ES': 'mañana', 'de-DE': 'morgen',  'pt-BR': 'amanhã' };

function pad2(n) { return String(n).padStart(2, '0'); }

function parseIsoDate(iso) {
  // Parse YYYY-MM-DD as a local-time date at noon to avoid TZ flipping.
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatDatePart(level, locale, referenceDate) {
  const date = (referenceDate instanceof Date) ? referenceDate : parseIsoDate(referenceDate);
  const day = date.getDate();
  const monthIdx = date.getMonth();
  const weekdayIdx = date.getDay();
  const yearShort = String(date.getFullYear()).slice(-2);
  const monthPadded = pad2(monthIdx + 1);
  const dayPadded = pad2(day);

  switch (level) {
    case 'past_other_years':
      if (locale === 'de-DE') return dayPadded + '.' + monthPadded + '.' + yearShort;
      return dayPadded + '/' + monthPadded + '/' + yearShort;

    case 'past_same_year':
    case 'future_far': {
      const monthName = MONTHS[locale][monthIdx];
      if (locale === 'de-DE') return day + '. ' + monthName;
      return day + ' ' + monthName;
    }

    case 'past_near':
    case 'future_near':
      return WEEKDAYS[locale][weekdayIdx];

    case 'past_immediate':
      return YESTERDAY[locale];

    case 'future_immediate':
      return TOMORROW[locale];

    case 'live':
      return '';

    default:
      return '';
  }
}

function formatTimePart(level, timeStart, timeEnd) {
  if (level === 'live' && timeEnd) return timeStart + ' - ' + timeEnd;
  if (level === 'past_other_years' || level === 'past_same_year' || level === 'future_far') return '';
  return timeStart || '';
}

function capitalizeFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * naturalBlocks(level, locale, domain) → { includePrefix, includeDate, includeTime }
 *
 * Returns the natural per-level enable state for each block. Used by the UI to
 * reset overrides when level/domain changes.
 */
function naturalBlocks(level, locale, domain) {
  const hasNaturalPrefix = !!PREFIXES[locale][domain][level];
  const hasNaturalDate = level !== 'live';
  const hasNaturalTime = !['past_other_years', 'past_same_year', 'future_far'].includes(level);
  return {
    includePrefix: hasNaturalPrefix,
    includeDate:   hasNaturalDate,
    includeTime:   hasNaturalTime,
  };
}

/**
 * compose(input) → string
 *
 * input: {
 *   domain:         'no_grabacion' | 'grabacion',
 *   level:          one of LEVELS,
 *   locale:         'es-ES' | 'de-DE' | 'pt-BR',
 *   referenceDate:  ISO 'YYYY-MM-DD' string or Date,
 *   timeStart:      'HH:mm',
 *   timeEnd:        'HH:mm' (only used when level === 'live'),
 *
 *   // Overrides (optional, default to natural per-level behavior)
 *   includePrefix:  boolean,  // force on/off the prefix block
 *   includeDate:    boolean,  // force on/off the date block
 *   includeTime:    boolean,  // force on/off the time block
 * }
 *
 * Override semantics:
 * - "quitar" (force off): always works — block is omitted.
 * - "forzar" (force on) for Prefix: uses the level's natural prefix. No-op if level
 *   has no prefix (e.g. no_grabacion future_*).
 * - "forzar" for Date: uses the level's natural date format. No-op for live (no
 *   defined date format).
 * - "forzar" for Time: uses timeStart in 'HH:mm' format. Useful to add time to
 *   levels that naturally don't render it (past_other_years, past_same_year, future_far).
 */
function resolveMode(mode, naturalValue, explicitInclude) {
  // mode wins if defined ('auto'|'on'|'off'). Else explicitInclude (legacy boolean). Else natural.
  if (mode === 'on')  return true;
  if (mode === 'off') return false;
  if (mode === 'auto') return naturalValue;
  if (explicitInclude !== undefined) return !!explicitInclude;
  return naturalValue;
}

// Resolve the (mode, version) pair to a specific composer. Defaults to airing-v1.
function compose(input) {
  const type = input.defType || 'airing';
  const ver = input.defVersion || 'v1';
  if (type === 'airing' && ver === 'v1') return composeAiringV1(input);
  if (type === 'airing' && ver === 'v2') return composeAiringV2(input);
  if (type === 'caption' && ver === 'v1') return composeCaptionV1(input);
  return composeAiringV1(input);
}

function resolveAllBlocks(input) {
  const natural = naturalBlocks(input.level, input.locale, input.domain);
  return {
    includePrefix: resolveMode(input.prefixMode, natural.includePrefix, input.includePrefix),
    includeDate:   resolveMode(input.dateMode,   natural.includeDate,   input.includeDate),
    includeTime:   resolveMode(input.timeMode,   natural.includeTime,   input.includeTime),
  };
}

function composeAiringV1(input) {
  const { includePrefix, includeDate, includeTime } = resolveAllBlocks(input);

  const naturalPrefix = PREFIXES[input.locale][input.domain][input.level];
  const naturalDate   = formatDatePart(input.level, input.locale, input.referenceDate);
  const naturalTime   = formatTimePart(input.level, input.timeStart, input.timeEnd);

  const prefix = includePrefix ? naturalPrefix : '';
  const datePart = includeDate ? naturalDate : '';
  let timePart = includeTime ? naturalTime : '';

  if (includeTime && !naturalTime && input.timeStart && input.level !== 'live') {
    timePart = input.timeStart;
  }

  let head;
  if (prefix) head = datePart ? (prefix + ' ' + datePart) : prefix;
  else head = capitalizeFirst(datePart);

  if (timePart) return head ? (head + ', ' + timePart) : timePart;
  return head;
}

// DE participle prefixes that should go at the end in V2 (native German word order).
const DE_PARTICIPLE_PREFIXES = ['Gesendet', 'Aufgenommen', 'Geplant'];

function composeAiringV2(input) {
  // V2 only changes DE; ES and PT are unchanged.
  if (input.locale !== 'de-DE') return composeAiringV1(input);

  const { includePrefix, includeDate, includeTime } = resolveAllBlocks(input);

  const naturalPrefix = PREFIXES[input.locale][input.domain][input.level];
  const naturalDate   = formatDatePart(input.level, input.locale, input.referenceDate);
  const naturalTime   = formatTimePart(input.level, input.timeStart, input.timeEnd);

  const prefix = includePrefix ? naturalPrefix : '';
  const datePart = includeDate ? naturalDate : '';
  let timePart = includeTime ? naturalTime : '';
  if (includeTime && !naturalTime && input.timeStart && input.level !== 'live') {
    timePart = input.timeStart;
  }

  // Suffix-position rule: applies only when prefix is a participle AND there is a date to anchor it.
  // "Live" / "Aufnahme" are not participles, fall back to V1 ordering.
  const isParticiple = prefix && DE_PARTICIPLE_PREFIXES.includes(prefix);
  if (isParticiple && datePart) {
    const dateChunk = capitalizeFirst(datePart); // start-of-string capitalisation for adverbs like "gestern"
    const body = timePart ? (dateChunk + ', ' + timePart) : dateChunk;
    return body + ' ' + prefix.toLowerCase();
  }

  // Otherwise, same shape as V1.
  let head;
  if (prefix) head = datePart ? (prefix + ' ' + datePart) : prefix;
  else head = capitalizeFirst(datePart);
  if (timePart) return head ? (head + ', ' + timePart) : timePart;
  return head;
}

// Caption V1 — placeholder, falls back to Airing V1 until Localization closes the spec.
// Real implementation should differentiate "today" vs "yesterday" past, render "Día DD" futuro,
// and use locale-native time suffixes ("a las", "h", "Uhr") if the team decides to keep them.
function composeCaptionV1(input) {
  // Mark in metadata that this is a stub; output identical to Airing V1 for now.
  return composeAiringV1(input);
}

const LEVELS = [
  'past_other_years',
  'past_same_year',
  'past_near',
  'past_immediate',
  'live',
  'future_immediate',
  'future_near',
  'future_far',
];

const LOCALES = ['es-ES', 'de-DE', 'pt-BR'];
const DOMAINS = ['no_grabacion', 'grabacion'];

const LEVEL_LABELS = {
  past_other_years: 'Pasado +1 año',
  past_same_year:   'Pasado +7 días',
  past_near:        'Pasado 2-7 días',
  past_immediate:   'Pasado Hoy-Ayer',
  live:             'Directo',
  future_immediate: 'Futuro Hoy-Mañana',
  future_near:      'Futuro 2-7 días',
  future_far:       'Futuro +7 días',
};

const LOCALE_LABELS = {
  'es-ES': 'ES — Movistar Plus+',
  'de-DE': 'DE — O2',
  'pt-BR': 'PT-BR — VIVO',
};

const DOMAIN_LABELS = {
  no_grabacion: 'No grabación',
  grabacion:    'Grabación',
};

// ===========================================================
// Anchor logic — generates coherent date/time defaults for each level
// ===========================================================

const TV_MINUTE_SLOTS = [0, 10, 20, 30, 40, 50];
const TV_PROGRAMMING_WINDOW = { startHour: 6, endHour: 23 }; // 06:00 – 23:50
const LIVE_DURATIONS_MIN = [20, 30, 40, 50, 60]; // typical TV slot durations

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isoDate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function isoTime(d) {
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function snapToTenMin(date) {
  const d = new Date(date.getTime());
  d.setMinutes(Math.round(d.getMinutes() / 10) * 10, 0, 0);
  return d;
}

function randomTvTimeSlot() {
  const hour = randInt(TV_PROGRAMMING_WINDOW.startHour, TV_PROGRAMMING_WINDOW.endHour);
  const minute = TV_MINUTE_SLOTS[randInt(0, TV_MINUTE_SLOTS.length - 1)];
  return { hour, minute };
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function computeDayOffset(level, now) {
  switch (level) {
    case 'past_immediate':   return -1;
    case 'future_immediate': return 1;
    case 'past_near':        return -randInt(2, 7);
    case 'future_near':      return randInt(2, 7);
    case 'past_same_year': {
      const todayDoY = dayOfYear(now);
      const maxDaysAgo = Math.max(8, todayDoY - 1);
      return -randInt(8, maxDaysAgo);
    }
    case 'future_far': {
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      const maxDaysAhead = Math.floor((endOfYear - now) / 86400000);
      const cap = Math.min(Math.max(maxDaysAhead, 8), 180);
      return randInt(8, cap);
    }
    case 'past_other_years':
      return -randInt(366, 365 * 3);
    default:
      return 0;
  }
}

/**
 * generateForLevel(level, [now]) → { referenceDate, timeStart, timeEnd }
 *
 * Picks a coherent date+time for the given level, with randomness inside the
 * level's range. Use as a default when the user changes level, opens the plugin,
 * or clicks the regenerate button.
 *
 * - "live" uses now snapped to 10 min, with a random typical duration.
 * - Other levels pick a random day-offset inside the level's range and a random
 *   TV time slot (06:00–23:50 in 10-min steps).
 * - timeStart is always set even for levels that don't render time (compose() ignores
 *   it when not needed). This way it's preserved if the user switches back.
 */
function generateForLevel(level, now) {
  now = now || new Date();

  if (level === 'live') {
    const start = snapToTenMin(now);
    const duration = LIVE_DURATIONS_MIN[randInt(0, LIVE_DURATIONS_MIN.length - 1)];
    const end = new Date(start.getTime() + duration * 60000);
    return {
      referenceDate: isoDate(start),
      timeStart: isoTime(start),
      timeEnd: isoTime(end),
    };
  }

  const dayOffset = computeDayOffset(level, now);
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + dayOffset);

  const slot = randomTvTimeSlot();
  d.setHours(slot.hour, slot.minute, 0, 0);

  return {
    referenceDate: isoDate(d),
    timeStart: isoTime(d),
    timeEnd: '',
  };
}

/**
 * nowSnapped() → { referenceDate, timeStart, timeEnd }
 *
 * Returns current date + time snapped to 10-min interval. Used by the "Ahora" button.
 */
function nowSnapped() {
  const s = snapToTenMin(new Date());
  const end = new Date(s.getTime() + 40 * 60000);
  return {
    referenceDate: isoDate(s),
    timeStart: isoTime(s),
    timeEnd: isoTime(end),
  };
}

// CommonJS export so tests/run-tests.js can require this file.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    compose,
    composeAiringV1,
    composeAiringV2,
    composeCaptionV1,
    naturalBlocks,
    resolveMode,
    DE_PARTICIPLE_PREFIXES,
    formatDatePart,
    formatTimePart,
    capitalizeFirst,
    parseIsoDate,
    snapToTenMin,
    generateForLevel,
    nowSnapped,
    computeDayOffset,
    isoDate,
    isoTime,
    PREFIXES,
    MONTHS,
    WEEKDAYS,
    YESTERDAY,
    TOMORROW,
    LEVELS,
    LOCALES,
    DOMAINS,
    LEVEL_LABELS,
    LOCALE_LABELS,
    DOMAIN_LABELS,
    TV_MINUTE_SLOTS,
    TV_PROGRAMMING_WINDOW,
  };
}
