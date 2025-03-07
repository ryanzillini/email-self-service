'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UserIcon, 
  EnvelopeIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  UsersIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { signOut } from 'aws-amplify/auth';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 text-sm rounded-lg ${
        isActive 
          ? 'bg-blue-700 text-white' 
          : 'text-gray-300 hover:bg-blue-800 hover:text-white'
      }`}
    >
      <div className="w-6 h-6 mr-3">{icon}</div>
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
      icon: <ChartBarIcon className="w-6 h-6" />,
      label: 'Dashboard',
    },
    {
      href: '/admin/users',
      icon: <UsersIcon className="w-6 h-6" />,
      label: 'Users',
    },
    {
      href: '/admin/forwarding',
      icon: <EnvelopeIcon className="w-6 h-6" />,
      label: 'Email Forwarding',
    },
    {
      href: '/admin/activity',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      label: 'Activity Log',
    },
    {
      href: '/admin/settings',
      icon: <Cog6ToothIcon className="w-6 h-6" />,
      label: 'Settings',
    },
  ];

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col h-full">
      <div className="p-4 flex items-center space-x-2">
        <ShieldCheckIcon className="w-8 h-8 text-blue-300" />
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
            icon={item.icon}
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
          <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
} 