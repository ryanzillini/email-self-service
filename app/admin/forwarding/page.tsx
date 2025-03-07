'use client';

import { useState, useEffect, Fragment } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon, 
  ChevronUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  FunnelIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

// Define types for forwarding status
type ForwardingStatus = 'ACTIVE' | 'PAUSED';

export default function ForwardingPage() {
  const [forwardings, setForwardings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentForwarding, setCurrentForwarding] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'updatedAt',
    direction: 'desc',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const client = generateClient<Schema>();
        
        // Fetch users
        const usersResponse = await client.models.User.list();
        setUsers(usersResponse.data);
        
        // Fetch forwarding configurations
        const forwardingResponse = await client.models.EmailForwarding.list();
        
        // Enrich forwarding data with user information
        const enrichedForwardings = forwardingResponse.data.map(forwarding => {
          const user = usersResponse.data.find(u => u.id === forwarding.userId);
          return {
            ...forwarding,
            userName: user ? getUserName(user.gauntletEmail) : 'Unknown',
          };
        });
        
        setForwardings(enrichedForwardings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load forwarding configurations. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Helper function to extract user name from email
  const getUserName = (email: string | null | undefined): string => {
    if (!email) return 'Unknown';
    const emailStr = String(email);
    return emailStr.includes('@') ? emailStr.split('@')[0] : emailStr;
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedForwardings = [...forwardings].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredForwardings = sortedForwardings.filter(forwarding => {
    const matchesSearch = 
      (forwarding.gauntletEmail && String(forwarding.gauntletEmail).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (forwarding.forwardingEmail && String(forwarding.forwardingEmail).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (forwarding.userName && String(forwarding.userName).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || forwarding.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (forwardingId: string, newStatus: ForwardingStatus) => {
    setIsLoading(true);
    
    try {
      const client = generateClient<Schema>();
      await client.models.EmailForwarding.update({
        id: forwardingId,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      // Update the forwarding in the local state
      setForwardings(
        forwardings.map(forwarding => 
          forwarding.id === forwardingId 
            ? { 
                ...forwarding, 
                status: newStatus,
                updatedAt: new Date().toISOString(),
              } 
            : forwarding
        )
      );
    } catch (error) {
      console.error('Error updating forwarding status:', error);
      setError('Failed to update forwarding status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditForwarding = (forwarding: any) => {
    setCurrentForwarding({
      ...forwarding,
      forwardingEmail: forwarding.forwardingEmail,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const client = generateClient<Schema>();
      await client.models.EmailForwarding.update({
        id: currentForwarding.id,
        forwardingEmail: currentForwarding.forwardingEmail,
        updatedAt: new Date().toISOString(),
      });
      
      // Update the forwarding in the local state
      setForwardings(
        forwardings.map(forwarding => 
          forwarding.id === currentForwarding.id 
            ? { 
                ...forwarding, 
                forwardingEmail: currentForwarding.forwardingEmail,
                updatedAt: new Date().toISOString(),
              } 
            : forwarding
        )
      );
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating forwarding:', error);
      setError('Failed to update forwarding configuration. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteForwarding = async (forwardingId: string) => {
    if (!confirm('Are you sure you want to delete this forwarding configuration?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const client = generateClient<Schema>();
      await client.models.EmailForwarding.delete({
        id: forwardingId,
      });
      
      // Remove the forwarding from the local state
      setForwardings(
        forwardings.filter(forwarding => forwarding.id !== forwardingId)
      );
    } catch (error) {
      console.error('Error deleting forwarding:', error);
      setError('Failed to delete forwarding configuration. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && forwardings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && forwardings.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <InboxIcon className="h-7 w-7 mr-2 text-blue-500" />
          Email Forwarding
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage email forwarding configurations for GauntletAI students
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 card-hover">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-700">Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Search */}
          <div className="form-group">
            <label htmlFor="search" className="form-label">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                type="text"
                className="form-input pl-10"
                placeholder="Search by email or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="form-group">
            <label htmlFor="status-filter" className="form-label">Status</label>
            <select
              id="status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Forwarding Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden card-hover">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-700">Forwarding Configurations</h2>
          <span className="ml-2 badge badge-blue">{filteredForwardings.length} configurations</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center">
                    User
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('gauntletEmail')}
                >
                  <div className="flex items-center">
                    GauntletAI Email
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('forwardingEmail')}
                >
                  <div className="flex items-center">
                    Forwarding To
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center">
                    Last Updated
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredForwardings.map((forwarding) => (
                <tr key={forwarding.id} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium">{forwarding.userName}</div>
                  </td>
                  <td className="table-cell">
                    <div>{forwarding.gauntletEmail}</div>
                  </td>
                  <td className="table-cell">
                    <div>{forwarding.forwardingEmail}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      forwarding.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'
                    }`}>
                      {forwarding.status === 'ACTIVE' ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">
                    {formatDate(forwarding.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {forwarding.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(forwarding.id, 'PAUSED' as ForwardingStatus)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50 transition-colors duration-150"
                          title="Pause Forwarding"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(forwarding.id, 'ACTIVE' as ForwardingStatus)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors duration-150"
                          title="Activate Forwarding"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditForwarding(forwarding)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors duration-150"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteForwarding(forwarding.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors duration-150"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredForwardings.length === 0 && (
          <div className="px-6 py-4 text-center text-sm text-gray-500">
            No forwarding configurations found matching your filters.
          </div>
        )}
      </div>
      
      {/* Edit Forwarding Modal */}
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsEditModalOpen}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <EnvelopeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      Edit Forwarding Configuration
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSaveEdit}>
                        <div className="space-y-4">
                          <div className="form-group">
                            <label htmlFor="gauntlet-email" className="form-label text-left">
                              GauntletAI Email
                            </label>
                            <input
                              type="email"
                              name="gauntlet-email"
                              id="gauntlet-email"
                              className="form-input bg-gray-50 text-gray-500"
                              value={currentForwarding?.gauntletEmail || ''}
                              disabled
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="forwarding-email" className="form-label text-left">
                              Forward To
                            </label>
                            <input
                              type="email"
                              name="forwarding-email"
                              id="forwarding-email"
                              className="form-input"
                              value={currentForwarding?.forwardingEmail || ''}
                              onChange={(e) => setCurrentForwarding({
                                ...currentForwarding,
                                forwardingEmail: e.target.value,
                              })}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                            type="submit"
                            className="btn btn-primary w-full sm:col-start-2"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary mt-3 w-full sm:mt-0 sm:col-start-1"
                            onClick={() => setIsEditModalOpen(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
} 