import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
            if (isSignUp) {
                // Sign up
                const userCredential = await createUserWithEmailAndPassword(
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
                navigate('/dashboard');
            } else {
                // Sign in
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                const userData = userDoc.data();
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-image-section" />
            <div className="auth-form-section">
                <div className="logo-container">
                    <img 
                        src="https://firebasestorage.googleapis.com/v0/b/fans-food-stf.firebasestorage.app/o/static-images%2Ffans_food_logo_green.png?alt=media&token=8091953e-5fcc0-478a-af56-7db90a45d00e" 
                        alt="Fans Food Logo"
                    />
                </div>
                <div className="auth-box">
                <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className="form-group">
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {isSignUp && (
                        <>
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="code"
                                    placeholder="Registration Code"
                                    value={formData.code}
                                    onChange={handleChange}
                                />
                            </div>

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

                    <button type="submit" className="submit-btn">
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-switch">
                    <button onClick={() => setIsSignUp(!isSignUp)}>
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
