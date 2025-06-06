import React, { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import axios from "axios";
import Layout from "../Components/Layout/Layout";
import LoadingSpinner from "../Components/LoadingSpinner";

// Icons
import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, MdSettings, MdSchool,
  MdPeople, MdEdit, MdDelete, MdSave, MdCancel, MdPersonAdd, MdClose,
  MdVisibility, MdVisibilityOff,
  MdCheckCircle, MdError,
  MdMoreVert, MdShoppingCart,
  MdSort, MdSortByAlpha, MdArrowUpward, MdArrowDownward,
  MdToggleOn, MdToggleOff,
  MdLockReset,
  MdApartment // NEW: Icon for Department
} from 'react-icons/md';

const API_BASE_URL = "http://localhost:3000";

const AVAILABLE_ROLES = ['Admin', 'Staff', 'Viewer', 'DepartmentHead', 'StockManager'];

// --- Validation Helper Functions (kept as is) ---
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, message: 'Email is required.' };
  if (!emailRegex.test(email)) return { isValid: false, message: 'Invalid email format.' };
  return { isValid: true, message: '' };
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[0-9\s-()]{7,20}$/;
  if (!phone) return { isValid: true, message: '' };
  if (!phoneRegex.test(phone)) return { isValid: false, message: 'Invalid phone number format.' };
  return { isValid: true, message: '' };
};

const getPasswordStrength = (password) => {
  let strength = 0;
  const messages = [];

  if (password.length < 8) {
    messages.push('At least 8 characters long.');
  } else { strength += 1; }
  if (password.match(/[a-z]/)) { strength += 1; } else { messages.push('At least one lowercase letter.'); }
  if (password.match(/[A-Z]/)) { strength += 1; } else { messages.push('At least one uppercase letter.'); }
  if (password.match(/[0-9]/)) { strength += 1; } else { messages.push('At least one number.'); }
  if (password.match(/[^a-zA-Z0-9]/)) { strength += 1; } else { messages.push('At least one special character.'); }

  if (password.length === 0) return { strength: 0, message: 'Type a password', color: 'gray' };
  if (strength <= 2) return { strength, message: `Weak: ${messages.join(' ')}.`, color: 'red' };
  if (strength === 3) return { strength, message: 'Medium strength.', color: 'orange' };
  if (strength >= 4) return { strength, message: 'Strong password!', color: 'green' };

  return { strength: 0, message: '', color: 'gray' };
};


const UserManagementPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();

  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  const [editingUser, setEditingUser] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editPasswordStrength, setEditPasswordStrength] = useState({ strength: 0, message: '', color: 'gray' });
  const [editValidationErrors, setEditValidationErrors] = useState({});

  const [showAddForm, setShowAddForm] = useState(false);

  const [newUser, setNewUser] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'Staff',
    phone: '',
    dob: '',
    department_id: ''
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addPasswordStrength, setAddPasswordStrength] = useState({ strength: 0, message: '', color: 'gray' });
  const [addValidationErrors, setAddValidationErrors] = useState({});


  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fullname');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // --- Fetch Departments ---
  const fetchDepartments = useCallback(async () => {
    setIsLoadingDepartments(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Authentication Error', 'No token found. Please log in again.', 'error');
        setIsLoadingDepartments(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/departments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDepartments(response.data);
      if (response.data.length > 0 && newUser.department_id === '') {
          setNewUser(prev => ({ ...prev, department_id: response.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      Swal.fire({
        title: 'Error Fetching Departments',
        text: error.response?.data?.message || error.message || "Could not load departments.",
        icon: 'error',
      });
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [newUser.department_id]);

  // --- Fetch Users ---
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire('Authentication Error', 'No token found. Please log in again.', 'error');
        setIsLoadingUsers(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllUsers(response.data);
      // --- IMPORTANT: Pagination Reset after fetch ---
      setCurrentPage(prev => {
        const newTotalPages = Math.ceil(response.data.length / usersPerPage);
        return prev > newTotalPages ? Math.max(1, newTotalPages) : prev;
      });
      // --- END IMPORTANT ---
    } catch (error) {
      console.error("Failed to fetch users:", error);
      const errorMsg = error.response?.data?.message || error.message || "Could not load user data.";
      Swal.fire({
        title: 'Error Fetching Users',
        text: errorMsg,
        icon: 'error',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [usersPerPage]); // Added usersPerPage to dependencies

  useEffect(() => {
    if (!isLoadingAuth && currentUser && currentUser.role === 'Admin') {
      fetchDepartments();
      fetchUsers();
    } else if (!isLoadingAuth && (!currentUser || currentUser.role !== 'Admin')) {
      setIsLoadingUsers(false);
      setIsLoadingDepartments(false);
    }
  }, [currentUser, isLoadingAuth, fetchUsers, fetchDepartments]);

  // Click outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        const isMenuButton = event.target.closest(`button[aria-label="Actions-for-${activeActionMenuId}"]`);
        if (!isMenuButton) {
          setActiveActionMenuId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeActionMenuId]);


  // --- Filter, Sort, Paginate Logic ---
  const filteredUsers = useMemo(() => {
    let tempUsers = [...allUsers];

    if (searchTerm) {
      tempUsers = tempUsers.filter(user =>
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department_name && user.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    tempUsers.sort((a, b) => {
      const aValue = String(a[sortBy] || '').toLowerCase();
      const bValue = String(b[sortBy] || '').toLowerCase();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return tempUsers;
  }, [allUsers, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    setActiveActionMenuId(null);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // --- HANDLERS FOR "ADD NEW USER" FORM ---
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));

    let currentErrors = { ...addValidationErrors };
    if (name === 'email') {
      const { isValid, message } = validateEmail(value);
      currentErrors.email = isValid ? '' : message;
    } else if (name === 'phone') {
      const { isValid, message } = validatePhone(value);
      currentErrors.phone = isValid ? '' : message;
    } else if (name === 'password') {
      const strengthResult = getPasswordStrength(value);
      setAddPasswordStrength(strengthResult);
      currentErrors.password = strengthResult.strength < 4 && value.length > 0 ? strengthResult.message : '';
    } else if (name === 'fullname' && !value.trim()) {
        currentErrors.fullname = "Full name is required.";
    } else if (name === 'fullname') {
        currentErrors.fullname = "";
    }
    setAddValidationErrors(currentErrors);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    let errors = {};
    if (!newUser.fullname.trim()) { errors.fullname = "Full name is required."; }
    const emailValidation = validateEmail(newUser.email);
    if (!emailValidation.isValid) errors.email = emailValidation.message;
    const passwordValidation = getPasswordStrength(newUser.password);
    if (passwordValidation.strength < 4) { errors.password = passwordValidation.message || 'Password is not strong enough.'; }
    if (newUser.phone) {
      const phoneValidation = validatePhone(newUser.phone);
      if (!phoneValidation.isValid) errors.phone = phoneValidation.message;
    }
    if (!newUser.department_id) {
        errors.department_id = "Department is required.";
    }

    setAddValidationErrors(errors);
    if (Object.values(errors).some(msg => msg !== '')) {
      Swal.fire('Validation Error', 'Please correct the errors in the form before submitting.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) { Swal.fire('Error', 'Authentication token not found. Please log in.', 'error'); return; }

      const userPayload = { ...newUser };
      userPayload.dob = newUser.dob || null;

      await axios.post(`${API_BASE_URL}/api/admin/adduser`, userPayload, { headers: { 'Authorization': `Bearer ${token}` } });

      Swal.fire('Success!', 'User added successfully!', 'success');
      setShowAddForm(false);
      setNewUser({
          fullname: '', email: '', password: '', role: 'Staff', phone: '', dob: '',
          department_id: departments.length > 0 ? departments[0].id : ''
      });
      setAddPasswordStrength({ strength: 0, message: '', color: 'gray' });
      setAddValidationErrors({});
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to add user due to a server error.', 'error');
    }
  };

  const getAddValidationClass = (fieldName) => {
    if (addValidationErrors[fieldName]) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    const fieldValue = newUser[fieldName];
    if (fieldValue && !addValidationErrors[fieldName]) {
        if (fieldName === 'email' && validateEmail(fieldValue).isValid) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'phone' && validatePhone(fieldValue).isValid) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'password' && addPasswordStrength.strength >= 4) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'fullname' && fieldValue.trim()) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'department_id' && fieldValue) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    return '';
  };


  // --- HANDLERS FOR INLINE EDITING ---
  const handleEditUser = (user) => {
    setEditingUser({ ...user, newPassword: '', department_id: user.department_id || '' });
    setShowEditPassword(false);
    setEditPasswordStrength({ strength: 0, message: '', color: 'gray' });
    setEditValidationErrors({});
    setActiveActionMenuId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));

    let currentErrors = { ...editValidationErrors };
    if (name === 'email') {
      const { isValid, message } = validateEmail(value);
      currentErrors.email = isValid ? '' : message;
    } else if (name === 'phone') {
      const { isValid, message } = validatePhone(value);
      currentErrors.phone = isValid ? '' : message;
    } else if (name === 'newPassword') {
      const strengthResult = getPasswordStrength(value);
      setEditPasswordStrength(strengthResult);
      currentErrors.newPassword = strengthResult.strength < 4 && value.length > 0 ? strengthResult.message : '';
    } else if (name === 'fullname' && !value.trim()) {
        currentErrors.fullname = "Full name is required.";
    } else if (name === 'fullname') {
        currentErrors.fullname = "";
    }
    setEditValidationErrors(currentErrors);
  };


  const handleSaveEdit = async (userId) => {
    if (!editingUser) return;

    let errors = {};
    if (!editingUser.fullname.trim()) { errors.fullname = "Full name is required."; }
    const emailValidation = validateEmail(editingUser.email);
    if (!emailValidation.isValid) errors.email = emailValidation.message;

    if (editingUser.newPassword) {
      const passwordValidation = getPasswordStrength(editingUser.newPassword);
      if (passwordValidation.strength < 4) { errors.newPassword = passwordValidation.message || 'Password is not strong enough.'; }
    }
    if (editingUser.phone) {
      const phoneValidation = validatePhone(editingUser.phone);
      if (!phoneValidation.isValid) errors.phone = phoneValidation.message;
    }
    if (!editingUser.department_id && (editingUser.role === 'Staff' || editingUser.role === 'DepartmentHead')) {
        errors.department_id = "Department is required for this role.";
    } else if (editingUser.department_id && Object.values(departments).some(d => d.id === editingUser.department_id) === false) {
        errors.department_id = "Invalid department selected.";
    }

    setEditValidationErrors(errors);
    if (Object.values(errors).some(msg => msg !== '')) {
      Swal.fire('Validation Error', 'Please correct the errors in the form before saving.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) { Swal.fire('Error', 'Authentication token not found. Please log in.', 'error'); return; }

      const updatePayload = {
        fullname: editingUser.fullname,
        email: editingUser.email,
        role: editingUser.role,
        phone: editingUser.phone,
        dob: editingUser.dob ? editingUser.dob.substring(0, 10) : null,
        status: editingUser.status,
        department_id: editingUser.department_id || null
      };

      if (editingUser.newPassword) {
        updatePayload.password = editingUser.newPassword;
      }

      await axios.put(`${API_BASE_URL}/api/admin/users/${userId}`,
        updatePayload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      Swal.fire('Success', 'User updated successfully!', 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to update user.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditValidationErrors({});
    setEditPasswordStrength({ strength: 0, message: '', color: 'gray' });
  };

  // --- ENABLED DELETE USER FUNCTION ---
  const handleDeleteUser = async (userId, username) => {
    setActiveActionMenuId(null); // Close action menu first
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Delete user "${username}"? This action can be undone by restoring the user (if soft deleted).`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (!result.isConfirmed) return; // If cancelled, do nothing

      // Show loading state while deleting
      Swal.fire({
        title: 'Deleting User',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }

      await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh user list after successful deletion.
      // fetchUsers will automatically re-filter soft-deleted users.
      await fetchUsers();
      
      Swal.fire({
        title: 'Deleted!',
        text: `User "${username}" has been deleted (soft-deleted).`,
        icon: 'success',
        timer: 2000,
        timerProgressBar: true
      });

    } catch (error) {
      console.error('Delete user error:', error);
      
      let errorMessage = 'Failed to delete user due to an unknown error.';
      
      if (error.response) {
        switch (error.response.status) {
          case 403:
            errorMessage = error.response.data?.message || "You don't have permission to delete this user.";
            break;
          case 404:
            errorMessage = error.response.data?.message || "User not found.";
            break;
          case 409: // Conflict, e.g., if hard delete was attempted and foreign key constraint failed
            errorMessage = error.response.data?.message || "User has associated records that prevent deletion.";
            break;
          case 500:
            errorMessage = error.response.data?.message || "Server error occurred while deleting user.";
            break;
          default:
            errorMessage = `An unexpected error occurred (Status: ${error.response.status}).`;
        }
      } else if (error.request) {
          errorMessage = "Network error: Could not connect to the server.";
      } else {
          errorMessage = error.message;
      }

      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error'
      });
    }
  };
  // --- END ENABLED DELETE USER FUNCTION ---

  // --- NEW: Optimistic Update for User Status Toggle ---
  const handleToggleUserStatus = async (user) => {
    setActiveActionMenuId(null);
    const newStatus = !user.status; // Determine the new status (true for Active, false for Inactive)
    const originalStatus = user.status; // Store original status for rollback

    const actionText = newStatus ? 'ACTIVATE' : 'DEACTIVATE';

    const result = await Swal.fire({
      title: 'Confirm Action',
      text: `Are you sure you want to ${actionText} user "${user.fullname}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#28a745' : '#dc3545', // Green for Activate, Red for Deactivate
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${actionText}`
    });

    if (result.isConfirmed) {
      // Optimistic UI Update: Update the local state immediately
      setAllUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found.');

        await axios.put(`${API_BASE_URL}/api/admin/users/${user.id}/status`,
          { status: newStatus },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        Swal.fire('Success', `User ${user.fullname} has been ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
        // No need to call fetchUsers() here, as optimistic update handles it.
        // If there's a need for a full data refresh, it can be added back,
        // but it would overwrite the optimistic update briefly.
      } catch (error) {
        // Rollback UI if API call fails
        setAllUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id ? { ...u, status: originalStatus } : u
          )
        );
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to update user status.', 'error');
      }
    }
  };
  // --- END Optimistic Update for User Status Toggle ---

  const handleForcePasswordReset = async (userId, username) => {
    setActiveActionMenuId(null);
    const result = await Swal.fire({
      title: 'Force Password Reset?',
      text: `This will reset the password for "${username}" to a temporary one or send a reset link (depending on backend). Confirm?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, Reset Password'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found.');

        const response = await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`,
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        const tempPassword = response.data?.tempPassword || 'A new password has been set/emailed.';

        Swal.fire({
          title: 'Password Reset',
          html: `<p>Password for <strong>${username}</strong> has been reset.</p><p><strong>Temporary Password:</strong> <code>${tempPassword}</code><br/>(Please communicate this to the user securely)</p>`,
          icon: 'success',
          confirmButtonText: 'Got It',
          customClass: {
            htmlContainer: 'text-left'
          }
        });
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || error.message || 'Failed to force password reset.', 'error');
      }
    }
  };


  const getEditValidationClass = (fieldName) => {
    if (editValidationErrors[fieldName]) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    }
    const fieldValue = editingUser?.[fieldName];
    if (fieldValue !== undefined && !editValidationErrors[fieldName]) {
        if (fieldName === 'newPassword' && editPasswordStrength.strength >= 4) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'email' && validateEmail(fieldValue).isValid) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'phone' && validatePhone(fieldValue).isValid) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'fullname' && fieldValue.trim()) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
        if (fieldName === 'department_id' && fieldValue) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    }
    return '';
  };


  const inputBaseClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode
      ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
      : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;

  const buttonBaseClass = "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5";


  const canViewOrders = ['Admin', 'Staff', 'DepartmentHead', 'StockManager'];
  const showOrdersLink = useMemo(() => {
    return canViewOrders.includes(currentUser?.role);
  }, [currentUser?.role]);

  // Show loading spinner if any critical data (auth, users, departments) is loading
  if (isLoadingAuth || isLoadingUsers || isLoadingDepartments) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        <LoadingSpinner size="lg" />
        <p className={`ml-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {isLoadingAuth ? 'Authenticating...' : (isLoadingDepartments ? 'Loading departments...' : 'Loading users...')}
        </p>
      </div>
    );
  }

  // Access Denied Block - wrapped in Layout to get the sidebar, but content is centered
  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <Layout>
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
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

        <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full">
          
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
                  <div>
                    <label htmlFor="addFullname" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="addFullname" type="text" name="fullname" value={newUser.fullname}
                      onChange={handleNewUserChange} className={`${inputBaseClass} ${getAddValidationClass('fullname')}`} required
                    />
                    {addValidationErrors.fullname && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <MdError size={14}/> {addValidationErrors.fullname}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="addEmail" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="addEmail" type="email" name="email" value={newUser.email}
                        onChange={handleNewUserChange} className={`${inputBaseClass} ${getAddValidationClass('email')}`} required
                      />
                      {newUser.email && !addValidationErrors.email && validateEmail(newUser.email).isValid && (
                        <MdCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20}/>
                      )}
                    </div>
                    {addValidationErrors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <MdError size={14}/> {addValidationErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="addPassword" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="addPassword"
                        type={showAddPassword ? "text" : "password"}
                        name="password"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        className={`${inputBaseClass} pr-10 ${getAddValidationClass('password')}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label={showAddPassword ? "Hide password" : "Show password"}
                      >
                        {showAddPassword ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}
                      </button>
                    </div>
                    {newUser.password && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        addPasswordStrength.color === 'green' ? 'text-green-500' :
                        addPasswordStrength.color === 'orange' ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {addPasswordStrength.color === 'green' ? <MdCheckCircle size={14}/> : <MdError size={14}/>}
                        {addPasswordStrength.message}
                      </p>
                    )}
                    {addValidationErrors.password && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <MdError size={14}/> {addValidationErrors.password}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="addRole" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="addRole" name="role" value={newUser.role}
                      onChange={handleNewUserChange} className={inputBaseClass} required
                    >
                      {AVAILABLE_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  {/* NEW: Department Selection for Add User Form */}
                  <div>
                    <label htmlFor="addDepartment" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Department <span className="text-red-500">*</span>
                    </label>
                    {isLoadingDepartments ? (
                      <div className={`${inputBaseClass} flex items-center`}>
                        <LoadingSpinner size="sm" /> <span className="ml-2">Loading departments...</span>
                      </div>
                    ) : departments.length === 0 ? (
                      <div className={`${inputBaseClass} flex items-center text-red-500`}>
                        <MdError size={18} className="mr-1" /> No departments available
                      </div>
                    ) : (
                      <select
                        id="addDepartment" name="department_id" value={newUser.department_id}
                        onChange={handleNewUserChange} className={`${inputBaseClass} ${getAddValidationClass('department_id')}`}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    )}
                    {addValidationErrors.department_id && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <MdError size={14}/> {addValidationErrors.department_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="addPhone" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        id="addPhone"
                        type="tel"
                        name="phone"
                        value={newUser.phone}
                        onChange={handleNewUserChange}
                        className={`${inputBaseClass} ${getAddValidationClass('phone')}`}
                      />
                      {newUser.phone && !addValidationErrors.phone && validatePhone(newUser.phone).isValid && (
                        <MdCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20}/>
                      )}
                    </div>
                    {addValidationErrors.phone && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <MdError size={14}/> {addValidationErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="addDob" className={`block mb-1 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Date of Birth
                    </label>
                    <input
                      id="addDob" type="date" name="dob" value={newUser.dob}
                      onChange={handleNewUserChange} className={inputBaseClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                        setShowAddForm(false);
                        setNewUser({
                            fullname: '', email: '', password: '', role: 'Staff', phone: '', dob: '',
                            department_id: departments.length > 0 ? departments[0].id : ''
                        });
                        setAddValidationErrors({});
                        setAddPasswordStrength({ strength: 0, message: '', color: 'gray' });
                    }}
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

          {/* Search, Sort & Pagination Controls */}
          <div className={`mb-4 p-4 rounded-lg shadow-md flex flex-wrap gap-4 items-center justify-between ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="flex-1 min-w-[200px] max-w-md">
              <label htmlFor="search" className="sr-only">Search users</label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, email, role, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputBaseClass} text-sm`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Users per page:</span>
              <select
                value={usersPerPage}
                onChange={(e) => { setUsersPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className={`${inputBaseClass} w-auto text-sm p-1.5`}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className={`w-full rounded-xl shadow-xl p-0 overflow-hidden ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            {isLoadingUsers ? (
              <div className="p-10 text-center">
                <LoadingSpinner size="md"/>
                <p className={`mt-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className={`p-10 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <MdPeople size={48} className="mx-auto mb-3 opacity-70"/>
                <p className="font-medium text-lg">No users found.</p>
                <p className="text-sm">Try adjusting your search filters or add a new user.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                      <tr>
                        {/* Sortable Headers */}
                        {[
                          { key: 'fullname', label: 'Full Name' },
                          { key: 'email', label: 'Email', hiddenClass: 'hidden sm:table-cell' },
                          { key: 'role', label: 'Role' },
                          { key: 'department_name', label: 'Department', hiddenClass: 'hidden sm:table-cell' },
                          { key: 'status', label: 'Status' },
                          { key: 'phone', label: 'Phone', hiddenClass: 'hidden md:table-cell' },
                          { key: 'dob', label: 'DOB', hiddenClass: 'hidden lg:table-cell' },
                        ].map(({ key, label, hiddenClass }) => (
                          <th
                            key={key}
                            className={`py-3 px-4 text-left text-xs uppercase font-semibold cursor-pointer ${hiddenClass || ''}`}
                            onClick={() => handleSort(key)}
                          >
                            <div className="flex items-center gap-1">
                              {label}
                              {sortBy === key && (
                                sortOrder === 'asc' ? <MdArrowUpward size={16} /> : <MdArrowDownward size={16} />
                              )}
                              {sortBy !== key && <MdSort size={16} className="text-slate-400 opacity-50"/>}
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-4 text-center text-xs uppercase font-semibold">Password</th>
                        <th className="py-3 px-4 text-center text-xs uppercase font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {currentUsers.map((user) => (
                        <tr key={user.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                          {/* Full Name Cell */}
                          <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {editingUser?.id === user.id ? (
                              <>
                                <input
                                  type="text" name="fullname" value={editingUser.fullname}
                                  onChange={handleEditChange} className={`${inputBaseClass} ${getEditValidationClass('fullname')}`} required
                                />
                                {editValidationErrors.fullname && (
                                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <MdError size={14}/> {editValidationErrors.fullname}
                                  </p>
                                )}
                              </>
                            ) : (
                              user.fullname
                            )}
                          </td>
                          {/* Email Cell */}
                          <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {editingUser?.id === user.id ? (
                              <>
                                <div className="relative">
                                  <input
                                    type="email" name="email" value={editingUser.email}
                                    onChange={handleEditChange} className={`${inputBaseClass} ${getEditValidationClass('email')}`} required
                                  />
                                  {editingUser.email && !editValidationErrors.email && validateEmail(editingUser.email).isValid && (
                                    <MdCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20}/>
                                  )}
                                </div>
                                {editValidationErrors.email && (
                                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <MdError size={14}/> {editValidationErrors.email}
                                  </p>
                                )}
                              </>
                            ) : (
                              user.email
                            )}
                          </td>
                          {/* Role Cell */}
                          <td className="py-3 px-4">
                            {editingUser?.id === user.id ? (
                              <select
                                name="role" value={editingUser.role} onChange={handleEditChange}
                                className={`${inputBaseClass} text-xs p-1 w-full sm:w-auto`}
                                aria-label={`Edit role for ${user.fullname}`}
                                disabled={String(currentUser.id) === String(user.id) || (user.role === 'Admin' && currentUser.role === 'Admin' && String(currentUser.id) !== String(user.id))}
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
                          {/* Department Cell */}
                          <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {editingUser?.id === user.id ? (
                              <>
                                {isLoadingDepartments ? (
                                    <div className="flex items-center">
                                      <LoadingSpinner size="sm" /> <span className="ml-1 text-xs">Loading...</span>
                                    </div>
                                ) : departments.length === 0 ? (
                                    <span className="text-red-500 text-xs">N/A</span>
                                ) : (
                                    <select
                                        name="department_id"
                                        value={editingUser.department_id || ''}
                                        onChange={handleEditChange}
                                        className={`${inputBaseClass} text-xs p-1 w-full sm:w-auto ${getEditValidationClass('department_id')}`}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                )}
                                {editValidationErrors.department_id && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <MdError size={14}/> {editValidationErrors.department_id}
                                    </p>
                                )}
                              </>
                            ) : (
                              user.department_name || 'N/A'
                            )}
                          </td>
                          {/* Status Cell */}
                          <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.status ? (darkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700')
                                              : (darkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700')
                              }`}>
                                  {user.status ? 'Active' : 'Inactive'}
                              </span>
                          </td>
                          {/* Phone Cell */}
                          <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {editingUser?.id === user.id ? (
                              <>
                                <div className="relative">
                                  <input
                                    type="tel" name="phone" value={editingUser.phone}
                                    onChange={handleEditChange} className={`${inputBaseClass} ${getEditValidationClass('phone')}`}
                                  />
                                  {editingUser.phone && !editValidationErrors.phone && validatePhone(editingUser.phone).isValid && (
                                    <MdCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={20}/>
                                  )}
                                </div>
                                {editValidationErrors.phone && (
                                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <MdError size={14}/> {editValidationErrors.phone}
                                  </p>
                                )}
                              </>
                            ) : (
                              user.phone || 'N/A'
                            )}
                          </td>
                          {/* DOB Cell */}
                          <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {editingUser?.id === user.id ? (
                              <input
                                type="date" name="dob" value={editingUser.dob ? editingUser.dob.substring(0, 10) : ''}
                                onChange={handleEditChange} className={inputBaseClass}
                              />
                            ) : (
                              user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'
                            )}
                          </td>
                          {/* Password Cell (Editable Field) */}
                          <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {editingUser?.id === user.id ? (
                              <>
                                <div className="relative">
                                  <input
                                    type={showEditPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={editingUser.newPassword}
                                    onChange={handleEditChange}
                                    className={`${inputBaseClass} pr-10 ${getEditValidationClass('newPassword')}`}
                                    placeholder="Leave blank to keep current"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    aria-label={showEditPassword ? "Hide new password" : "Show new password"}
                                  >
                                    {showEditPassword ? <MdVisibilityOff size={20}/> : <MdVisibility size={20}/>}
                                  </button>
                                </div>
                                {editingUser.newPassword && (
                                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                                    editPasswordStrength.color === 'green' ? 'text-green-500' :
                                    editPasswordStrength.color === 'orange' ? 'text-orange-500' : 'text-red-500'
                                  }`}>
                                    {editPasswordStrength.color === 'green' ? <MdCheckCircle size={14}/> : <MdError size={14}/>}
                                    {editPasswordStrength.message}
                                  </p>
                                )}
                                {editValidationErrors.newPassword && (
                                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <MdError size={14}/> {editValidationErrors.newPassword}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className={`${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>********</span>
                            )}
                          </td>
                          {/* Actions Cell */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 sm:gap-2 justify-center relative">
                              {editingUser?.id === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(user.id)}
                                    className={`${buttonBaseClass} ${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                    aria-label="Save changes"
                                    disabled={Object.values(editValidationErrors).some(err => err !== '')}
                                  >
                                    <MdSave /> <span className="hidden sm:inline">Save</span>
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className={`${buttonBaseClass} ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                                    aria-label="Cancel edit"
                                  >
                                    <MdCancel /> <span className="hidden sm:inline">Cancel</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setActiveActionMenuId(activeActionMenuId === user.id ? null : user.id)}
                                    className={`p-2 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                    aria-label={`Actions-for-${user.id}`}
                                    disabled={String(currentUser.id) === String(user.id) || user.role === 'Admin'}
                                  >
                                    <MdMoreVert size={20} />
                                  </button>
                                  {activeActionMenuId === user.id && (
                                    <div
                                      ref={actionMenuRef}
                                      className={`absolute right-full mr-2.5 top-1/2 -translate-y-1/2 w-48 rounded-md shadow-xl z-20
                                                  ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} border`}
                                    >
                                      <button
                                        onClick={() => setActiveActionMenuId(null)}
                                        aria-label="Close actions menu"
                                        className={`absolute top-1 right-1 p-1.5 rounded-full transition-colors
                                                    ${darkMode ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                      >
                                        <MdClose size={16} />
                                      </button>
                                      <div className="p-1.5 pt-7">
                                        <button
                                          onClick={() => handleEditUser(user)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-slate-200 hover:bg-blue-600 hover:text-white' : 'text-slate-700 hover:bg-blue-100 hover:text-blue-700'}`}
                                          disabled={String(currentUser.id) === String(user.id)}
                                        >
                                          <MdEdit className="text-base"/> Edit Details
                                        </button>
                                        <button
                                          onClick={() => handleToggleUserStatus(user)} // This function is called here
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${user.status
                                                          ? (darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700')
                                                          : (darkMode ? 'text-green-400 hover:bg-green-600 hover:text-white' : 'text-green-600 hover:bg-green-100 hover:text-green-700')
                                                      }`}
                                          disabled={String(currentUser.id) === String(user.id)}
                                        >
                                          {user.status ? <MdToggleOff className="text-base"/> : <MdToggleOn className="text-base"/>}
                                          {user.status ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                          onClick={() => handleForcePasswordReset(user.id, user.fullname)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-yellow-400 hover:bg-yellow-600 hover:text-white' : 'text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700'}`}
                                          disabled={String(currentUser.id) === String(user.id)}
                                        >
                                          <MdLockReset className="text-base"/> Reset Password
                                        </button>
                                        <div className={`my-1.5 h-px ${darkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                        {/* Delete button: Enabled by default, then conditionally disabled */}
                                        <button
                                          onClick={() => handleDeleteUser(user.id, user.fullname)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2.5 transition-colors
                                                      ${darkMode ? 'text-red-400 hover:bg-red-600 hover:text-white' : 'text-red-600 hover:bg-red-100 hover:text-red-700'}`}
                                          // Disable deletion of self or other Admins (as per backend logic)
                                          disabled={String(currentUser.id) === String(user.id) || user.role === 'Admin'}
                                        >
                                          <MdDelete className="text-base"/> Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className={`flex justify-between items-center px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                  </span>
                  <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                        ${currentPage === 1 && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${currentPage === page
                            ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                            : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                        ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                        ${currentPage === totalPages && 'opacity-50 cursor-not-allowed'}`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </>
            )}
          </div>
          
        </main>
      </div>
    </Layout>
  );
};

export default UserManagementPage;