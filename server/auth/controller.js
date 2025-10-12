const { login } = require('./service');

async function postLogin(req, res, next) {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (e) {
    if (e.extra) return res.status(e.status || 400).json({ error: e.message, ...e.extra });
    next(e);
  }
}

module.exports = { postLogin };
