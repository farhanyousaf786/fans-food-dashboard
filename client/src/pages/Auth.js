import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, getFCMToken, generateDeviceId } from "../config/firebase";
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiKey } from 'react-icons/fi';
import User from '../models/User';
import logo from '../assets/logo.png';
import '../styles/Auth.css';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        code: '',
        role: 'shopowner' // default role
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return false;
        }
        if (isSignUp) {
            if (!formData.name) {
                setError('Name is required');
                return false;
            }
            // Role-specific registration code validation
            const requiredCode = formData.role === 'admin' ? 'fanmunchadmin' : 
                               formData.role === 'delivery' ? 'have this ' : 'fanmunchshop';
            if (formData.code !== requiredCode) {
                setError(`Invalid registration code for ${formData.role}`);
                return false;
            }
        }
        return true;
    };

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;

        try {
            let userCredential;
            
            // Get or generate device ID
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = generateDeviceId();
                localStorage.setItem('deviceId', deviceId);
                console.log('🆔 Generated new device ID:', deviceId);
            } else {
                console.log('🆔 Using existing device ID:', deviceId);
            }

            // Get FCM token
            console.log('🔔 Attempting to get FCM token...');
            const fcmToken = await getFCMToken();
            console.log('🔔 FCM Token received:', fcmToken ? 'Success' : 'Failed', fcmToken?.substring(0, 20) + '...');

            if (isSignUp) {
                // Sign up
                userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );

                // Create user document
                const user = new User(
                    formData.name,
                    formData.email,
                    formData.role,
                    formData.code,
                    userCredential.user.uid
                );

                // Add FCM token if available
                if (fcmToken) {
                    console.log('📝 SIGN UP: Adding FCM token to new user');
                    user.addFCMToken(deviceId, fcmToken);
                    console.log('📝 SIGN UP: FCM tokens after adding:', user.fcmTokens);
                } else {
                    console.log('⚠️ SIGN UP: No FCM token available');
                }

                // Store in role-based collection
                const collection = formData.role === 'admin' ? 'admins' : 'shopowners';
                await setDoc(doc(db, collection, userCredential.user.uid), user.toFirestore());
                console.log(`✅ SIGN UP: ${formData.role} document created in ${collection} collection`);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                // Sign in - check both collections
                userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                
                // Try to find user in admins collection first
                let userDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
                let userRole = 'admin';
                
                // If not found in admins, check shopowners collection
                if (!userDoc.exists()) {
                    userDoc = await getDoc(doc(db, 'shopowners', userCredential.user.uid));
                    userRole = 'shopowner';
                }
                
                if (!userDoc.exists()) {
                    throw new Error('User data not found in any collection');
                }
                
                const userData = userDoc.data();
                const user = User.fromFirestore(userData, userCredential.user.uid);
                console.log('🔍 SIGN IN: Current FCM tokens before update:', user.fcmTokens);
                
                // Update FCM token for this device
                if (fcmToken) {
                    console.log('📝 SIGN IN: Adding/updating FCM token for device:', deviceId);
                    user.addFCMToken(deviceId, fcmToken);
                    console.log('📝 SIGN IN: FCM tokens after adding:', user.fcmTokens);
                    
                    // Update in the correct role-based collection
                    const collection = userRole === 'admin' ? 'admins' : 'shopowners';
                    await updateDoc(doc(db, collection, userCredential.user.uid), {
                        fcmTokens: user.fcmTokens,
                        updatedAt: user.updatedAt
                    });
                    console.log(`✅ SIGN IN: FCM token updated in ${collection} collection`);
                } else {
                    console.log('⚠️ SIGN IN: No FCM token available');
                }
                
                localStorage.setItem('user', JSON.stringify(user));
            }

            // Show success animation and navigate
            const container = document.querySelector('.auth-container');
            if (container) {
                container.style.transform = 'scale(0.95)';
                container.style.opacity = '0';
                container.style.transition = 'all 0.5s ease';
            }

            // Navigate after animation
            setTimeout(() => {
                // Check user role and navigate accordingly
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData) {
                    switch (userData.role) {
                        case 'admin':
                            navigate('/admin');
                            break;
                        case 'shopowner':
                            navigate('/shop');
                            break;
                        case 'delivery':
                            navigate('/dashboard');
                            break;
                        default:
                            navigate('/dashboard');
                    }
                } else {
                    navigate('/dashboard');
                }
                console.log('🔄 AUTH: Navigation completed (no reload to preserve console logs)');
            }, 500);

        } catch (error) {
            console.error('Auth error:', error);
            // More detailed error logging
            if (error.code) {
                console.error('Error code:', error.code);
            }
            if (error.customData) {
                console.error('Error custom data:', error.customData);
            }
            // Set a more user-friendly error message
            if (error.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please check your credentials and try again.');
            } else if (error.code === 'auth/user-not-found') {
                setError('No user found with this email. Please check your email or sign up.');
            } else if (error.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else {
                setError(error.message || 'An error occurred during authentication');
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 0.5, when: "beforeChildren" }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            className="auth-container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div 
                className="auth-form-section"
                variants={itemVariants}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="logo-container"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <img 
                        src={logo} 
                        alt="FansFood Logo"
                        style={{ maxWidth: '200px', height: 'auto' }}
                    />
                </motion.div>
                <motion.div 
                    className="auth-box"
                    variants={itemVariants}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                    </motion.h2>
                    {error && (
                        <motion.div 
                            className="error-message"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {error}
                        </motion.div>
                    )}
                    
                    <motion.form 
                        onSubmit={handleSubmit}
                        variants={itemVariants}
                    >
                        {isSignUp && (
                            <motion.div 
                                className="form-group"
                                variants={itemVariants}
                            >
                                <div className="input-icon-wrapper">
                                    <FiUser className="input-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </motion.div>
                        )}

                        <motion.div 
                            className="form-group"
                            variants={itemVariants}
                        >
                            <div className="input-icon-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </motion.div>

                        <motion.div 
                            className="form-group"
                            variants={itemVariants}
                        >
                            <div className="input-icon-wrapper">
                                <FiLock className="input-icon" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </motion.div>

                        {isSignUp && (
                            <>
                                <motion.div 
                                    className="form-group"
                                    variants={itemVariants}
                                >
                                    <div className="input-icon-wrapper">
                                        <FiKey className="input-icon" />
                                        <input
                                            type="text"
                                            name="code"
                                            placeholder="Registration Code"
                                            value={formData.code}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </motion.div>

                                <div className="form-group">
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="shopowner">Shop Owner</option>
                                        <option value="admin">Admin</option>
                                        <option value="delivery">Delivery Person</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <motion.button 
                            type="submit" 
                            className="submit-btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </motion.button>
                    </motion.form>

                    <motion.div 
                        className="auth-switch"
                        variants={itemVariants}
                    >
                        <motion.button 
                            onClick={() => setIsSignUp(!isSignUp)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </motion.button>
                    </motion.div>
                </motion.div>
            </motion.div>
            <motion.div 
                className="auth-image-section"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
            />
        </motion.div>
    );
};

export default Auth;
