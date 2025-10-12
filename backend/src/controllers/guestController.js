const guestService = require('../services/guestService');

async function getMe(req, res, next) {
  try {
    const me = await guestService.getByEmail(req.user.email);
    if (!me) return res.status(404).json({ error: 'Guest not found' });
    res.json({ name: me.name, email: me.email, status: me.status, companions: me.companions, specialMenu: me.specialMenu, message: me.message });
  } catch (e) { next(e); }
}

async function list(req, res, next) { try { res.json(await guestService.list()); } catch (e) { next(e); } }
async function create(req, res, next) { try { res.status(201).json(await guestService.create(req.body)); } catch (e) { next(e); } }
async function update(req, res, next) { try { res.json(await guestService.update(req.params.id, req.body)); } catch (e) { next(e); } }
async function remove(req, res, next) { try { await guestService.remove(req.params.id); res.status(204).end(); } catch (e) { next(e); } }

module.exports = { getMe, list, create, update, remove };
