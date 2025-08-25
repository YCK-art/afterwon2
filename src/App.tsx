import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Topbar from './components/Topbar';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import './App.css';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const onGetStartedClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <Router>
      <div className="App">
        <Topbar onGetStartedClick={onGetStartedClick} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing onGetStartedClick={onGetStartedClick} />} />
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
                  <button className="login-btn google-btn">
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

export default App; 