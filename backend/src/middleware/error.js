function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
module.exports = { errorHandler };
