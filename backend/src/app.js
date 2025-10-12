const express = require('express');
const cors = require('cors');
const path = require('path');
const { CORS_ORIGIN } = require('./config/env');
const routes = require('./routes');
const { errorHandler } = require('./middleware/error');

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use(routes);
app.use(errorHandler);

module.exports = { app };