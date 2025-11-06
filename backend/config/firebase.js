const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    // Check if Firebase credentials are provided
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      console.log('✅ Firebase Admin initialized successfully');
      firebaseInitialized = true;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      console.log('✅ Firebase Admin initialized successfully');
      firebaseInitialized = true;
    } else {
      console.warn('⚠️  Firebase credentials not found. Push notifications will be disabled.');
      console.warn('   Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH in .env');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
  }

  return admin;
};

const isFirebaseEnabled = () => firebaseInitialized;

module.exports = {
  initializeFirebase,
  isFirebaseEnabled,
  admin
};
