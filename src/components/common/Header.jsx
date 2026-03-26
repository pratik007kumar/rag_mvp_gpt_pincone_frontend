import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../utils/constants.js';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isLoggedIn, loading } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.SIGNIN);
  };

  // Don't show header while auth state is loading
  if (loading) {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] relative z-20">
        <h2 className="font-bold text-gray-800">Knowledge Base</h2>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] relative z-20">
      <h2 className="font-bold text-gray-800">Knowledge Base</h2>
      {isLoggedIn && user && (
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-700">{user?.full_name || user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="font-semibold text-white hover:text-white border-2 border-gray-900 px-4 py-1 rounded shadow-sm bg-gray-900 hover:bg-gray-800 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
