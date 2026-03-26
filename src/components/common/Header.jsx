import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES, APP_NAME } from '../../utils/constants.js';
import WorkspaceSelector from '../workspace/WorkspaceSelector.jsx';
import ChangePassword from '../auth/ChangePassword.jsx';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isLoggedIn, loading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.SIGNIN);
  };

  // Don't show header while auth state is loading
  if (loading) {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] relative z-20">
        <h2 className="font-bold text-gray-800">{APP_NAME}</h2>
      </header>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] relative z-20">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-gray-800">{APP_NAME}</h2>
          {isLoggedIn() && <WorkspaceSelector />}
        </div>
        {isLoggedIn() && user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-700 text-sm">{user?.full_name || user?.email}</span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden py-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm text-gray-700 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowChangePassword(true); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
};

export default Header;
