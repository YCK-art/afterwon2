import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Topbar from './components/Topbar';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { currentUser, signInWithGoogle } = useAuth();

  const onGetStartedClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
      // 로그인 성공 후 대시보드로 이동
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      alert('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };



  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <Topbar onGetStartedClick={onGetStartedClick} />
              <Home />
            </>
          } />
          <Route path="/pricing" element={
            <>
              <Topbar onGetStartedClick={onGetStartedClick} />
              <Pricing onGetStartedClick={onGetStartedClick} />
            </>
          } />
          <Route 
            path="/dashboard" 
            element={currentUser ? <Dashboard /> : <Navigate to="/" replace />} 
          />
        </Routes>
        
        {/* 로그인 모달 */}
        {showLoginModal && (
          <div className="login-modal-overlay" onClick={handleCloseModal}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={handleCloseModal}>
                ✕
              </button>
              
              <div className="login-content">
                <h2 className="login-title">
                  Sign up and turn <span className="italic">every dataset</span> into a <span className="italic">win</span>.
                </h2>
                
                <p className="login-subtitle">
                  By continuing, you agree to our <a href="#privacy" className="privacy-link">Privacy Policy</a>.
                </p>
                
                <div className="login-options">
                  <button className="login-btn google-btn" onClick={handleGoogleLogin}>
                    <span className="btn-icon">G</span>
                    Continue with Google
                  </button>
                  
                  <button className="login-btn apple-btn">
                    <span className="btn-icon">A</span>
                    Continue with Apple
                  </button>
                  
                  <div className="email-section">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="email-input"
                    />
                    <button className="login-btn email-btn">
                      Continue with Email
                    </button>
                  </div>
                  
                  <p className="sso-text">Single Sign-On (SSO)</p>
                  
                  <button className="close-text-btn" onClick={handleCloseModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 