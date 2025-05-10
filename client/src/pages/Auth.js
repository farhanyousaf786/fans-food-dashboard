import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiKey } from 'react-icons/fi';
import User from '../models/User';
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
            if (formData.code !== 'fansfood786') {
                setError('Invalid registration code');
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
                    formData.code
                );

                await setDoc(doc(db, 'users', userCredential.user.uid), user.toFirestore());
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                // Sign in
                userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                
                if (!userDoc.exists()) {
                    throw new Error('User data not found');
                }
                
                const userData = userDoc.data();
                const user = User.fromFirestore(userData, userCredential.user.uid);
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
                navigate('/dashboard');
                window.location.reload(); // Force reload to update auth state
            }, 500);

        } catch (error) {
            console.error('Auth error:', error);
            setError(error.message);
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
                        src="https://firebasestorage.googleapis.com/v0/b/fans-food-stf.firebasestorage.app/o/static-images%2Ffans_food_logo_green.png?alt=media&token=8091953e-5fcc0-478a-af56-7db90a45d00e" 
                        alt="Fans Food Logo"
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
