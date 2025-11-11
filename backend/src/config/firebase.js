const admin = require('firebase-admin');

let db = null;

const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin.app();
    }

    // Initialize with environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    db = admin.database();

    console.log('✅ Firebase initialized successfully');

    // Test connection
    db.ref('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✅ Firebase Realtime Database connected');
      } else {
        console.log('❌ Firebase Realtime Database disconnected');
      }
    });

    return admin.app();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
};

const getDatabase = () => {
  if (!db) {
    initializeFirebase();
    db = admin.database();
  }
  return db;
};

module.exports = {
  initializeFirebase,
  getDatabase,
  admin
};
