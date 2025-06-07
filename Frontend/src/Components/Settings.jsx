import React, { useContext, useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';
import Layout from "../Components/Layout/Layout";

// Importing icons
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
  MdSchool,
  MdPersonOutline,
  MdTune,
  MdNotificationsNone,
  MdOutlineSave,
  MdWbSunny,
  MdModeNight,
  MdBackup,
  MdLogout,
  MdPeople,
  MdShoppingCart // ADDED: Icon for Staff Order Page
} from 'react-icons/md';
import LoadingSpinner from "../Components/LoadingSpinner";

// Simple Toggle Switch component (unchanged)
const ToggleSwitch = ({ id, checked, onChange, label, darkMode }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer select-none">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors duration-150
                        peer-checked:bg-indigo-500 dark:peer-checked:bg-indigo-600
                        ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
        ></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-150
                        peer-checked:transform peer-checked:translate-x-full`}
        ></div>
      </div>
      {label && <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>}
    </label>
  );
};


function Settings() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { currentUser, isLoadingAuth, logout: authLogout } = useAuth();


  const [profileInfo, setProfileInfo] = useState({
    newName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser) {
      setProfileInfo(prev => ({
        ...prev,
        newName: currentUser.fullname || '',
        email: currentUser.email || '',
      }));
    }
  }, [currentUser]);

  const [inventoryPrefs, setInventoryPrefs] = useState({
    lowStockThreshold: '5',
    defaultCategory: 'Stationery',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
  });


  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileInfo(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (profileInfo.newName && profileInfo.newName.trim().length < 2) {
      newErrors.newName = "Name must be at least 2 characters";
    }

    if (!profileInfo.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(profileInfo.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (profileInfo.newPassword) {
      if (!profileInfo.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }

      if (profileInfo.newPassword.length < 8) {
        newErrors.newPassword = "New password must be at least 8 characters";
      }

      if (profileInfo.newPassword !== profileInfo.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrefsChange = (e) => {
    setInventoryPrefs(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };


  const handleSaveChanges = async () => {
    if (!currentUser) {
      console.error("No current user data available for update.");
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User data not loaded. Please try refreshing or logging in again.',
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
      });
      return;
    }

    if (!validateForm()) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Failed',
            text: 'Please correct the errors in the form.',
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#e2e8f0' : '#1e293b',
            confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
        });
        return;
    }

    try {
      const updateData = {
        ...(profileInfo.newName && profileInfo.newName.trim() !== (currentUser.fullname || '')) && { fullname: profileInfo.newName.trim() },
        email: profileInfo.email,
        ...(profileInfo.newPassword && {
          currentPassword: profileInfo.currentPassword,
          newPassword: profileInfo.newPassword
        })
      };

      if (Object.keys(updateData).length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Changes',
          text: 'No profile details were updated.',
          background: darkMode ? '#1e293b' : '#ffffff',
          color: darkMode ? '#e2e8f0' : '#1e293b',
          confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
        });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. User not authenticated.");
        return;
      }

      await axios.put("http://localhost:3000/auth/update-profile", updateData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile has been successfully updated.',
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
      });

      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);

      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || error.message || 'Failed to update profile. Please try again.',
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#1e293b',
        confirmButtonColor: darkMode ? '#4f46e5' : '#6366f1',
      });
    }
  };

  const swalThemeProps = {
    background: darkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    color: darkMode ? '#e2e8f0' : '#1e293b',
    customClass: {
      popup: 'rounded-xl shadow-2xl p-4 sm:p-6',
      confirmButton: `px-5 py-2.5 rounded-lg font-semibold text-white text-sm ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'}`,
      cancelButton: `px-5 py-2.5 rounded-lg font-semibold text-sm ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`,
      title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`,
      htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`,
      icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4',
    },
    buttonsStyling: false,
    backdrop: `rgba(0,0,0,0.65)`
  };

  const handleLogout = () => {
    Swal.fire({
      ...swalThemeProps,
      title: 'Log Out?',
      html: `
        <div class="flex flex-col items-center gap-4">
          <span class="${darkMode ? 'text-yellow-300' : 'text-yellow-500'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </span>
          <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center">
            Are you sure you want to end your session?<br>You’ll need to log in again to access your account.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log me out',
      cancelButtonText: 'Cancel',
      reverseButtons: false,
      focusCancel: true,
      customClass: {
        popup: darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900',
        actions: 'flex justify-center gap-4 mt-6',
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow',
        cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        authLogout();
        navigate("/login");
      }
    });
  };
  const handleBackup = () => alert("Backup initiated (mock)!");
  const handleImport = () => alert("Import functionality coming soon (mock)");


  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md')
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  const cardBaseClass = `rounded-xl shadow-lg p-6 sm:p-8 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`;
  const cardTitleClass = `text-xl font-semibold mb-6 flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`;

  const formGroupClass = "flex flex-col gap-1.5";
  const labelClass = `block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const inputBaseClass = `w-full px-3.5 py-2.5 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none
                        ${darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
                                  : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'}`;


  // --- Render based on loading state of AuthContext ---
  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        Loading authentication...
      </div>
    );
  }

  // If not authenticated after loading, redirect to login
  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  // NEW: Staff Orders link visibility (MOVED INSIDE COMPONENT)
  const canViewOrders = ['Admin', 'Staff', 'DepartmentHead', 'StockManager'];
  const showOrdersLink = useMemo(() => {
    return canViewOrders.includes(currentUser?.role);
  }, [currentUser?.role]);


  return (
    <Layout>
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header (Same structure, title changed) */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300 print:hidden
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <MdSettings size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              Application Settings
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Dark Mode"
              className={`p-2.5 rounded-full transition-colors duration-300
                          ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-slate-200 hover:bg-slate-300 text-indigo-600'}`}
            >
              {darkMode ? <MdWbSunny size={22}/> : <MdModeNight size={22} />}
            </button>
          </div>
        </header>

        {/* Page Content for Settings */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Profile Information Card */}
             <section className={cardBaseClass}>
    <h3 className={cardTitleClass}>
    <MdPersonOutline className="text-2xl text-sky-500" />
    Profile Information
  </h3>

  {!currentUser ? (
    <div className="flex justify-center py-8">
      <LoadingSpinner />
    </div>
  ) : (
    <div className="space-y-5">
      {/* Current Name Display */}
      <div className={formGroupClass}>
        <label className={labelClass}>Current Name</label>
        <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-md">
          <p className="text-gray-800 dark:text-gray-200">
            {currentUser.fullname || 'Not specified'}
          </p>
        </div>
      </div>


    {/* New Name Input */}
    <div className={formGroupClass}>
      <label htmlFor="newName" className={labelClass}>New Name</label>
      <input
        type="text"
        id="newName"
        name="newName"
        value={profileInfo.newName}
        onChange={handleProfileChange}
        placeholder="Enter new name"
        className={inputBaseClass}
      />
      {errors.newName && <p className="text-red-500 text-sm mt-1">{errors.newName}</p>}
    </div>

    {/* Email Address */}
    <div className={formGroupClass}>
      <label htmlFor="email" className={labelClass}>Email Address</label>
      <input
        type="email"
        id="email"
        name="email"
        value={profileInfo.email}
        onChange={handleProfileChange}
        placeholder="e.g. user@school.edu"
        className={inputBaseClass}
      />
      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
    </div>

    {/* Password Change Section */}
    <div className="space-y-4 border-t pt-4 border-gray-200 dark:border-slate-700">
      <h4 className="font-medium text-gray-700 dark:text-gray-300">Password Change</h4>

      {/* Current Password */}
      <div className={formGroupClass}>
        <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={profileInfo.currentPassword}
          onChange={handleProfileChange}
          placeholder="Enter current password"
          className={inputBaseClass}
        />
        {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
      </div>

      {/* New Password */}
      <div className={formGroupClass}>
        <label htmlFor="newPassword" className={labelClass}>New Password</label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={profileInfo.newPassword}
          onChange={handleProfileChange}
          placeholder="Enter new password (min 8 characters)"
          className={inputBaseClass}
        />
        {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
      </div>

      {/* Confirm New Password */}
      <div className={formGroupClass}>
        <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={profileInfo.confirmPassword}
          onChange={handleProfileChange}
          placeholder="Confirm new password"
          className={inputBaseClass}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>
    </div>
  </div>
  )}
</section>

              {/* Inventory Preferences Card */}
              <section className={cardBaseClass}>
                <h3 className={cardTitleClass}>
                  <MdTune className="text-2xl text-emerald-500" />
                  Inventory Preferences
                </h3>
                <div className="space-y-5">
                  <div className={formGroupClass}>
                    <label htmlFor="lowStockThreshold" className={labelClass}>Low Stock Alert Threshold</label>
                    <input type="number" id="lowStockThreshold" name="lowStockThreshold" value={inventoryPrefs.lowStockThreshold} onChange={handlePrefsChange} min="0" placeholder="e.g., 5" className={inputBaseClass} />
                  </div>
                  <div className={formGroupClass}>
                    <label htmlFor="defaultCategory" className={labelClass}>Default Category for New Items</label>
                    <select id="defaultCategory" name="defaultCategory" value={inventoryPrefs.defaultCategory} onChange={handlePrefsChange} className={`${inputBaseClass} ${inventoryPrefs.defaultCategory === "" ? (darkMode ? 'text-slate-400':'text-slate-500') : ''}`}>
                      <option value="">None</option>
                      <option value="Stationery">Stationery</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Lab Equipment">Lab Equipment</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Books">Books</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                   <div className="pt-2">
                    <ToggleSwitch
                        id="darkModeToggleSettingsPage"
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                        label="Enable Dark Mode"
                        darkMode={darkMode}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Notification Settings Card */}
              <section className={cardBaseClass}>
                <h3 className={cardTitleClass}>
                  <MdNotificationsNone className="text-2xl text-amber-500" />
                  Notification Settings
                </h3>
                <div className="space-y-4">
                    <ToggleSwitch
                        id="emailAlertsToggle"
                        checked={notificationSettings.emailAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({...prev, emailAlerts: e.target.checked}))}
                        label="Receive Email Alerts for Low Stock"
                        darkMode={darkMode}
                    />
                    {/* Add more notification toggles here */}
                </div>
              </section>

              {/* Backup & Restore Card */}
              <section className={cardBaseClass}>
                <h3 className={cardTitleClass}>
                  <MdBackup className="text-2xl text-fuchsia-500" />
                  Backup & Restore
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleBackup}
                    className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors
                                ${darkMode ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                  > <MdBackup/> Backup Data </button>
                  <button
                    onClick={handleImport}
                    className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors
                                ${darkMode ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-teal-500 hover:bg-teal-600 text-white'}`}
                  > <MdSettings className="-rotate-90"/> Import Backup </button>
                </div>
              </section>
            </div>


            {/* Save Changes and Logout Buttons */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t mt-4 ${darkMode ? 'border-slate-700' : 'border-slate-200'}">
              <button
                onClick={handleLogout}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold transition-colors
                            ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              > <MdLogout /> Logout </button>
              <button
                onClick={handleSaveChanges}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out group
                            ${darkMode
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100'
                            } hover:shadow-lg active:scale-95`}
              > <MdOutlineSave className="text-lg" /> Save All Changes </button>
            </div>

          </div>
        </main>
      </div>
    </div>
    </Layout>
  );
}

export default Settings;