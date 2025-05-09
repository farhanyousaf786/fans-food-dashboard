import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './Auth.css';

const Auth = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    venueName: '',
    email: '',
    password: '',
    adminPin: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/stadiums');
      } else {
        if (formData.adminPin !== 'fanfood786') {
          throw new Error('Invalid admin PIN');
        }
        await signup(formData.email, formData.password, {
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        navigate('/stadiums');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      venueName: '',
      email: '',
      password: '',
      adminPin: ''
    });
  };

  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="form-container fade-in">
          <img src="https://i.imgur.com/a7sYFli.png" alt="FansFood Logo" className="logo" />
          <h1 className="form-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
             
                <div className="form-field">
                  <label htmlFor="adminPin">Admin PIN</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="adminPin"
                      name="adminPin"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.adminPin}
                      onChange={handleInputChange}
                      required={!isLogin}
                      placeholder="Enter admin PIN"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoFocus={isLogin}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
                <button 
                type="button" 
                className="forgot-password"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading 
                ? (isLogin ? 'Signing in...' : 'Creating account...') 
                : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            <div className="mode-switch">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button 
                type="button" 
                onClick={toggleMode}
                className="mode-switch-button"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="login-image-section" />
    </div>
  );
};

export default Auth;
