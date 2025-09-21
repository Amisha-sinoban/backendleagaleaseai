const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function loadServiceAccountFromPath(p) {
  try {
    const full = path.isAbsolute(p) ? p : path.join(__dirname, p);
    if (!fs.existsSync(full)) return null;
    const raw = fs.readFileSync(full, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load service account from path:', e.message);
    return null;
  }
}

let initialized = false;

try {
  let cred = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    cred = loadServiceAccountFromPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  if (!cred && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    let normalizedKey = rawKey;
    if (typeof normalizedKey === 'string') {
      normalizedKey = normalizedKey.replace(/^['"]|['"]$/g, '');
      normalizedKey = normalizedKey.replace(/\\n/g, '\n');
    }
    cred = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: normalizedKey,
    };
  }

  if (cred) {
    const cert = {
      projectId: cred.project_id || cred.projectId || process.env.FIREBASE_PROJECT_ID,
      clientEmail: cred.client_email || cred.clientEmail || process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: cred.private_key || cred.privateKey || (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(cert),
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized.');
  } else {
    console.warn('⚠️ Firebase credentials not found. Admin SDK not initialized.');
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin initialization failed:', err && err.message ? err.message : err);
}

module.exports = admin;
