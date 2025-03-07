'use client';

import { useState, useEffect, Fragment } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';

// Define types for role and status
type UserRole = 'ADMIN' | 'STUDENT';
type UserStatus = 'ACTIVE' | 'INACTIVE';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    gauntletEmail: '',
    role: 'STUDENT' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const client = generateClient<Schema>();
        const response = await client.models.User.list();
        setUsers(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredUsers = sortedUsers.filter(user => {
    const matchesSearch = user.gauntletEmail && 
      String(user.gauntletEmail).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const client = generateClient<Schema>();
      const newUserData = {
        gauntletEmail: newUser.gauntletEmail,
        role: newUser.role,
        status: newUser.status,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      
      const response = await client.models.User.create(newUserData);
      
      // Add the new user to the local state
      setUsers([...users, response.data]);
      
      setIsAddUserModalOpen(false);
      setNewUser({
        gauntletEmail: '',
        role: 'STUDENT' as UserRole,
        status: 'ACTIVE' as UserStatus,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Failed to add user. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    setIsLoading(true);
    
    try {
      const client = generateClient<Schema>();
      await client.models.User.update({
        id: userId,
        status: newStatus,
      });
      
      // Update the user in the local state
      setUsers(
        users.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus } 
            : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const client = generateClient<Schema>();
      await client.models.User.update({
        id: selectedUser.id,
        gauntletEmail: selectedUser.gauntletEmail,
        role: selectedUser.role,
        status: selectedUser.status,
      });
      
      // Update the user in the local state
      setUsers(
        users.map(user => 
          user.id === selectedUser.id 
            ? { ...selectedUser } 
            : user
        )
      );
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again later.');
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

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && users.length === 0) {
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="h-7 w-7 mr-2 text-blue-500" />
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage GauntletAI student accounts
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add User
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 card-hover">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-700">Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                placeholder="Search by email"
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
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          
          {/* Role Filter */}
          <div className="form-group">
            <label htmlFor="role-filter" className="form-label">Role</label>
            <select
              id="role-filter"
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden card-hover">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-medium text-gray-700">User Accounts</h2>
          <span className="ml-2 badge badge-blue">{filteredUsers.length} users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('gauntletEmail')}
                >
                  <div className="flex items-center">
                    Email
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Role
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
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Created
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="table-header-cell cursor-pointer"
                  onClick={() => handleSort('lastLoginAt')}
                >
                  <div className="flex items-center">
                    Last Login
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium">{user.gauntletEmail}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      user.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'
                    }`}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Student'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      user.status === 'ACTIVE' ? 'badge-green' : 'badge-red'
                    }`}>
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="table-cell text-gray-500">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'INACTIVE' as UserStatus)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors duration-150"
                          title="Deactivate"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'ACTIVE' as UserStatus)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition-colors duration-150"
                          title="Activate"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors duration-150"
                        title="Reset Password"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors duration-150"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="px-6 py-4 text-center text-sm text-gray-500">
            No users found matching your filters.
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      <Transition.Root show={isAddUserModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsAddUserModalOpen}>
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
                    <UserIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      Add New User
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleAddUser}>
                        <div className="space-y-4">
                          <div className="form-group">
                            <label htmlFor="email" className="form-label text-left">
                              GauntletAI Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              className="form-input"
                              placeholder="user@gauntletai.com"
                              value={newUser.gauntletEmail}
                              onChange={(e) => setNewUser({ ...newUser, gauntletEmail: e.target.value })}
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="role" className="form-label text-left">
                              Role
                            </label>
                            <select
                              id="role"
                              name="role"
                              className="form-select"
                              value={newUser.role}
                              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="STUDENT">Student</option>
                            </select>
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="status" className="form-label text-left">
                              Status
                            </label>
                            <select
                              id="status"
                              name="status"
                              className="form-select"
                              value={newUser.status}
                              onChange={(e) => setNewUser({ ...newUser, status: e.target.value as UserStatus })}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                            type="submit"
                            className="btn btn-primary w-full sm:col-start-2"
                          >
                            Add User
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary mt-3 w-full sm:mt-0 sm:col-start-1"
                            onClick={() => setIsAddUserModalOpen(false)}
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
      
      {/* Edit User Modal */}
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
                    <PencilIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      Edit User
                    </Dialog.Title>
                    <div className="mt-4">
                      {selectedUser && (
                        <form onSubmit={handleSaveEdit}>
                          <div className="space-y-4">
                            <div className="form-group">
                              <label htmlFor="edit-email" className="form-label text-left">
                                GauntletAI Email
                              </label>
                              <input
                                type="email"
                                name="edit-email"
                                id="edit-email"
                                className="form-input"
                                value={selectedUser.gauntletEmail || ''}
                                onChange={(e) => setSelectedUser({ 
                                  ...selectedUser, 
                                  gauntletEmail: e.target.value 
                                })}
                                required
                              />
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="edit-role" className="form-label text-left">
                                Role
                              </label>
                              <select
                                id="edit-role"
                                name="edit-role"
                                className="form-select"
                                value={selectedUser.role || 'STUDENT'}
                                onChange={(e) => setSelectedUser({ 
                                  ...selectedUser, 
                                  role: e.target.value as UserRole 
                                })}
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="STUDENT">Student</option>
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label htmlFor="edit-status" className="form-label text-left">
                                Status
                              </label>
                              <select
                                id="edit-status"
                                name="edit-status"
                                className="form-select"
                                value={selectedUser.status || 'ACTIVE'}
                                onChange={(e) => setSelectedUser({ 
                                  ...selectedUser, 
                                  status: e.target.value as UserStatus 
                                })}
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                              </select>
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
                      )}
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