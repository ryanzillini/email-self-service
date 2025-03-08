'use client';

import { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';

export function Header() {
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const attributes = await fetchUserAttributes();
        if (attributes.name) {
          setUserName(attributes.name);
        } else if (attributes.email) {
          setUserEmail(attributes.email);
          setUserName(attributes.email.split('@')[0]);
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    
    getUserInfo();
  }, []);

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search"
            />
          </div>
          
          {/* User profile */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
} 