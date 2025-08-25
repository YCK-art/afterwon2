import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiBars3, HiXMark } from 'react-icons/hi2';
import './Topbar.css';

interface TopbarProps {
  onGetStartedClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onGetStartedClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUseCasesExpanded, setIsUseCasesExpanded] = useState(false);

  const handleUseCasesHover = () => {
    if (window.innerWidth > 800) {
      setIsExpanded(true);
    }
  };

  const handleUseCasesLeave = () => {
    if (window.innerWidth > 800) {
      setIsExpanded(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUseCasesExpanded(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsUseCasesExpanded(false);
  };

  const toggleUseCases = () => {
    setIsUseCasesExpanded(!isUseCasesExpanded);
  };

  const handleUseCasesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleUseCases();
  };

  return (
    <nav className={`topbar ${isExpanded ? 'expanded' : ''}`}>
      <div className="topbar-container">
        {/* 로고 */}
        <div className="logo">
          <Link to="/" className="logo-link" onClick={closeMobileMenu}>
            <span className="logo-text">afterwon</span>
          </Link>
        </div>

        {/* 햄버거 메뉴 버튼 (모바일) */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <HiXMark /> : <HiBars3 />}
        </button>

        {/* 네비게이션 메뉴 */}
        <div className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-item" onMouseEnter={handleUseCasesHover} onMouseLeave={handleUseCasesLeave}>
            <button className="nav-link use-cases-toggle" onClick={handleUseCasesClick}>
              <span className="nav-label">Use Cases</span>
            </button>
            <div className={`dropdown-menu ${isUseCasesExpanded ? 'expanded' : ''}`}>
              <div className="dropdown-columns">
                <div className="dropdown-column">
                  <ul className="dropdown-list">
                    <li><a href="#consulting" onClick={closeMobileMenu}>Consulting</a></li>
                    <li><a href="#product-teams" onClick={closeMobileMenu}>Product Teams</a></li>
                    <li><a href="#marketing" onClick={closeMobileMenu}>Marketing</a></li>
                  </ul>
                </div>
                <div className="dropdown-column">
                  <ul className="dropdown-list">
                    <li><a href="#research" onClick={closeMobileMenu}>Research</a></li>
                    <li><a href="#education" onClick={closeMobileMenu}>Education</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Link to="/pricing" className="nav-link" onClick={closeMobileMenu}>
            <span className="nav-label">Pricing</span>
          </Link>
          <a href="#careers" className="nav-link" onClick={closeMobileMenu}>
            <span className="nav-label">Careers</span>
          </a>
          <a href="#help-center" className="nav-link" onClick={closeMobileMenu}>
            <span className="nav-label">Help Center</span>
          </a>
          
          {/* 모바일 메뉴 하단의 Get Started 버튼 */}
          <div className="mobile-cta-section">
            <button className="get-started-btn mobile" onClick={onGetStartedClick}>
              Get Started
            </button>
          </div>
        </div>

        {/* Get Started 버튼 (데스크톱) */}
        <div className="cta-section">
          <button className="get-started-btn" onClick={onGetStartedClick}>
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Topbar; 