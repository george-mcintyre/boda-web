const { Config } = require('../models');
const { normalizeLang } = require('../utils/i18n');

// Determines req.lang from ?lang, header Accept-Language, or Config.defaultLanguage
async function locale(req, res, next) {
  try {
    const qLang = normalizeLang(req.query.lang);
    const hLang = normalizeLang(req.headers['accept-language']);
    let def = 'es';
    try {
      const cfg = await Config.findOne({}, { defaultLanguage: 1 }).lean();
      if (cfg && cfg.defaultLanguage) def = normalizeLang(cfg.defaultLanguage);
    } catch (_) { /* ignore */ }
    req.lang = qLang || hLang || def;
    req.defaultLang = def;
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { locale };
