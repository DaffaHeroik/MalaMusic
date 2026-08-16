const admin = require('firebase-admin');

let initialized = false;

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
    if (!initialized) {
        if (admin.apps.length) {
            initialized = true;
            return admin.app();
        }
        admin.initializeApp({ credential: admin.credential.cert(getServiceAccount()) });
        initialized = true;
    }
    return admin.app();
}

function getAuth() {
    return getAdminApp() && admin.auth();
}

module.exports = { admin, getAdminApp, getAuth };
