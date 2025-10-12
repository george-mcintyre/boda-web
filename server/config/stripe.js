const { STRIPE_SECRET_KEY } = require('./env');
module.exports = require('stripe')(STRIPE_SECRET_KEY);
