'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { signOut } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import config from '../../../amplify_outputs.json';
import { Mail, Search, LogOut, Plus, Download, Upload, Trash2, Edit, User } from "lucide-react";
import '../../dashboard/styles.css';
import './admin-styles.css';
import './fix-icons.css';
import { isAdmin } from '../../utils/auth';
import { useRouter } from 'next/navigation';

// Configure Amplify
Amplify.configure(config, {
  ssr: true
});

// Define user type based on the schema
interface UserType {
  id: string;
  gauntletEmail: string;
  role?: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  lastLoginAt?: string;
}

// Define email forwarding type based on the schema
interface EmailForwardingType {
  id: string;
  userId: string;
  gauntletEmail: string;
  forwardingEmail: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAt?: string;
  updatedAt?: string;
}

// Combined type for the UI
interface UserWithForwarding {
  id: string;
  gauntletEmail: string;
  forwardingEmail: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  forwardingId?: string;
}

// Mock data for development - will be replaced with real data
const mockUsers = [
  { id: '1', gauntletEmail: 'student1@gauntletai.com', forwardingEmail: 'personal1@gmail.com', status: 'ACTIVE' },
  { id: '2', gauntletEmail: 'student2@gauntletai.com', forwardingEmail: 'personal2@gmail.com', status: 'ACTIVE' },
  { id: '3', gauntletEmail: 'student3@gauntletai.com', forwardingEmail: '', status: 'INACTIVE' },
  { id: '4', gauntletEmail: 'student4@gauntletai.com', forwardingEmail: 'personal4@outlook.com', status: 'ACTIVE' },
  { id: '5', gauntletEmail: 'student5@gauntletai.com', forwardingEmail: 'personal5@yahoo.com', status: 'ACTIVE' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState('');
  const [users, setUsers] = useState<UserWithForwarding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithForwarding | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
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
        
        // Ensure admin account exists
        await ensureAdminAccount(dataClient);
        
        try {
          // Fetch users and email forwarding data
          await fetchUsersAndForwarding(dataClient);
        } catch (error) {
          console.error('Error fetching data, falling back to mock data:', error);
          // Fallback to mock data if API fails
          setUsers(mockUsers as UserWithForwarding[]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
        setMessage({ text: 'Error loading data. Please try again.', type: 'error' });
      }
    };
    
    checkAdminAndFetchData();
  }, [router]);

  // Ensure the admin account exists in the database
  const ensureAdminAccount = async (dataClient: ReturnType<typeof generateClient<Schema>>) => {
    try {
      const adminEmail = 'ryan.zillini@gauntletai.com';
      
      // Check if admin account already exists
      const usersResponse = await dataClient.models.User.list({
        filter: {
          gauntletEmail: {
            eq: adminEmail
          }
        }
      });
      
      // If admin account doesn't exist, create it
      if (usersResponse.data.length === 0) {
        console.log('Creating admin account for', adminEmail);
        await dataClient.models.User.create({
          gauntletEmail: adminEmail,
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
        console.log('Admin account created successfully');
      } else {
        console.log('Admin account already exists');
        
        // Ensure the existing account has admin role
        const adminUser = usersResponse.data[0];
        if (adminUser.role !== 'ADMIN') {
          console.log('Updating user to admin role');
          await dataClient.models.User.update({
            id: adminUser.id,
            role: 'ADMIN',
            status: 'ACTIVE'
          });
          console.log('User updated to admin role successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring admin account:', error);
    }
  };

  // Fetch users and email forwarding data from the database
  const fetchUsersAndForwarding = async (dataClient: ReturnType<typeof generateClient<Schema>>) => {
    try {
      // Fetch all users
      const usersResponse = await dataClient.models.User.list();
      // Cast the response data to any first to avoid TypeScript errors with the Amplify types
      const usersData = usersResponse.data as any[] as UserType[];
      
      // Fetch all email forwarding records
      const forwardingResponse = await dataClient.models.EmailForwarding.list();
      // Cast the response data to any first to avoid TypeScript errors with the Amplify types
      const forwardingData = forwardingResponse.data as any[] as EmailForwardingType[];
      
      // Create a map of email forwarding records by gauntlet email
      const forwardingMap = new Map<string, EmailForwardingType>();
      forwardingData.forEach(forwarding => {
        forwardingMap.set(forwarding.gauntletEmail, forwarding);
      });
      
      // Combine user and forwarding data
      const combinedData: UserWithForwarding[] = usersData.map(user => {
        const forwarding = forwardingMap.get(user.gauntletEmail);
        return {
          id: user.id,
          gauntletEmail: user.gauntletEmail,
          forwardingEmail: forwarding?.forwardingEmail || '',
          status: user.status,
          forwardingId: forwarding?.id
        };
      });
      
      setUsers(combinedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
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

  const handleAddUser = async () => {
    if (!newUserEmail || !client) return;
    
    try {
      setIsLoading(true);
      
      // Create the email with proper format
      const email = newUserEmail.includes('@') ? newUserEmail : `${newUserEmail}@gauntletai.com`;
      
      // Create new user in the database
      const newUser = await client.models.User.create({
        gauntletEmail: email,
        role: 'STUDENT',
        status: 'INACTIVE',
        createdAt: new Date().toISOString()
      });
      
      // Refresh the user list
      await fetchUsersAndForwarding(client);
      
      setNewUserEmail('');
      setShowAddUserDialog(false);
      setMessage({ text: 'User added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage({ text: 'Error adding user. Please try again.', type: 'error' });
      
      // Fallback to local state update if API fails
      if (newUserEmail) {
        const email = newUserEmail.includes('@') ? newUserEmail : `${newUserEmail}@gauntletai.com`;
        const newUser: UserWithForwarding = {
          id: String(users.length + 1),
          gauntletEmail: email,
          forwardingEmail: '',
          status: 'INACTIVE'
        };
        setUsers([...users, newUser]);
        setNewUserEmail('');
        setShowAddUserDialog(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: UserWithForwarding) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !client) return;
    
    try {
      setIsLoading(true);
      
      // Update user status if needed
      if (editingUser.status === 'ACTIVE' || editingUser.status === 'INACTIVE') {
        await client.models.User.update({
          id: editingUser.id,
          status: editingUser.status
        });
      }
      
      // Handle forwarding email update
      if (editingUser.forwardingId) {
        // Update existing forwarding record
        const forwardingStatus = editingUser.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE';
        await client.models.EmailForwarding.update({
          id: editingUser.forwardingId,
          forwardingEmail: editingUser.forwardingEmail,
          status: forwardingStatus,
          updatedAt: new Date().toISOString()
        });
      } else if (editingUser.forwardingEmail) {
        // Create new forwarding record if email is provided
        const forwardingStatus = editingUser.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE';
        await client.models.EmailForwarding.create({
          userId: editingUser.id,
          gauntletEmail: editingUser.gauntletEmail,
          forwardingEmail: editingUser.forwardingEmail,
          status: forwardingStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Refresh the user list
      await fetchUsersAndForwarding(client);
      
      setEditingUser(null);
      setMessage({ text: 'User updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ text: 'Error updating user. Please try again.', type: 'error' });
      
      // Fallback to local state update if API fails
      if (editingUser) {
        const updatedUsers = users.map(user => 
          user.id === editingUser.id ? editingUser : user
        );
        setUsers(updatedUsers);
        setEditingUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      
      // Find the user to get their email
      const userToDelete = users.find(user => user.id === userId);
      if (!userToDelete) {
        throw new Error('User not found');
      }
      
      // Delete forwarding record if it exists
      if (userToDelete.forwardingId) {
        await client.models.EmailForwarding.delete({
          id: userToDelete.forwardingId
        });
      }
      
      // Delete the user
      await client.models.User.delete({
        id: userId
      });
      
      // Refresh the user list
      await fetchUsersAndForwarding(client);
      
      setMessage({ text: 'User deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ text: 'Error deleting user. Please try again.', type: 'error' });
      
      // Fallback to local state update if API fails
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportEmails = async () => {
    if (!importText || !client) return;
    
    try {
      setIsLoading(true);
      
      // Parse the imported emails (one per line)
      const emails = importText.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('@'));
      
      // Create new users from the emails
      const creationPromises = emails.map(async (email) => {
        return client.models.User.create({
          gauntletEmail: email,
          role: 'STUDENT',
          status: 'INACTIVE',
          createdAt: new Date().toISOString()
        });
      });
      
      // Wait for all users to be created
      await Promise.all(creationPromises);
      
      // Refresh the user list
      await fetchUsersAndForwarding(client);
      
      setImportText('');
      setShowImportDialog(false);
      setMessage({ text: `${emails.length} users imported successfully!`, type: 'success' });
    } catch (error) {
      console.error('Error importing users:', error);
      setMessage({ text: 'Error importing users. Please try again.', type: 'error' });
      
      // Fallback to local state update if API fails
      if (importText) {
        const emails = importText.split('\n')
          .map(line => line.trim())
          .filter(line => line && line.includes('@'));
        
        const newUsers: UserWithForwarding[] = emails.map((email, index) => ({
          id: String(users.length + index + 1),
          gauntletEmail: email,
          forwardingEmail: '',
          status: 'INACTIVE'
        }));
        
        setUsers([...users, ...newUsers]);
        setImportText('');
        setShowImportDialog(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportUsers = () => {
    // Create CSV content
    const csvContent = [
      'ID,Gauntlet Email,Forwarding Email,Status',
      ...users.map(user => `${user.id},${user.gauntletEmail},${user.forwardingEmail},${user.status}`)
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gauntlet-users.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => 
    user.gauntletEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.forwardingEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--background-color);
        }
        
        .admin-sidebar {
          width: 250px;
          background-color: var(--card-bg);
          padding: 20px 0;
          display: flex;
          flex-direction: column;
        }
        
        .admin-logo {
          font-size: 28px;
          font-weight: bold;
          padding: 0 20px 20px;
          color: white;
        }
        
        .admin-nav {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        
        .admin-nav-title {
          font-size: 16px;
          padding: 10px 20px;
          color: white;
        }
        
        .admin-nav-item {
          padding: 12px 20px;
          color: white;
          text-decoration: none;
          font-size: 18px;
          transition: background-color 0.2s;
        }
        
        .admin-nav-item:hover, .admin-nav-item.active {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .admin-signout {
          padding: 12px 20px;
          margin-top: auto;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .admin-signout-icon {
          margin-right: 10px;
        }
        
        .admin-content {
          flex-grow: 1;
          padding: 20px;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .admin-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .admin-search {
          width: 100%;
          max-width: 300px;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background-color: var(--card-bg);
          color: white;
        }
        
        .admin-user-info {
          display: flex;
          align-items: center;
          margin-top: 10px;
        }
        
        .admin-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-weight: bold;
        }
      `}</style>
      
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo">GauntletAI</div>
        <div className="admin-nav-title">Admin Portal</div>
        <nav className="admin-nav">
          <a href="/admin/dashboard" className="admin-nav-item active">Dashboard</a>
          <a href="/admin/settings" className="admin-nav-item">Settings</a>
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
            <h1 className="admin-title">Admin Dashboard</h1>
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {adminEmail.charAt(0).toUpperCase()}
              </div>
              {adminEmail}
            </div>
          </div>
          <div>
            <input 
              type="text" 
              placeholder="Search" 
              className="admin-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="admin-notifications">
              Notifications
            </div>
          </div>
        </div>
        
        {message.text && (
          <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}
        
        <div className="users-table-container">
          <div className="admin-actions">
            <button 
              className="admin-button import-button"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="button-icon" />
              Import Users
            </button>
            <button 
              className="admin-button export-button"
              onClick={handleExportUsers}
            >
              <Download className="button-icon" />
              Export Users
            </button>
            <button 
              className="admin-button add-user-button"
              onClick={() => setShowAddUserDialog(true)}
            >
              <Plus className="button-icon" />
              Add User
            </button>
          </div>
          
          <table className="users-table">
            <thead>
              <tr>
                <th>Gauntlet Email</th>
                <th>Forwarding Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={user.status === 'INACTIVE' ? 'inactive-user' : ''}>
                  <td>{user.gauntletEmail}</td>
                  <td>{user.forwardingEmail || '—'}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-button edit-button"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="action-icon" />
                      </button>
                      <button 
                        className="action-button delete-button"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="no-results">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add User Dialog */}
      {showAddUserDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3 className="dialog-title">Add New User</h3>
              <p className="dialog-description">Create a new user account (admin-only)</p>
            </div>
            <div className="dialog-content">
              <label htmlFor="new-user-email" className="dialog-label">
                Email Address
              </label>
              <div className="email-input-group">
                <input
                  id="new-user-email"
                  type="text"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="username"
                  className="email-input"
                />
                {!newUserEmail.includes('@') && (
                  <div className="email-domain">
                    @gauntletai.com
                  </div>
                )}
              </div>
              <p className="dialog-help">
                Enter a complete email or just the username (without @gauntletai.com).<br />
                Note: This will create an account that the user can activate later.
              </p>
            </div>
            <div className="dialog-footer">
              <button 
                onClick={() => setShowAddUserDialog(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddUser}
                className="create-button"
                disabled={!newUserEmail}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Dialog */}
      {editingUser && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3 className="dialog-title">Edit User</h3>
              <p className="dialog-description">{editingUser.gauntletEmail}</p>
            </div>
            <div className="dialog-content">
              <div className="form-group">
                <label className="dialog-label">Forwarding Email</label>
                <input
                  type="email"
                  value={editingUser.forwardingEmail}
                  onChange={(e) => setEditingUser({...editingUser, forwardingEmail: e.target.value})}
                  placeholder="personal@example.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="dialog-label">Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({...editingUser, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'PAUSED'})}
                  className="form-select"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                </select>
              </div>
            </div>
            <div className="dialog-footer">
              <button 
                onClick={() => setEditingUser(null)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="create-button"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Users Dialog */}
      {showImportDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <h3 className="dialog-title">Import Users</h3>
              <p className="dialog-description">Bulk create user accounts (admin-only)</p>
            </div>
            <div className="dialog-content">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="user1@gauntletai.com&#10;user2@gauntletai.com&#10;user3@gauntletai.com"
                className="import-textarea"
                rows={10}
              />
              <p className="dialog-help">
                Paste email addresses, one per line. Each email will be registered as a new user account.<br />
                Users will need to activate their accounts later.
              </p>
            </div>
            <div className="dialog-footer">
              <button 
                onClick={() => setShowImportDialog(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleImportEmails}
                className="create-button"
                disabled={!importText}
              >
                Import Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 