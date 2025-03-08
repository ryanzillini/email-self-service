'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';

interface NavItemProps {
  href: string;
  label: string;
  isActive: boolean;
}

function NavItem({ href, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 text-sm rounded-lg ${
        isActive 
          ? 'bg-blue-700 text-white' 
          : 'text-gray-300 hover:bg-blue-800 hover:text-white'
      }`}
    >
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
    },
    {
      href: '/admin/settings',
      label: 'Settings',
    },
  ];

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col h-full">
      <div className="p-4 flex items-center space-x-2">
        <div>
          <h1 className="text-xl font-bold">GauntletAI</h1>
          <p className="text-xs text-blue-300">Admin Portal</p>
        </div>
      </div>
      
      <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </div>
      
      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-blue-800 hover:text-white w-full"
        >
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 