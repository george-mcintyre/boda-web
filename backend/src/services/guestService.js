const { Guest } = require('../models');

async function getByEmail(email) { return Guest.findOne({ email }); }
async function list() { return Guest.find().sort({ createdAt: -1 }); }
async function create(data) { return Guest.create(data); }
async function update(id, data) { return Guest.findByIdAndUpdate(id, data, { new: true }); }
async function remove(id) { return Guest.findByIdAndDelete(id); }

module.exports = { getByEmail, list, create, update, remove };
