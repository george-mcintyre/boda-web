// Simple i18n helpers to extract localized strings from Map fields
// Usage: text(doc.title, req.lang, 'en')

function normalizeLang(lang) {
  if (!lang) return '';
  return String(lang).toLowerCase().split(',')[0].trim();
}

function negotiateLang(preferred, fallbacks = []) {
  const list = [];
  if (preferred) list.push(normalizeLang(preferred));
  for (const f of fallbacks) if (f) list.push(normalizeLang(f));
  // dedupe while preserving order
  return Array.from(new Set(list)).filter(Boolean);
}

function text(mapOrString, lang, ...fallbackLangs) {
  if (mapOrString == null) return undefined;
  // If already a plain string (legacy), return as-is
  if (typeof mapOrString === 'string') return mapOrString;
  // If Map or plain object with keys
  const langs = negotiateLang(lang, fallbackLangs);
  for (const code of langs) {
    if (!code) continue;
    const val = mapOrString.get ? mapOrString.get(code) : mapOrString[code];
    if (val) return val;
    // try base language without region, e.g., en from en-GB
    const base = code.split('-')[0];
    if (base && base !== code) {
      const v2 = mapOrString.get ? mapOrString.get(base) : mapOrString[base];
      if (v2) return v2;
    }
  }
  // try any available value deterministically
  if (mapOrString.get) {
    for (const v of mapOrString.values()) { if (v) return v; }
  } else {
    const vals = Object.values(mapOrString); if (vals.length) return vals[0];
  }
  return undefined;
}

function localizeEvent(doc, lang, defaultLang = 'en') {
  if (!doc) return null;
  return {
    id: String(doc._id),
    date: doc.date || undefined,
    time: doc.time || undefined,
    day: text(doc.day, lang, defaultLang),
    title: text(doc.title, lang, defaultLang),
    description: text(doc.description, lang, defaultLang),
    venue: text(doc.venue, lang, defaultLang),
    address: text(doc.address, lang, defaultLang),
    order: doc.order ?? undefined,
  };
}

module.exports = { text, localizeEvent, normalizeLang, negotiateLang };
