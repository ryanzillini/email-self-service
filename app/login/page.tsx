'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import { ensureAmplifyConfigured } from '../utils/amplify-config';

// Ensure Amplify is configured
ensureAmplifyConfigured();

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        // If we get here, user is authenticated, redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        // User is not authenticated, show login form
        console.log('User not authenticated');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">GauntletAI Email Forwarding</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your email forwarding settings
          </p>
        </div>
        
        <Authenticator>
          {({ signOut }) => (
            <div className="mt-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  You are signed in! Redirecting to dashboard...
                </p>
                <button
                  onClick={signOut}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </Authenticator>
      </div>
    </div>
  );
} 