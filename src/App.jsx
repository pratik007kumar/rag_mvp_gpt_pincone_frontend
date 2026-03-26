import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ROUTES } from './utils/constants.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
import Header from './components/common/Header.jsx';
import Auth from './components/auth/Auth.jsx';
import Chat from './components/chat/Chat.jsx';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate(ROUTES.SIGNIN, { replace: true });
    }
  }, [isLoggedIn, navigate]);
  
  return isLoggedIn() ? children : null;
};

const PublicRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLoggedIn()) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isLoggedIn, navigate]);
  
  return !isLoggedIn() ? children : null;
};

function AppContent() {
  return (
    <WorkspaceProvider>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path={ROUTES.SIGNIN} element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path={ROUTES.HOME} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </WorkspaceProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
