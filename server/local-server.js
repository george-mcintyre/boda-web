const fs = require('fs');
const path = require('path');
const https = require('https');
const { app } = require('./app');
const { connectDB } = require('./config/db');
const { PORT, HTTPS_PORT, DEV_HTTPS, SSL_KEY_PATH, SSL_CERT_PATH, SSL_CA_PATH } = require('./config/env');
const { ensureCollectionsAndIndexes, seedExampleDataIfEmpty, seedCubeGiftsIfNeeded, seedFigurineGiftsIfNeeded, migrateCashGiftsToAmountOptions, migrateGuestsAddLang } = require('./bootstrap/initDb');

function tryCreateHttpsServer(appInstance) {
  try {
    if (!DEV_HTTPS) return null;
    if (!SSL_KEY_PATH || !SSL_CERT_PATH) {
      console.warn('[HTTPS] DEV_HTTPS=true but SSL_KEY_PATH/SSL_CERT_PATH not set. Skipping HTTPS.');
      return null;
    }
    const key = fs.readFileSync(path.resolve(SSL_KEY_PATH));
    const cert = fs.readFileSync(path.resolve(SSL_CERT_PATH));
    const ca = SSL_CA_PATH ? fs.readFileSync(path.resolve(SSL_CA_PATH)) : undefined;
    const options = ca ? { key, cert, ca } : { key, cert };
    return https.createServer(options, appInstance);
  } catch (e) {
    console.warn('[HTTPS] Failed to initialize HTTPS server:', e.message, 'Skipping HTTPS.');
    return null;
  }
}

(async () => {
  await connectDB();
  await ensureCollectionsAndIndexes().catch(err => console.warn('[DB] Init warning:', err.message));
  await seedExampleDataIfEmpty().catch(err => console.warn('[DB] Seed warning:', err.message));
  await seedCubeGiftsIfNeeded().catch(err => console.warn('[DB] Cube seed warning:', err.message));
  await seedFigurineGiftsIfNeeded().catch(err => console.warn('[DB] Figurine seed warning:', err.message));
  await migrateCashGiftsToAmountOptions().catch(err => console.warn('[DB] Cash gifts migration warning:', err.message));
  await migrateGuestsAddLang().catch(err => console.warn('[DB] Guest lang migration warning:', err.message));

  // Always start HTTP server for dev convenience and LAN access
  app.listen(PORT, '0.0.0.0', () => console.log(`HTTP server running on http://localhost:${PORT} (bound 0.0.0.0)`));

  // Optionally start HTTPS on a separate port
  const httpsServer = tryCreateHttpsServer(app);
  if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => console.log(`HTTPS server running on https://localhost:${HTTPS_PORT} (bound 0.0.0.0)`));
  }
})();
