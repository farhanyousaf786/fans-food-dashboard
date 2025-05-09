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
        // Check if user is an admin
        try {
          await getIdTokenResult(user);
          const userDoc = await getDoc(doc(db, 'admins', user.uid));
          
          if (userDoc.exists()) {
            setIsAdmin(true);
            setUser(user);
          } else {
            // If not an admin, sign them out
            await auth.signOut();
            setUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw new Error('Invalid email or password');
    }
  };

  const signup = async (email, password, adminData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create admin profile in Firestore
      await setDoc(doc(db, 'admins', userCredential.user.uid), {
        ...adminData,
        email,
        uid: userCredential.user.uid,
        venues: [
          {
            name: adminData.venueName,
            shops: [],
            createdAt: new Date().toISOString()
          }
        ]
      });
      
      return userCredential;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already registered');
      }
      throw new Error('Failed to create admin account');
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    isAdmin,
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
