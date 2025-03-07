'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';
import { 
  UserIcon, 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Sample data for charts (will be replaced with real data in a production environment)
const userGrowthData = [
  { name: 'Jan', users: 10 },
  { name: 'Feb', users: 15 },
  { name: 'Mar', users: 25 },
  { name: 'Apr', users: 32 },
  { name: 'May', users: 40 },
  { name: 'Jun', users: 48 },
  { name: 'Jul', users: 55 },
];

const forwardingActivityData = [
  { name: 'Mon', sent: 120, delivered: 115 },
  { name: 'Tue', sent: 132, delivered: 130 },
  { name: 'Wed', sent: 145, delivered: 143 },
  { name: 'Thu', sent: 160, delivered: 158 },
  { name: 'Fri', sent: 180, delivered: 175 },
  { name: 'Sat', sent: 90, delivered: 88 },
  { name: 'Sun', sent: 85, delivered: 84 },
];

// Activity types for the activity feed
type ActivityType = 'user' | 'forwarding' | 'system';

// Activity item interface
interface ActivityItem {
  id: string;
  type: ActivityType;
  action: string;
  name: string;
  email: string;
  time: string;
  timestamp: Date;
}

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [forwardingCount, setForwardingCount] = useState(0);
  const [activeForwardingCount, setActiveForwardingCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const client = generateClient<Schema>();
        
        // Get user count
        const usersResponse = await client.models.User.list();
        setUserCount(usersResponse.data.length);
        
        // Get forwarding count
        const forwardingResponse = await client.models.EmailForwarding.list();
        setForwardingCount(forwardingResponse.data.length);
        
        // Get active forwarding count
        const activeForwarding = forwardingResponse.data.filter(
          item => item.status === 'ACTIVE'
        );
        setActiveForwardingCount(activeForwarding.length);
        
        // Generate recent activity from users and forwarding data
        const activities: ActivityItem[] = [];
        
        // Add user activities
        usersResponse.data.forEach(user => {
          if (user && user.gauntletEmail) {
            const email = String(user.gauntletEmail);
            const username = email.includes('@') ? email.split('@')[0] : 'Unknown';
            
            activities.push({
              id: `user-${user.id}`,
              type: 'user',
              action: 'User registered',
              name: username,
              email: email,
              time: formatTimeAgo(new Date(user.createdAt || new Date())),
              timestamp: new Date(user.createdAt || new Date())
            });
          }
        });
        
        // Add forwarding activities
        forwardingResponse.data.forEach(forwarding => {
          if (forwarding && forwarding.gauntletEmail) {
            const email = String(forwarding.gauntletEmail);
            const username = email.includes('@') ? email.split('@')[0] : 'Unknown';
            
            activities.push({
              id: `forwarding-${forwarding.id}`,
              type: 'forwarding',
              action: 'Forwarding configured',
              name: username,
              email: email,
              time: formatTimeAgo(new Date(forwarding.createdAt || new Date())),
              timestamp: new Date(forwarding.createdAt || new Date())
            });
          }
        });
        
        // Sort by timestamp (newest first) and take the 5 most recent
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setRecentActivity(activities.slice(0, 5));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format time ago (e.g., "5 minutes ago", "2 hours ago")
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Data for the status distribution pie chart
  const statusDistributionData = [
    { name: 'Active', value: activeForwardingCount },
    { name: 'Paused', value: forwardingCount - activeForwardingCount },
  ];

  const stats = [
    {
      title: 'Total Users',
      value: userCount,
      description: 'GauntletAI students with accounts',
      icon: <UserIcon className="h-6 w-6 text-white" />,
      change: '+12%',
      changeType: 'increase',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      iconBg: 'bg-blue-600',
    },
    {
      title: 'Forwarding Configs',
      value: forwardingCount,
      description: 'Total email forwarding rules',
      icon: <EnvelopeIcon className="h-6 w-6 text-white" />,
      change: '+5%',
      changeType: 'increase',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      iconBg: 'bg-green-600',
    },
    {
      title: 'Active Forwarding',
      value: activeForwardingCount,
      description: 'Currently active forwarding rules',
      icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
      change: '-2%',
      changeType: 'decrease',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      iconBg: 'bg-purple-600',
    },
    {
      title: 'Delivery Rate',
      value: '99.8%',
      description: 'Email delivery success rate',
      icon: <ExclamationCircleIcon className="h-6 w-6 text-white" />,
      change: '+0.5%',
      changeType: 'increase',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of the GauntletAI Email Forwarding Service
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className={`rounded-lg shadow overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-lg ${stat.color}`}
          >
            <div className="p-5 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{stat.title}</h3>
                  <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.iconBg}`}>
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.changeType === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span className="mr-2">
                  {stat.change}
                </span>
                <span className="opacity-75">{stat.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
              User Growth
            </h2>
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Monthly
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userGrowthData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }} 
                />
                <Bar 
                  dataKey="users" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Status Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-green-500" />
              Forwarding Status
            </h2>
            <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Current
            </div>
          </div>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1500}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} configurations`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Forwarding Activity Chart */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-700 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
              Forwarding Activity
            </h2>
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Weekly
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forwardingActivityData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden transform transition-all duration-300 hover:shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
            <h2 className="text-lg font-medium text-gray-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {activity.type === 'user' && (
                        <div className="p-2 rounded-full bg-blue-100">
                          <UserIcon className="h-5 w-5 text-blue-500" />
                        </div>
                      )}
                      {activity.type === 'forwarding' && (
                        <div className="p-2 rounded-full bg-green-100">
                          <EnvelopeIcon className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                      {activity.type === 'system' && (
                        <div className="p-2 rounded-full bg-yellow-100">
                          <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                      {activity.name && (
                        <p className="text-sm text-gray-500">
                          {activity.name} {activity.email && `(${activity.email})`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-sm text-gray-500">
                No recent activity to display.
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <a href="/admin/activity" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center">
              View all activity
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 