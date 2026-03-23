const DEFAULT_LANG = 'en';

function getLang(req) {
    return (req.query.lang || DEFAULT_LANG).toLowerCase();
  }
  
function mergeLocalizedString(existing, newValue, lang = DEFAULT_LANG) {
  if (newValue == null) return existing;

  let map;
  if (existing instanceof Map) {
    map = new Map(existing);
  } else if (existing && typeof existing === 'object') {
    map = new Map(Object.entries(existing));
  } else if (typeof existing === 'string') {
    map = new Map([[DEFAULT_LANG, existing]]);
  } else {
    map = new Map();
  }

  map.set(lang, newValue);
  return map;
}

function localize(textOrLocalized, lang = DEFAULT_LANG) {
    if (textOrLocalized == null) return '';
  
    // plain string
    if (typeof textOrLocalized === 'string') return textOrLocalized;
  
    // Map<lang,string>
    if (textOrLocalized instanceof Map) {
      const direct = textOrLocalized.get(lang);
      if (direct && direct.trim() !== '') return direct;
  
      for (const v of textOrLocalized.values()) {
        if (v && v.trim() !== '') return v;
      }
      return '';
    }
  
    // plain object { en: '...', es: '...' }
    if (typeof textOrLocalized === 'object') {
      const direct = textOrLocalized[lang];
      if (direct && direct.trim() !== '') return direct;
  
      for (const key of Object.keys(textOrLocalized)) {
        const v = textOrLocalized[key];
        if (typeof v === 'string' && v.trim() !== '') return v;
      }
      return '';
    }
  
    return String(textOrLocalized ?? '');
  }

module.exports = { mergeLocalizedString, localize, getLang };
