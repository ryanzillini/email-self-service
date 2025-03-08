'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { isAdmin, ensureUserInDatabase } from '../utils/auth';
import { ensureAmplifyConfigured } from '../utils/amplify-config';

// Ensure Amplify is configured
ensureAmplifyConfigured();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        await getCurrentUser();
        setIsAuthenticated(true);
        
        // Ensure user exists in database
        try {
          await ensureUserInDatabase();
        } catch (dbError) {
          console.error('Error ensuring user in database:', dbError);
          // Continue even if database operation fails
        }
        
        // If no specific roles are required, grant access
        if (allowedRoles.length === 0) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }
        
        // Check if admin role is required and user is admin
        if (allowedRoles.includes('ADMIN')) {
          try {
            const adminStatus = await isAdmin();
            if (adminStatus) {
              setHasAccess(true);
              setIsLoading(false);
              return;
            }
          } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            // Continue with other role checks
          }
        }
        
        // If we get here and admin was required, user doesn't have access
        if (allowedRoles.includes('ADMIN')) {
          setHasAccess(false);
          setIsLoading(false);
          router.push('/unauthorized');
          return;
        }
        
        // For student role, we assume all authenticated users are at least students
        if (allowedRoles.includes('STUDENT')) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }
        
        // Default: no access
        setHasAccess(false);
        setIsLoading(false);
        router.push('/unauthorized');
      } catch (error) {
        console.error('Authentication error:', error);
        setError('Authentication failed. Please sign in again.');
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (!hasAccess) {
    return null; // Will redirect to unauthorized in useEffect
  }

  return <>{children}</>;
} 