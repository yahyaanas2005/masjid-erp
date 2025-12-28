const admin = require('firebase-admin');

let firebaseApp;

try {
    const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.warn('⚠️  Firebase initialization failed:', error.message);
    console.warn('Push notifications will be disabled');
}

module.exports = { firebaseApp, admin };
