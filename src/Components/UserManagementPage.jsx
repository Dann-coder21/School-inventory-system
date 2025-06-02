// UserManagementPage.js - No changes needed, keeping it as is.

import React, { useState, useContext, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext'; // Assuming this path is correct
import Swal from 'sweetalert2';
import axios from "axios";

// Icons
import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdPeople, MdEdit, MdDelete, MdSave, MdCancel, MdPersonAdd, MdClose
} from 'react-icons/md';

const AVAILABLE_ROLES = ['Admin', 'Staff', 'Viewer', 'DepartmentHead', 'StockManager'];

const UserManagementPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, logout, isLoadingAuth } = useAuth(); // Correctly consuming auth state

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add User Form State - Corrected to use 'phone'
  const [newUser, setNewUser] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'Staff',
    phone: '',
    dob: ''
  });

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Authentication Error', 'No token found. Please log in again.', 'error');
        setIsLoadingUsers(false);
        return;
      }
      const response = await axios.get("http://localhost:3000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      const errorMsg = error.response?.data?.message || error.message || "Could not load user data.";
      Swal.fire({
        title: 'Error Fetching Users',
        text: errorMsg,
        icon: 'error',
      });
      // The previous comment // logout(); is commented out, which is good.
      // Let AuthContext handle full logout lifecycle.
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // No need to call logout() here, AuthContext's fetchAndSetCurrentUser or login will handle it
        // if token is invalid or expired.
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    console.log("UserManagementPage useEffect: isLoadingAuth:", isLoadingAuth, "currentUser:", currentUser?.role);
    if (!isLoadingAuth && currentUser && currentUser.role === 'Admin') {
      fetchUsers();
    } else if (!isLoadingAuth && (!currentUser || currentUser.role !== 'Admin')) {
      // This path is hit correctly when auth is *done loading* but user is not admin.
      setIsLoadingUsers(false); // Make sure user loading state is also finished if no access
    }
    // No change needed here.
  }, [currentUser, isLoadingAuth, fetchUsers]);


  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Error', 'Authentication token not found. Please log in.', 'error');
        return;
      }

      const response = await axios.post('http://localhost:3000/api/admin/adduser', newUser, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      Swal.fire('Success!', 'User added successfully!', 'success');
      setShowAddForm(false);
      setNewUser({ fullname: '', email: '', password: '', role: 'Staff', phone: '', dob: '' });
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to add user.', 'error');
    }
  };

  const handleEditRole = (user) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found.');

      await axios.put(`http://localhost:3000/api/admin/users/${userId}`,
        { role: selectedRole },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      await fetchUsers();
      setEditingUserId(null);
      Swal.fire('Success', 'User role updated successfully!', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to update role.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleDeleteUser = async (userId, username) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete user "${username}". You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found.');

        await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await fetchUsers();
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to delete user.', 'error');
      }
    }
  };

  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md')
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;

  const inputBaseClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode
      ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
      : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;

  const buttonBaseClass = "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5";

  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        Loading authentication...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
        <aside className={`fixed top-0 left-0 w-[250px] h-full flex flex-col z-50 ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-indigo-600 to-indigo-700'}`} />
        <div className={`flex-1 flex flex-col ml-[250px] items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-[250px] h-full flex flex-col z-50 transition-colors duration-300 shadow-xl ${
        darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-r border-indigo-700'
      }`}>
        <div className="flex items-center justify-center h-20 border-b border-white/20">
          <MdSchool className={`text-3xl ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
          <h1 className={`ml-3 text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-white'}`}>School IMS</h1>
        </div>
        <nav className="flex-grow pt-5">
          <NavLink to="/dashboard" className={sidebarLinkClass}><MdDashboard className="text-xl" /> Dashboard</NavLink>
          <NavLink to="/inventory" className={sidebarLinkClass}><MdInventory className="text-xl" /> Inventory</NavLink>
          <NavLink to="/additemsform" className={sidebarLinkClass}><MdAddBox className="text-xl" /> Add Items</NavLink>
          <NavLink to="/viewitems" className={sidebarLinkClass}><MdList className="text-xl" /> View Items</NavLink>
          <NavLink to="/reports" className={sidebarLinkClass}><MdAssessment className="text-xl" /> Reports</NavLink>
          <NavLink to="/admin/users" className={sidebarLinkClass}><MdPeople className="text-xl" /> User Management</NavLink>
          <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className="text-xl" /> Settings</NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 ${
          darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'
        } shadow-sm`}>
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            User Management
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className={`${buttonBaseClass} ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
          >
            <MdPersonAdd className="text-lg" /> Add New User
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto">
          {/* Add User Form */}
          {showAddForm && (
            <div className={`mb-6 p-6 rounded-lg shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add New User</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className={`p-1 rounded-full hover:opacity-70 ${darkMode ? 'text-slate-300' : 'text-gray-500'}`}
                  aria-label="Close add user form"
                >
                  <MdClose className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Full Name, Email, Password, Role inputs remain the same */}
                  <div>
                    <label htmlFor="fullname" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullname" type="text" name="fullname" value={newUser.fullname}
                      onChange={handleNewUserChange} className={inputBaseClass} required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email" type="email" name="email" value={newUser.email}
                      onChange={handleNewUserChange} className={inputBaseClass} required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password" type="password" name="password" value={newUser.password}
                      onChange={handleNewUserChange} className={inputBaseClass} required minLength="6"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="role" name="role" value={newUser.role}
                      onChange={handleNewUserChange} className={inputBaseClass} required
                    >
                      {AVAILABLE_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={newUser.phone}
                      onChange={handleNewUserChange}
                      className={inputBaseClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="dob" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Date of Birth
                    </label>
                    <input
                      id="dob" type="date" name="dob" value={newUser.dob}
                      onChange={handleNewUserChange} className={inputBaseClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className={`${buttonBaseClass} ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    <MdCancel /> Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${buttonBaseClass} ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                  >
                    <MdPersonAdd /> Add User
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className={`w-full rounded-xl shadow-xl p-0 overflow-hidden ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            {isLoadingUsers ? (
              <div className="p-10 text-center">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center">No users found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  <tr>
                    <th className="py-3 px-4 text-left text-xs uppercase font-semibold">Full Name</th>
                    <th className="py-3 px-4 text-left text-xs uppercase font-semibold hidden sm:table-cell">Email</th>
                    <th className="py-3 px-4 text-left text-xs uppercase font-semibold">Role</th>
                    <th className="py-3 px-4 text-left text-xs uppercase font-semibold hidden md:table-cell">Phone</th>
                    <th className="py-3 px-4 text-left text-xs uppercase font-semibold hidden lg:table-cell">DOB</th>
                    <th className="py-3 px-4 text-left text-xs uppercase font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                  {users.map((user) => (
                    <tr key={user.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                      {/* Full Name, Email, Role, DOB cells remain the same */}
                      <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{user.fullname}</td>
                      <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{user.email}</td>
                      <td className="py-3 px-4">
                        {editingUserId === user.id ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className={`${inputBaseClass} text-xs p-1 w-full sm:w-auto`}
                            aria-label={`Edit role for ${user.fullname}`}
                          >
                            {AVAILABLE_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'Admin' ? (darkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700')
                            : user.role === 'Staff' ? (darkMode ? 'bg-sky-500/30 text-sky-300' : 'bg-sky-100 text-sky-700')
                            : user.role === 'DepartmentHead' ? (darkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                            : user.role === 'StockManager' ? (darkMode ? 'bg-teal-500/30 text-teal-300' : 'bg-teal-100 text-teal-700')
                            : (darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600')
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {user.phone || 'N/A'}
                      </td>
                      <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {/* Action buttons remain the same */}
                          {editingUserId === user.id ? (
                            <>
                              <button
                                onClick={() => handleSaveRole(user.id)}
                                className={`${buttonBaseClass} ${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                aria-label="Save role change"
                              >
                                <MdSave /> <span className="hidden sm:inline">Save</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className={`${buttonBaseClass} ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                                aria-label="Cancel role edit"
                              >
                                <MdCancel /> <span className="hidden sm:inline">Cancel</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditRole(user)}
                              disabled={currentUser.id === user.id && user.role === 'Admin'}
                              className={`${buttonBaseClass} ${
                                (currentUser.id === user.id && user.role === 'Admin')
                                ? (darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed')
                                : (darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                              }`}
                              aria-label={`Edit role for ${user.fullname}`}
                            >
                              <MdEdit /> <span className="hidden sm:inline">Edit Role</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.fullname)}
                            disabled={currentUser.id === user.id || user.role === 'Admin'}
                            className={`${buttonBaseClass} ${
                              (currentUser.id === user.id || user.role === 'Admin')
                                ? (darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed')
                                : (darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white')
                            }`}
                            aria-label={`Delete user ${user.fullname}`}
                          >
                            <MdDelete /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserManagementPage;