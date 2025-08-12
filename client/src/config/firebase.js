import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

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

// Initialize messaging
let messaging = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { messaging };

// FCM Token utility functions
export const getFCMToken = async () => {
  try {
    console.log('🔔 FIREBASE: Checking messaging availability...');
    if (!messaging) {
      console.log('❌ FIREBASE: Messaging not available');
      return null;
    }
    
    console.log('🔔 FIREBASE: Requesting FCM token with VAPID key...');
    
    // Request notification permission first
    const permission = await Notification.requestPermission();
    console.log('🔔 FIREBASE: Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.log('⚠️ FIREBASE: Notification permission denied, FCM token will not work');
      // Continue anyway for development - auth flow should still work
    }
    
    const token = await getToken(messaging, {
      vapidKey: 'BJbRKcAgyAfNg7DsBqvNrvVB3Hcd8fEylzKQH4JV53AKBEPUpB5TFGIlbRPYKTckQ9gvG5q2OJBpEV9Mrk4sdVo'
    });
    
    if (token) {
      console.log('✅ FIREBASE: FCM token generated successfully');
      console.log('🔔 FIREBASE: Token preview:', token.substring(0, 30) + '...');
    } else {
      console.log('⚠️ FIREBASE: FCM token generation returned null');
    }
    
    return token;
  } catch (error) {
    console.log('❌ FIREBASE: Error getting FCM token:', error.message);
    console.log('ℹ️ FIREBASE: This is normal in development - auth flow will continue without FCM token');
    
    // In development, return a mock token for testing purposes
    if (process.env.NODE_ENV === 'development') {
      const mockToken = 'dev_mock_token_' + Date.now();
      console.log('🧪 FIREBASE: Using mock FCM token for development:', mockToken);
      return mockToken;
    }
    
    return null;
  }
};

export const generateDeviceId = () => {
  const deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  console.log('🆔 FIREBASE: Generated device ID:', deviceId);
  return deviceId;
};

export default app;
