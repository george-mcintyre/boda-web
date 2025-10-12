const { app } = require('./app');
const { connectDB } = require('./config/db');
const { PORT } = require('./config/env');
const { ensureCollectionsAndIndexes, seedExampleDataIfEmpty } = require('./bootstrap/initDb');

(async () => {
  await connectDB();
  await ensureCollectionsAndIndexes().catch(err => console.warn('[DB] Init warning:', err.message));
  await seedExampleDataIfEmpty().catch(err => console.warn('[DB] Seed warning:', err.message));
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
