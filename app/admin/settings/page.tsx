'use client';

import { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { signOut } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import config from '../../../amplify_outputs.json';
import { LogOut, Settings, Shield, Save } from "lucide-react";
import '../../dashboard/styles.css';
import '../dashboard/admin-styles.css';
import '../dashboard/fix-icons.css';
import { isAdmin } from '../../utils/auth';
import { useRouter } from 'next/navigation';

// Configure Amplify
Amplify.configure(config, {
  ssr: true
});

// Define admin settings type
interface AdminSettings {
  adminEmail: string;
  isAdminAccountCreated: boolean;
  isAdminRoleAssigned: boolean;
}

export default function AdminSettings() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [settings, setSettings] = useState<AdminSettings>({
    adminEmail: 'ryan.zillini@gauntletai.com',
    isAdminAccountCreated: false,
    isAdminRoleAssigned: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [client, setClient] = useState<ReturnType<typeof generateClient<Schema>> | null>(null);

  useEffect(() => {
    // Initialize the Amplify Data client
    const dataClient = generateClient<Schema>();
    setClient(dataClient);

    const checkAdminAndFetchData = async () => {
      try {
        // Check if user is admin
        const adminStatus = await isAdmin();
        if (!adminStatus) {
          router.push('/dashboard');
          return;
        }

        // Get admin email
        const attributes = await fetchUserAttributes();
        setAdminEmail(attributes.email || '');
        
        // Check admin account status
        await checkAdminAccountStatus(dataClient);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
        setMessage({ text: 'Error loading settings. Please try again.', type: 'error' });
      }
    };
    
    checkAdminAndFetchData();
  }, [router]);

  // Check admin account status
  const checkAdminAccountStatus = async (dataClient: ReturnType<typeof generateClient<Schema>>) => {
    try {
      const adminEmail = 'ryan.zillini@gauntletai.com';
      
      // Check if admin account exists
      const usersResponse = await dataClient.models.User.list({
        filter: {
          gauntletEmail: {
            eq: adminEmail
          }
        }
      });
      
      const isAccountCreated = usersResponse.data.length > 0;
      let isRoleAssigned = false;
      
      if (isAccountCreated) {
        const adminUser = usersResponse.data[0];
        isRoleAssigned = adminUser.role === 'ADMIN';
      }
      
      setSettings({
        adminEmail,
        isAdminAccountCreated: isAccountCreated,
        isAdminRoleAssigned: isRoleAssigned
      });
      
    } catch (error) {
      console.error('Error checking admin account status:', error);
      setMessage({ text: 'Error checking admin account status.', type: 'error' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEnsureAdminAccount = async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      setMessage({ text: 'Setting up admin account...', type: 'info' });
      
      const adminEmail = 'ryan.zillini@gauntletai.com';
      
      // Debug: Test API connection
      try {
        console.log('Testing API connection...');
        
        // Check if the User model exists
        if (!client.models.User) {
          console.error('User model does not exist in the API');
          setMessage({ 
            text: 'Error: User model does not exist in the API. You need to deploy your backend first.', 
            type: 'error' 
          });
          setIsLoading(false);
          return;
        }
        
        const testResponse = await client.models.User.list({ limit: 1 });
        console.log('API connection successful:', testResponse);
      } catch (apiError: any) {
        console.error('API connection test failed:', apiError);
        
        // Check for specific error messages
        const errorMessage = apiError?.message || 'Unknown error';
        if (errorMessage.includes('Cannot read properties of undefined')) {
          setMessage({ 
            text: 'Error: The API models are not properly deployed. Please run "amplify push" to deploy your backend.', 
            type: 'error' 
          });
        } else {
          setMessage({ text: `API connection error: ${errorMessage}`, type: 'error' });
        }
        
        setIsLoading(false);
        return;
      }
      
      console.log('Checking if admin account exists...');
      
      // Check if admin account already exists
      try {
        const usersResponse = await client.models.User.list({
          filter: {
            gauntletEmail: {
              eq: adminEmail
            }
          }
        });
        
        console.log('Admin account check response:', usersResponse);
        
        // If admin account doesn't exist, create it
        if (usersResponse.data.length === 0) {
          console.log('Admin account does not exist, creating...');
          
          try {
            const createResponse = await client.models.User.create({
              gauntletEmail: adminEmail,
              role: 'ADMIN',
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            });
            
            console.log('Admin account created successfully:', createResponse);
            
            setSettings({
              ...settings,
              isAdminAccountCreated: true,
              isAdminRoleAssigned: true
            });
            
            setMessage({ text: 'Admin account created successfully!', type: 'success' });
          } catch (createError: any) {
            console.error('Error creating admin account:', createError);
            setMessage({ 
              text: `Error creating admin account: ${createError?.message || 'Unknown error'}`, 
              type: 'error' 
            });
          }
        } else {
          console.log('Admin account exists, checking role...');
          
          // Ensure the existing account has admin role
          const adminUser = usersResponse.data[0];
          console.log('Existing admin user:', adminUser);
          
          if (adminUser.role !== 'ADMIN') {
            console.log('Updating user to admin role...');
            
            try {
              const updateResponse = await client.models.User.update({
                id: adminUser.id,
                role: 'ADMIN',
                status: 'ACTIVE'
              });
              
              console.log('User updated to admin role successfully:', updateResponse);
              
              setSettings({
                ...settings,
                isAdminRoleAssigned: true
              });
              
              setMessage({ text: 'Admin role assigned successfully!', type: 'success' });
            } catch (updateError: any) {
              console.error('Error updating user to admin role:', updateError);
              setMessage({ 
                text: `Error updating user role: ${updateError?.message || 'Unknown error'}`, 
                type: 'error' 
              });
            }
          } else {
            console.log('User already has admin role');
            setMessage({ text: 'Admin account is already set up correctly.', type: 'success' });
          }
        }
      } catch (checkError: any) {
        console.error('Error checking admin account:', checkError);
        setMessage({ 
          text: `Error checking admin account: ${checkError?.message || 'Unknown error'}`, 
          type: 'error' 
        });
      }
    } catch (error: any) {
      console.error('Error ensuring admin account:', error);
      setMessage({ 
        text: `Error setting up admin account: ${error?.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to seed test data
  const handleSeedTestData = async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      setMessage({ text: 'Seeding test data...', type: 'info' });
      
      // Check if the User model exists
      if (!client.models.User || !client.models.EmailForwarding) {
        console.error('Required models do not exist in the API');
        setMessage({ 
          text: 'Error: Required models do not exist in the API. You need to deploy your backend first.', 
          type: 'error' 
        });
        setIsLoading(false);
        return;
      }
      
      // Create test users
      const testUsers = [
        {
          gauntletEmail: 'test1@gauntletai.com',
          role: 'STUDENT' as 'STUDENT',
          status: 'ACTIVE' as 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          gauntletEmail: 'test2@gauntletai.com',
          role: 'STUDENT' as 'STUDENT',
          status: 'INACTIVE' as 'INACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          gauntletEmail: 'test3@gauntletai.com',
          role: 'STUDENT' as 'STUDENT',
          status: 'ACTIVE' as 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ];
      
      console.log('Creating test users...');
      
      // Create users one by one
      for (const userData of testUsers) {
        try {
          // Check if user already exists
          const existingUsers = await client.models.User.list({
            filter: {
              gauntletEmail: {
                eq: userData.gauntletEmail
              }
            }
          });
          
          if (existingUsers.data.length === 0) {
            // Create new user
            const newUserResponse = await client.models.User.create(userData);
            const newUser = newUserResponse.data;
            console.log(`Created test user: ${userData.gauntletEmail}`, newUser);
            
            // Create forwarding for active users
            if (userData.status === 'ACTIVE' && newUser) {
              const forwardingEmail = userData.gauntletEmail.replace('gauntletai.com', 'gmail.com');
              await client.models.EmailForwarding.create({
                userId: newUser.id,
                gauntletEmail: userData.gauntletEmail,
                forwardingEmail: forwardingEmail,
                status: 'ACTIVE' as 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              console.log(`Created forwarding for ${userData.gauntletEmail} to ${forwardingEmail}`);
            }
          } else {
            console.log(`User ${userData.gauntletEmail} already exists, skipping`);
          }
        } catch (error: any) {
          console.error(`Error creating test user ${userData.gauntletEmail}:`, error);
        }
      }
      
      // Fetch all users to verify
      try {
        const allUsers = await client.models.User.list();
        console.log(`Successfully fetched ${allUsers.data.length} users:`, allUsers);
        
        const allForwardings = await client.models.EmailForwarding.list();
        console.log(`Successfully fetched ${allForwardings.data.length} forwarding records:`, allForwardings);
        
        setMessage({ 
          text: `Successfully seeded test data. Users: ${allUsers.data.length}, Forwardings: ${allForwardings.data.length}`, 
          type: 'success' 
        });
      } catch (error: any) {
        console.error('Error fetching data after seeding:', error);
        setMessage({ 
          text: `Error verifying seeded data: ${error?.message || 'Unknown error'}`, 
          type: 'error' 
        });
      }
    } catch (error: any) {
      console.error('Error seeding test data:', error);
      setMessage({ 
        text: `Error seeding test data: ${error?.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Style tag to hide large SVG icons */}
      <style jsx global>{`
        body > svg,
        #__next > svg,
        .dashboard > svg,
        svg:not([class]),
        svg[width="100%"],
        svg[height="100%"] {
          display: none !important;
        }
      `}</style>
      
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo">GauntletAI</div>
        <div className="admin-nav-title">Admin Portal</div>
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-item">Dashboard</a>
          <a href="/admin/settings" className="admin-nav-item active">Settings</a>
        </nav>
        <div className="admin-signout" onClick={handleSignOut}>
          <LogOut className="admin-signout-icon" />
          Sign Out
        </div>
      </div>
      
      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Settings</h1>
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {adminEmail.charAt(0).toUpperCase()}
              </div>
              {adminEmail}
            </div>
          </div>
          <div>
            <Settings className="settings-icon" size={24} />
          </div>
        </div>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="settings-container">
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-card-title">
                <Shield className="settings-card-icon" />
                Admin Account Setup
              </h2>
            </div>
            <div className="settings-card-content">
              <div className="settings-item">
                <div className="settings-item-label">Admin Email</div>
                <div className="settings-item-value">{settings.adminEmail}</div>
              </div>
              
              <div className="settings-item">
                <div className="settings-item-label">Account Created</div>
                <div className="settings-item-value">
                  <span className={`status-badge ${settings.isAdminAccountCreated ? 'active' : 'inactive'}`}>
                    {settings.isAdminAccountCreated ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="settings-item">
                <div className="settings-item-label">Admin Role Assigned</div>
                <div className="settings-item-value">
                  <span className={`status-badge ${settings.isAdminRoleAssigned ? 'active' : 'inactive'}`}>
                    {settings.isAdminRoleAssigned ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="settings-actions">
                <button 
                  className="admin-button add-user-button"
                  onClick={handleEnsureAdminAccount}
                  disabled={settings.isAdminAccountCreated && settings.isAdminRoleAssigned}
                >
                  <Save className="button-icon" />
                  {settings.isAdminAccountCreated ? 'Ensure Admin Role' : 'Create Admin Account'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="settings-card">
            <div className="settings-card-header">
              <h2 className="settings-card-title">System Information</h2>
            </div>
            <div className="settings-card-content">
              <div className="settings-item">
                <div className="settings-item-label">Environment</div>
                <div className="settings-item-value">Production</div>
              </div>
              
              <div className="settings-item">
                <div className="settings-item-label">Region</div>
                <div className="settings-item-value">{config.data.aws_region}</div>
              </div>
              
              <div className="settings-item">
                <div className="settings-item-label">API Endpoint</div>
                <div className="settings-item-value">{config.data.url}</div>
              </div>
              
              <div className="settings-actions">
                <button 
                  className="admin-button import-button"
                  onClick={handleSeedTestData}
                >
                  Seed Test Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 