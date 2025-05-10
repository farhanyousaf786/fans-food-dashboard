import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUser({ ...user, ...userDoc.data() });
          } else {
            setUser(user); // Still set the user even if Firestore doc doesn't exist yet
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setUser(user); // Still set the user on error
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        console.warn('User document not found in Firestore');
      } else {
        // Update local user state with Firestore data
        setUser({ ...userCredential.user, ...userDoc.data() });
      }
      
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw new Error(error.message || 'Failed to sign in');
      }
    }
  };

  const signup = async (email, password, userData) => {
    let userCredential;
    try {
      // Create Firebase auth user first
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Wait for the auth state to be fully updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then try to create Firestore profile
      const userRef = doc(db, 'users', userCredential.user.uid);
      
      // Clean up userData to remove any undefined values
      const cleanUserData = {};
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined) {
          cleanUserData[key] = userData[key];
        }
      });

      await setDoc(userRef, {
        ...cleanUserData,
        email,
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Verify the document was created
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        throw new Error('Failed to verify user document creation');
      }
      
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      
      // If we created the auth user but Firestore failed, try to delete the auth user
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Error deleting incomplete user:', deleteError);
        }
      }
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already registered');
      }
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
