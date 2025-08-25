import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { FaApple, FaCheck } from 'react-icons/fa';
import { HiExternalLink } from 'react-icons/hi';
import '../App.css';

function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleGetStartedClick = () => {
    // 로그인 모달을 여는 로직 (필요시 구현)
    console.log('Get Started clicked');
  };

  return (
    <div className="App">
      <Topbar onGetStartedClick={handleGetStartedClick} />
      <main className="pricing-content">
        <div className="pricing-container">
          {/* Header Section */}
          <div className="pricing-header">
            <div className="pricing-title-section">
              <h1 className="pricing-main-title">Pricing</h1>
              <p className="pricing-subtitle">Choose the plan that works for you.</p>
            </div>
          </div>

          {/* Billing Toggle - 중앙 정렬 */}
          <div className="billing-toggle-container">
            <div className="billing-toggle">
              <button 
                className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                MONTHLY
              </button>
              <button 
                className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                YEARLY (SAVE 20%)
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-cards">
            {/* Hobby Plan */}
            <div className="pricing-card">
              <h3 className="plan-name">Hobby</h3>
              <div className="plan-price">
                {billingCycle === 'monthly' ? 'Free' : 'Free'}
              </div>
              <hr className="plan-divider" />
              <div className="plan-features">
                <p className="includes-text">Includes</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" /> Pro two-week trial</li>
                  <li><FaCheck className="check-icon" /> Limited Agent requests</li>
                  <li><FaCheck className="check-icon" /> Limited Tab completions</li>
                </ul>
              </div>
              <div className="plan-actions">
                <button className="action-btn primary-btn">
                  <FaApple className="btn-icon" />
                  Download
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card pro-card">
              <h3 className="plan-name">Pro</h3>
              <div className="plan-price">
                <span className="price-amount">{billingCycle === 'monthly' ? '$20' : '$16'}</span>
                <span className="price-period">/mo</span>
              </div>
              <hr className="plan-divider" />
              <div className="plan-features">
                <p className="includes-text">Everything in Hobby, plus</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" /> Extended limits on Agent</li>
                  <li><FaCheck className="check-icon" /> Unlimited Tab completions</li>
                  <li><FaCheck className="check-icon" /> Access to Background Agents</li>
                  <li><FaCheck className="check-icon" /> Access to Bugbot</li>
                  <li><FaCheck className="check-icon" /> Access to maximum context windows</li>
                </ul>
              </div>
              <div className="plan-actions">
                <button className="action-btn primary-btn">Get Pro</button>
              </div>
            </div>

            {/* Ultra Plan */}
            <div className="pricing-card">
              <h3 className="plan-name">Ultra</h3>
              <div className="plan-price">
                <span className="price-amount">{billingCycle === 'monthly' ? '$200' : '$160'}</span>
                <span className="price-period">/mo</span>
              </div>
              <hr className="plan-divider" />
              <div className="plan-features">
                <p className="includes-text">Everything in Pro, plus</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" /> 20x usage on all OpenAI, Claude, Gemini models</li>
                  <li><FaCheck className="check-icon" /> Priority access to new features</li>
                </ul>
              </div>
              <div className="plan-actions">
                <button className="action-btn primary-btn">Get Ultra</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Pricing; 