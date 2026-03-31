import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { authService } from '../../services/authService.js';
import { ROUTES } from '../../utils/constants.js';
import './auth.css';
import bgImage from '../../images/sign-in-bg.jpg';


// PasswordInput component outside to prevent re-renders
const PasswordInput = ({ id, name, value, onChange, placeholder, showState, setShowState }) => (
  <div className="relative">
    <input
      id={id}
      type={showState ? "text" : "password"}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
      required
      autoComplete="new-password"
      placeholder={placeholder}
    />
    <button
      type="button"
      onClick={() => setShowState(!showState)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
    >
      {showState ? (
        // Eye open icon (showing password)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      ) : (
        // Eye closed icon (hiding password)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </svg>
      )}
    </button>
  </div>
);

const Auth = ({ mode = "signin" }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', newPassword: '', confirmPassword: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login, signup, loading, user, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || ROUTES.HOME;

  // Extract token from URL for reset password mode and sync mode with URL
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (currentPath === ROUTES.RESET_PASSWORD) {
      setCurrentMode("reset-password");
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        setResetToken(token);
      } else {
        setError('Invalid reset link');
      }
    } else if (currentPath === ROUTES.FORGOT_PASSWORD) {
      setCurrentMode("forgot-password");
    } else if (currentPath === ROUTES.SIGNUP) {
      setCurrentMode("signup");
    } else if (currentPath === ROUTES.SIGNIN) {
      setCurrentMode("signin");
    }
    
    // Clear messages when mode changes
    setSuccessMessage('');
    setError('');
    setFormData({ email: '', password: '', full_name: '', newPassword: '', confirmPassword: '' });
  }, [location.pathname]);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      console.log('Calling authService.forgotPassword...');
      await authService.forgotPassword(formData.email);
      console.log('API call successful');
      setSuccessMessage('Check email for reset link. Check spam folder if not received. Link expires in 1 hour for security.');
      setError('');
    } catch (err) {
      console.log('API call failed:', err);
      if (err.response?.status === 404) {
        setError('Account with this email does not exist.');
        setSuccessMessage('');
      } else {
        setError(err.response?.data?.detail || 'Failed to send reset email');
        setSuccessMessage('');
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await authService.resetPassword(resetToken, formData.newPassword);
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
      setError('');
      // Remove automatic redirect - let user see success message
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
      setSuccessMessage('');
    }
  };

  const handleBackToSignin = () => {
    navigate(ROUTES.SIGNIN);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentMode === "signin") {
      try {
        await login({ email: formData.email, password: formData.password });
        navigate(from, { replace: true });
      } catch (err) {
        setError(err.response?.data?.detail || 'Login failed');
      }
    } else if (currentMode === "signup") {
      try {
        await signup(formData);
        setSuccessMessage('Account created! Please check your email to verify your account.');
        setError('');
      } catch (err) {
        setError(err.response?.data?.detail || 'Signup failed');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    const newMode = currentMode === "signin" ? "signup" : "signin";
    setCurrentMode(newMode);
    setSuccessMessage('');
    setError('');
    setFormData({ email: '', password: '', full_name: '', newPassword: '', confirmPassword: '' });
    
    // Navigate to the correct URL
    navigate(newMode === "signup" ? ROUTES.SIGNUP : ROUTES.SIGNIN);
  };

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="signInForm bg-gray-200 flex items-center justify-center px-4 h-full" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)] p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {currentMode === "reset-password" ? 'Reset Password' : 
           currentMode === "forgot-password" ? 'Forgot Password' :
           currentMode === "signup" ? 'Create Account' : 'Sign In'}
        </h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={
          currentMode === "forgot-password" ? handleSendResetEmail :
          currentMode === "reset-password" ? handleResetPassword :
          handleSubmit
        } className="space-y-4">
          {currentMode === "forgot-password" ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
                autoComplete="off"
                placeholder="Enter your email address"
              />
            </div>
          ) : currentMode === "reset-password" ? (
            <>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  showState={showNewPassword}
                  setShowState={setShowNewPassword}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  showState={showConfirmPassword}
                  setShowState={setShowConfirmPassword}
                />
              </div>
            </>
          ) : (
            <>
              {currentMode === "signup" && (
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required={currentMode === "signup"}
                    autoComplete="off"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                  autoComplete="off"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  showState={showPassword}
                  setShowState={setShowPassword}
                />
              </div>
            </>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Please wait...' : 
             currentMode === "forgot-password" ? 'Send Reset Link' :
             currentMode === "reset-password" ? 'Reset Password' :
             currentMode === "signup" ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          {currentMode === "forgot-password" || currentMode === "reset-password" ? (
            <button
              onClick={handleBackToSignin}
              className="text-gray-800 hover:text-gray-900 text-sm font-bold"
            >
              ← Back to Sign In
            </button>
          ) : (
            <>
              <span>
                {currentMode === "signup" 
                  ? "Already have an account? " 
                  : "Don't have an account? "
                }
              </span>
              <button
                onClick={toggleMode}
                className="text-gray-800 hover:text-gray-900 text-sm font-bold"
              >
                {currentMode === "signup" ? 'Sign in' : 'Sign up'}
              </button>
              {currentMode === "signin" && (
                <div className="mt-2">
                  <button
                    onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                    className="text-gray-600 hover:text-gray-800 text-xs"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
