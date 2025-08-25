import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { FaGoogle, FaApple } from 'react-icons/fa';

function Home() {
  const [activeTab, setActiveTab] = useState('tab1');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleGetStartedClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <Topbar onGetStartedClick={handleGetStartedClick} />
      <main className="main-content">
        <div className="content-wrapper">
          <div className="hero-section">
            <h1 className="main-title">
              <span className="title-line-1">Once your data</span>
              <span className="title-line-2">takes <span className="alkia-font">shape</span>.</span>
            </h1>
            <p className="subtitle">afterwon is a AI data building intelligent to transform raw data into clear, decisive victories.</p>
            <div className="tags-container">
              <span className="tag">AI Data Copilot</span>
              <span className="tag">Visualization</span>
              <span className="tag">Smart Chart</span>
            </div>
          </div>
          <div className="media-container">
            {/* 사진자료를 위한 틀 */}
            <div className="media-placeholder">
              <img src="/video/main.gif" alt="Main Animation" className="main-gif" />
            </div>
          </div>
        </div>
      </main>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-grid">
            <div className="feature-item large">
              <div className="features-header">
                <p className="features-subtitle">Start and Win Instantly</p>
                <h2 className="features-title">Upload your data and get clear insights in seconds-no setup, no limits</h2>
              </div>
              <div className="feature-image">
                <div className="segment-controls">
                  <button 
                    className={`segment-btn ${activeTab === 'tab1' ? 'active' : ''}`}
                    onClick={() => handleTabClick('tab1')}
                  >
                    Instant Insights
                  </button>
                  <button 
                    className={`segment-btn ${activeTab === 'tab2' ? 'active' : ''}`}
                    onClick={() => handleTabClick('tab2')}
                  >
                    Beautiful UI
                  </button>
                  <button 
                    className={`segment-btn ${activeTab === 'tab3' ? 'active' : ''}`}
                    onClick={() => handleTabClick('tab3')}
                  >
                    Smarter over time
                  </button>
                </div>
                <div className="image-placeholder large"></div>
              </div>
            </div>
            <div className="feature-item small">
              <div className="features-header">
                <p className="features-subtitle">Beautiful Insights that go deeper</p>
                <h2 className="features-title">Turn data into stunning visuals, and switch to Python,<br />R, or SQL anytime for advanced analysis</h2>
              </div>
              <div className="feature-image">
                <div className="image-placeholder small"></div>
              </div>
            </div>
            <div className="feature-item small">
              <div className="features-header">
                <p className="features-subtitle">Smarter with every step</p>
                <h2 className="features-title">Afterwon remembers your context and workflow,<br />so each decision gets faster and sharper over time.</h2>
              </div>
              <div className="feature-image">
                <div className="image-placeholder small"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
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
                  <FaGoogle className="btn-icon" />
                  Continue with Google
                </button>
                
                <button className="login-btn apple-btn">
                  <FaApple className="btn-icon" />
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
    </>
  );
}

export default Home; 