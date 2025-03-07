'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { signOut } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import config from '../../amplify_outputs.json';
import { Mail, Search, Home, User, Shield, LogOut, Plus } from "lucide-react";
import './styles.css';

// Configure Amplify
Amplify.configure(config, {
  ssr: true
});

export default function StudentDashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [forwardingEmail, setForwardingEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAddEmailDialog, setShowAddEmailDialog] = useState(false);
  const [newGauntletEmail, setNewGauntletEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email || '');
        
        // For now, we'll use mock data instead of fetching from the database
        setForwardingEmail('');
        setIsActive(true);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      // For now, we'll just simulate a successful save
      setTimeout(() => {
        setMessage({ 
          text: 'Email forwarding settings saved successfully!', 
          type: 'success' 
        });
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        text: 'Error saving settings. Please try again.', 
        type: 'error' 
      });
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login'; // Redirect to login page after sign out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddEmail = () => {
    // This would handle the creation of a new Gauntlet email
    // For now, just close the dialog
    setShowAddEmailDialog(false);
    setNewGauntletEmail('');
    // Here you would add the API call to create a new email
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="logo-container">
            <div className="logo-icon">
              <Mail className="icon" />
            </div>
            <span className="logo-text">GauntletAI</span>
          </div>
          
          <div className="search-container">
            <div className="search-box">
              <Search className="search-icon" />
              <input 
                type="text" 
                placeholder="Search" 
                className="search-input"
              />
            </div>
          </div>
          
          <nav className="nav-menu">
            <ul className="nav-list">
              <li className="nav-item">
                <a href="#" className="nav-link">
                  <Home className="nav-icon" />
                  Dashboard
                </a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link">
                  <User className="nav-icon" />
                  Profile
                </a>
              </li>
              <li className="nav-item active">
                <a href="#" className="nav-link">
                  <Shield className="nav-icon active-icon" />
                  Account Security
                </a>
              </li>
            </ul>
          </nav>
          
          <div className="signout-container">
            <button
              onClick={handleSignOut}
              className="signout-button"
            >
              <LogOut className="signout-icon" />
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="main-content">
          <h1 className="page-title">Account Security</h1>
          
          <div className="section">
            <h2 className="section-title">Account Information</h2>
            
            <div className="info-container">
              <div className="info-item">
                <div>
                  <label className="info-label">Email address</label>
                  <p className="info-value">{userEmail}</p>
                  <p className="info-help">If you need to change your email address, please contact Support</p>
                </div>
              </div>
              
              <div className="info-item">
                <div className="form-group">
                  <label htmlFor="forwarding-email" className="info-label">Forward To</label>
                  <input
                    id="forwarding-email"
                    type="email"
                    value={forwardingEmail}
                    onChange={(e) => setForwardingEmail(e.target.value)}
                    placeholder="your-personal@email.com"
                    className="form-input"
                  />
                  <p className="info-help">Enter the email address where you want to receive forwarded emails</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Gauntlet Emails</h2>
              <button 
                onClick={() => setShowAddEmailDialog(true)}
                className="add-button"
              >
                <Plus className="add-icon" />
              </button>
            </div>
            
            <div className="email-card">
              <div className="email-card-content">
                <div>
                  <p className="email-address">{userEmail}</p>
                  <p className="email-type">Primary Gauntlet Email</p>
                </div>
                <div className="toggle-container">
                  <span className="toggle-label">Active</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="actions">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          
          {message.text && (
            <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
      
      {showAddEmailDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3 className="dialog-title">Create New Gauntlet Email</h3>
              <p className="dialog-description">Add a new email address to your Gauntlet account.</p>
            </div>
            <div className="dialog-content">
              <label htmlFor="new-email" className="dialog-label">
                New Email Address
              </label>
              <div className="email-input-group">
                <input
                  id="new-email"
                  type="text"
                  value={newGauntletEmail}
                  onChange={(e) => setNewGauntletEmail(e.target.value)}
                  placeholder="yourname"
                  className="email-input"
                />
                <div className="email-domain">
                  @gauntletai.com
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button 
                onClick={() => setShowAddEmailDialog(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEmail}
                className="create-button"
              >
                Create Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 