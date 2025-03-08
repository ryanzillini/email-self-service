'use client';

import { useState, useEffect } from 'react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureAmplifyConfigured } from '../utils/amplify-config';

// Ensure Amplify is configured
ensureAmplifyConfigured();

// Define interfaces for our data
interface EmailForwarding {
  id: string;
  gauntletEmail: string;
  forwardingEmail: string;
  status: 'ACTIVE' | 'PAUSED';
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [forwardingEmails, setForwardingEmails] = useState<EmailForwarding[]>([]);
  const [newEmail, setNewEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data and forwarding emails on component mount
  useEffect(() => {
    async function loadUserData() {
      try {
        // Get user attributes from Cognito
        const userAttributes = await fetchUserAttributes();
        const email = userAttributes.email || '';
        setUserEmail(email);
        
        // Load forwarding emails from localStorage
        const storedEmails = localStorage.getItem(`forwarding-emails-${email}`);
        if (storedEmails) {
          setForwardingEmails(JSON.parse(storedEmails));
        } else {
          // Initialize with empty array if no data exists
          setForwardingEmails([]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Save forwarding emails to localStorage whenever they change
  useEffect(() => {
    if (userEmail && forwardingEmails.length > 0) {
      localStorage.setItem(`forwarding-emails-${userEmail}`, JSON.stringify(forwardingEmails));
    }
  }, [forwardingEmails, userEmail]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving settings:', forwardingEmails);
      
      // In a real implementation, we would save to a database
      // For now, we're just using localStorage which is handled by the useEffect
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail) return;
    
    // Simple validation
    if (!newEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Check for duplicates
    if (forwardingEmails.some(email => email.forwardingEmail === newEmail)) {
      alert('This email is already in your list');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create a new forwarding email
      const newForwardingEmail: EmailForwarding = {
        id: Date.now().toString(), // Simple ID generation
        gauntletEmail: userEmail,
        forwardingEmail: newEmail,
        status: 'ACTIVE'
      };
      
      // Add the new email to the state
      setForwardingEmails([...forwardingEmails, newForwardingEmail]);
      setNewEmail('');
    } catch (error) {
      console.error('Error adding email:', error);
      alert('Failed to add email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = async (id: string) => {
    try {
      setIsSaving(true);
      
      // Remove the email from the state
      setForwardingEmails(forwardingEmails.filter(email => email.id !== id));
    } catch (error) {
      console.error('Error removing email:', error);
      alert('Failed to remove email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      // Find the email to toggle
      const emailToToggle = forwardingEmails.find(email => email.id === id);
      if (!emailToToggle) return;
      
      // Toggle the status
      const newStatus = emailToToggle.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      
      // Update the state
      setForwardingEmails(
        forwardingEmails.map(email => 
          email.id === id ? { ...email, status: newStatus } : email
        )
      );
    } catch (error) {
      console.error('Error toggling email status:', error);
      alert('Failed to update email status. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect happens automatically due to Amplify's auth configuration
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Forwarding Dashboard</h1>
        <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Gauntlet Email</CardTitle>
          <CardDescription>This is your primary Gauntlet email address</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{userEmail}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Forwarding Email Addresses</CardTitle>
          <CardDescription>
            Add email addresses where you want to receive emails sent to your Gauntlet address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forwardingEmails.length > 0 ? (
              forwardingEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${email.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>{email.forwardingEmail}</span>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(email.id)}
                    >
                      {email.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRemoveEmail(email.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No forwarding emails added yet.</p>
            )}
            
            <div className="flex space-x-2 mt-4">
              <div className="flex-1">
                <Label htmlFor="new-email" className="sr-only">New Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Add new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleAddEmail} disabled={isSaving}>Add Email</Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Development Mode</h3>
        <p className="text-yellow-700">
          This application is currently using localStorage for data storage. To implement with Amplify Data:
        </p>
        <ol className="list-decimal ml-5 mt-2 text-yellow-700">
          <li className="mb-1">Deploy the EmailForwarding model to the backend using <code className="bg-yellow-100 px-1 rounded">npx ampx sandbox</code> (requires AWS credentials)</li>
          <li className="mb-1">Update the amplify_outputs.json file to include the EmailForwarding model</li>
          <li className="mb-1">Replace the localStorage implementation with Amplify Data client calls</li>
        </ol>
      </div>
    </div>
  );
} 