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
            {/* Free Plan */}
            <div className="pricing-card">
              <h3 className="plan-name">Free</h3>
              <div className="plan-price">
                {billingCycle === 'monthly' ? '$0' : '$0'}
              </div>
              <hr className="plan-divider" />
              <div className="plan-features">
                <p className="includes-text">Includes</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" /> 20 messages / month</li>
                  <li><FaCheck className="check-icon" /> Up to 5MB per file</li>
                  <li><FaCheck className="check-icon" /> Basic AI insights</li>
                  <li><FaCheck className="check-icon" /> Standard chart templates</li>
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
                <p className="includes-text">Everything in Free, plus:</p>
                <ul className="features-list">
                  <li><FaCheck className="check-icon" /> 300 messages / month</li>
                  <li><FaCheck className="check-icon" /> Saved prompts & dashboards</li>
                  <li><FaCheck className="check-icon" /> Faster processing speed</li>
                  <li><FaCheck className="check-icon" /> Advanced chart options</li>
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
                  <li><FaCheck className="check-icon" /> Unlimited messages</li>
                  <li><FaCheck className="check-icon" /> Team workspaces & collaboration</li>
                  <li><FaCheck className="check-icon" /> 30-day file storage & version history</li>
                  <li><FaCheck className="check-icon" /> User roles & permissions</li>
                  <li><FaCheck className="check-icon" /> Priority support</li>
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