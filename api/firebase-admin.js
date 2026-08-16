const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getAuth: getFirebaseAuth } = require('firebase-admin/auth');
const { getDatabase: getFirebaseDatabase } = require('firebase-admin/database');

let appInstance = null;

function getServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            return parsed;
        } catch (_) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON tidak valid.');
        }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin belum dikonfigurasi. Set FIREBASE_SERVICE_ACCOUNT_JSON atau FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY.');
    }

    return {
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n')
    };
}

function getAdminApp() {
    if (appInstance) return appInstance;
    const existingApps = getApps();
    if (existingApps.length > 0) {
        appInstance = getApp();
        return appInstance;
    }
    appInstance = initializeApp({
        credential: cert(getServiceAccount()),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://heroikzre-default-rtdb.asia-southeast1.firebasedatabase.app'
    });
    return appInstance;
}

function getAuth() {
    return getFirebaseAuth(getAdminApp());
}

function getDatabase() {
    return getFirebaseDatabase(getAdminApp());
}

module.exports = { getAdminApp, getAuth, getDatabase };
