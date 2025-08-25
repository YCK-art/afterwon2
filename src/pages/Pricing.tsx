import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import '../App.css';

interface PricingProps {
  onGetStartedClick: () => void;
}

function Pricing({ onGetStartedClick }: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
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
                <button className="action-btn primary-btn" onClick={onGetStartedClick}>
                  Get Started
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card">
              <h3 className="plan-name">Pro</h3>
              <div className="plan-price">
                <span className="price-amount">${billingCycle === 'monthly' ? '20' : '16'}</span>
                <span className="price-period">/{billingCycle === 'monthly' ? 'month' : 'month'}</span>
              </div>
              <div className="plan-divider"></div>
              <div className="plan-features">
                <p className="includes-text">Everything in Hobby, plus:</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" />Advanced analytics</li>
                  <li><FaCheck className="check-icon" />Priority support</li>
                  <li><FaCheck className="check-icon" />Custom integrations</li>
                  <li><FaCheck className="check-icon" />Team collaboration</li>
                </ul>
              </div>
              <div className="plan-actions">
                <button className="action-btn primary-btn" onClick={onGetStartedClick}>
                  Get Pro
                </button>
              </div>
            </div>

            {/* Ultra Plan */}
            <div className="pricing-card">
              <h3 className="plan-name">Ultra</h3>
              <div className="plan-price">
                <span className="price-amount">${billingCycle === 'monthly' ? '49' : '39'}</span>
                <span className="price-period">/{billingCycle === 'monthly' ? 'month' : 'month'}</span>
              </div>
              <div className="plan-divider"></div>
              <div className="plan-features">
                <p className="includes-text">Everything in Pro, plus:</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" />Enterprise features</li>
                  <li><FaCheck className="check-icon" />Dedicated support</li>
                  <li><FaCheck className="check-icon" />Custom solutions</li>
                  <li><FaCheck className="check-icon" />Advanced security</li>
                </ul>
              </div>
              <div className="plan-actions">
                <button className="action-btn primary-btn" onClick={onGetStartedClick}>
                  Get Ultra
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}

export default Pricing; 