import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB27nVr6lKWiTgj0lW0wQx5m1-lslhMipw",
  authDomain: "fans-food-stf.firebaseapp.com",
  projectId: "fans-food-stf",
  storageBucket: "fans-food-stf.firebasestorage.app",
  messagingSenderId: "267118373830",
  appId: "1:267118373830:web:dbec72cb78e58940fc60c7",
  measurementId: "G-0J0Q8GCTX4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Auth persistence error:', error);
  });

export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
