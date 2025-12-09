const admin = require("firebase-admin");

// --- Robustly load service account key ---
let serviceAccount;
try {
    // Attempt to load the service account key.
    // Ensure 'serviceAccountKey.json' is present in your project's root directory.
    serviceAccount = require("../detalks-387c5-firebase-adminsdk-fbsvc-6963d1be07.json");
} catch (e) {
    console.error("=================================================================================");
    console.error("FATAL ERROR: Could not load the Firebase Service Account Key.");
    console.error("Please ensure 'serviceAccountKey.json' is present and valid.");
    console.error("Error details:", e.message);
    console.error("=================================================================================");
    process.exit(1);
}

// --- Initialize App safely (handles nodemon restarts) ---
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "[https://detalks-387c5-default-rtdb.asia-southeast1.firebasedatabase.app](https://detalks-387c5-default-rtdb.asia-southeast1.firebasedatabase.app)"
    });
}

// Export the initialized Firestore and Auth services
const db = admin.firestore();
const auth = admin.auth(); // Added auth service export for verification

module.exports = { db, auth, admin };