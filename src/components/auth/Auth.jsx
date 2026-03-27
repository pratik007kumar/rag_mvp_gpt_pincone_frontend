import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../utils/constants.js';
import './auth.css';
import bgImage from '../../images/sign-in-bg.jpg';


const Auth = ({ mode = "signin" }) => {
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
  const [successMessage, setSuccessMessage] = useState('');

  const { login, signup, loading, error, user, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || ROUTES.HOME;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    const result = isSignup
      ? await signup(formData)
      : await login(formData);

    if (result.success) {
      if (isSignup) {
        // For signup, show verification message, don't navigate
        setSuccessMessage(result.message || 'Please check your email to verify your account');
      } else {
        // For login, navigate to home page
        navigate(from, { replace: true });
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    const newMode = !isSignup;
    setIsSignup(newMode);
    setSuccessMessage('');
    clearError();
    setFormData({ email: '', password: '', full_name: '' });

    // Navigate to the correct URL
    navigate(newMode ? ROUTES.SIGNUP : ROUTES.SIGNIN);
  };

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="signInForm bg-gray-200 flex items-center justify-center px-4 h-full" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.25)] p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isSignup ? 'Create Account' : 'Sign In'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
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
                required={isSignup}
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
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">
            {isSignup
              ? 'Already have an account? '
              : "Don't have an account? "
            }
          </span>
          <button
            onClick={toggleMode}
            className="linkBtn text-gray-800 hover:text-gray-900 text-sm font-bold"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
