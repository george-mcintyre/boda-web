const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { Admin, Guest } = require('../models');

async function login({ email, password }) {
  const guest = await Guest.findOne({ email });
  if (guest && !password) {
    const token = jwt.sign({ role: 'guest', email, name: guest.name, id: guest._id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, type: 'guest', name: guest.name, email: guest.email };
  }

  const admin = await Admin.findOne({ email });
  if (admin) {
    if (!password) {
      const err = new Error('This email requires an administrator password.');
      err.status = 400; err.extra = { passwordRequired: true, email };
      throw err;
    }
    if (admin.password !== password) {
      const err = new Error('Incorrect password.');
      err.status = 401; throw err;
    }
    const token = jwt.sign({ role: 'admin', email, id: admin._id }, JWT_SECRET, { expiresIn: '1d' });
    return { token, type: 'admin', email: admin.email };
  }

  const err = new Error('Email not registered');
  err.status = 404; throw err;
}

module.exports = { login };
