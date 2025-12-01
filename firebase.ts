import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  // Use environment variables for security and deployment flexibility
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
  // apiKey: "AIzaSyCu4-qBECAiA2Bqgzt0JB52dBx3d4WKsFo",
  // authDomain: "returnneosiam.firebaseapp.com",
  // databaseURL: "https://returnneosiam-default-rtdb.asia-southeast1.firebasedatabase.app",
  // projectId: "returnneosiam",
  // storageBucket: "returnneosiam.firebasestorage.app",
  // messagingSenderId: "46662606762",
  // appId: "1:46662606762:web:29d41bf680226753f4d5d3",
  // measurementId: "G-38PCJ8VXLS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize Analytics

console.log("✅ Firebase App Initialized (RTDB):", app.name);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);