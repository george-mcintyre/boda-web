const DEFAULT_LANG = 'en';

function getLang(req) {
    return (req.query.lang || DEFAULT_LANG).toLowerCase();
  }
  
function mergeLocalizedString(existing, newValue, lang = DEFAULT_LANG) {
  // If no new value provided, just return existing
  if (newValue == null) return existing;

  // Normalize existing into a plain object
  let obj = {};

  if (!existing) {
    obj = {};
  } else if (existing instanceof Map) {
    obj = Object.fromEntries(existing.entries());
  } else if (typeof existing === 'object') {
    obj = { ...existing };
  } else if (typeof existing === 'string') {
    obj = { [lang]: existing };
  }

  obj[lang] = newValue;
  return obj; // Mongoose will cast back to Map<String,String>
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
