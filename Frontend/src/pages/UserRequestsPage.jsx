import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import axios from "axios";
import Layout from "../Components/Layout/Layout";
import LoadingSpinner from "../Components/LoadingSpinner";

// Icons
import {
  MdPeople, MdCheckCircle, MdError, MdPersonAdd,
  MdSort, MdArrowUpward, MdArrowDownward, MdVerifiedUser, MdBlock, MdApartment,
  MdHelpOutline // Added for generic info icon
} from 'react-icons/md'; // Ensure MdHelpOutline is imported

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const UserRequestsPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();

  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [departments, setDepartments] = useState([]); 
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at'); 
  const [sortOrder, setSortOrder] = useState('desc'); // Changed default to desc for recent requests
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Define swalThemeProps using useMemo for consistency and performance
  const swalThemeProps = useMemo(() => ({
    background: darkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)', // Modal background
    color: darkMode ? '#e2e8f0' : '#1e293b', // Modal text color
    customClass: {
      popup: 'rounded-xl shadow-2xl p-4 sm:p-6', // General popup styling
      confirmButton: `px-5 py-2.5 rounded-lg font-semibold text-white text-sm ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'}`,
      cancelButton: `px-5 py-2.5 rounded-lg font-semibold text-sm ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`,
      title: `text-lg sm:text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`,
      htmlContainer: `text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`,
      icon: 'text-4xl sm:text-5xl mt-2 mb-2 sm:mb-4',
    },
    buttonsStyling: false, // Disable default SweetAlert2 button styling to use custom classes
    backdrop: `rgba(0,0,0,0.65)` // Semi-transparent overlay
  }), [darkMode]);


  const fetchDepartments = useCallback(async () => {
    setIsLoadingDepartments(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return; 
      const response = await axios.get(`${API_BASE_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Frontend: Failed to fetch departments for UserRequestsPage:", error);
      Swal.fire({
        ...swalThemeProps, // Apply dark mode theme
        title: 'Warning',
        text: 'Could not load department names for display. User requests can still be processed.',
        icon: 'warning',
      });
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [swalThemeProps]); // Use swalThemeProps as dependency

  const fetchPendingUsers = useCallback(async () => {
    setIsLoadingRequests(true);
    setPendingUsers([]); 
    console.log('Frontend: Attempting to fetch pending users...');
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('No token found. Please log in again.'); }

      const response = await axios.get(`${API_BASE_URL}/auth/admin/user-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Frontend: Received response for pending users:', response.data);

      const usersWithDeptNames = response.data.map(user => ({
        ...user,
        status: user.status === 1 ? true : false, 
        department_name: user.department_name || departments.find(d => d.id === user.department_id)?.name || 'N/A'
      }));
      setPendingUsers(usersWithDeptNames);
      console.log('Frontend: Set pending users state with', usersWithDeptNames.length, 'users.');

      setCurrentPage(prev => {
        const newTotalPages = Math.ceil(response.data.length / usersPerPage);
        return prev > newTotalPages && newTotalPages > 0 ? newTotalPages : ( newTotalPages === 0 ? 1 : prev);
      });
    } catch (error) {
      console.error("Frontend: Failed to fetch user requests:", error);
      if (error.response?.status !== 404) {
         Swal.fire({
            ...swalThemeProps, // Apply dark mode theme
            title: 'Error Fetching Requests',
            text: error.response?.data?.message || 'Could not load user requests.',
            icon: 'error',
         });
      }
    } finally {
      setIsLoadingRequests(false);
    }
  }, [usersPerPage, departments, swalThemeProps]); // Use swalThemeProps as dependency

  useEffect(() => {
    if (!isLoadingAuth && currentUser && currentUser.role === 'Admin') {
      fetchDepartments(); 
    } else if (!isLoadingAuth) {
      setIsLoadingRequests(false);
      setIsLoadingDepartments(false);
    }
  }, [currentUser, isLoadingAuth, fetchDepartments]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser && currentUser.role === 'Admin' && !isLoadingDepartments) {
      fetchPendingUsers();
    }
  }, [isLoadingDepartments, isLoadingAuth, currentUser, fetchPendingUsers]);


  const usersOnCurrentPage = useMemo(() => {
    let tempUsers = [...pendingUsers];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      tempUsers = tempUsers.filter(user =>
        user.fullname?.toLowerCase().includes(lowerSearch) ||
        user.email?.toLowerCase().includes(lowerSearch) ||
        user.role?.toLowerCase().includes(lowerSearch) ||
        user.department_name?.toLowerCase().includes(lowerSearch)
      );
    }
    
    tempUsers.sort((a, b) => {
      const aValue = String(a[sortBy] || '').toLowerCase();
      const bValue = String(b[sortBy] || '').toLowerCase();
      if (sortBy === 'created_at') {
        const dateA = new Date(a[sortBy]);
        const dateB = new Date(b[sortBy]);
        if (isNaN(dateA) || isNaN(dateB)) return 0; 
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;

    return tempUsers.slice(indexOfFirstUser, indexOfLastUser);

  }, [pendingUsers, searchTerm, sortBy, sortOrder, currentPage, usersPerPage]);

  const totalFilteredUsers = useMemo(() => {
    if (!searchTerm) return pendingUsers.length;
    const lowerSearch = searchTerm.toLowerCase();
    return pendingUsers.filter(user =>
      user.fullname?.toLowerCase().includes(lowerSearch) ||
      user.email?.toLowerCase().includes(lowerSearch) ||
      user.role?.toLowerCase().includes(lowerSearch) ||
      user.department_name?.toLowerCase().includes(lowerSearch)
    ).length;
  }, [pendingUsers, searchTerm]);


  const totalPages = Math.max(1, Math.ceil(totalFilteredUsers / usersPerPage));
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) { 
      setCurrentPage(totalPages);
    } else if (totalPages === 0) { 
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);


  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleSort = (column) => {
    setCurrentPage(1);
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const processRequest = async (user, action /* 'approve' or 'reject' */) => {
    const isApprove = action === 'approve';
    const newStatus = isApprove ? 'active' : 'rejected'; 

    const title = isApprove ? 'Approve User Request?' : 'Reject User Request?';
    const confirmButtonText = isApprove ? 'Yes, Approve' : 'Yes, Reject';
    
    // Icon and text for the HTML content
    const iconSvg = isApprove ? 
      `<svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
       </svg>` : 
      `<svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
       </svg>`;
    
    const descriptionText = isApprove
      ? `This will grant "${user.fullname}" access to the system with the role of "${user.role}".`
      : `This will permanently deny "${user.fullname}" access to the system. You can re-enable them later if needed.`;

    const result = await Swal.fire({
      ...swalThemeProps, // Inherit base theme
      title: title,
      html: `
        <div class="flex flex-col items-center gap-4">
          <span class="${isApprove ? (darkMode ? 'text-green-300' : 'text-green-500') : (darkMode ? 'text-red-300' : 'text-red-500')}">
            ${iconSvg}
          </span>
          <p class="text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-center">
            Are you sure you want to ${isApprove ? 'approve' : 'reject'} this request for "${user.fullname}"?
            <br>${descriptionText}
          </p>
        </div>
      `,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancel',
      // Override customClass for buttons for specific colors here
      customClass: {
        ...swalThemeProps.customClass, // Keep general custom classes
        confirmButton: `px-5 py-2.5 rounded-lg font-semibold text-white text-sm ${isApprove ? (darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600') : (darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600')}`,
        cancelButton: `px-5 py-2.5 rounded-lg font-semibold text-sm ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`,
        actions: 'flex justify-center gap-4 mt-6', // Added for button spacing
      },
      buttonsStyling: false, // Important: disable default styling to use customClass
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (!token) { throw new Error('Authentication token not found.'); }

        // Optimistically update UI
        setPendingUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));

        await axios.put(apiEndpoint, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
        
        Swal.fire({
            ...swalThemeProps, // Apply dark mode theme
            title: isApprove ? 'Approved!' : 'Rejected!',
            text: isApprove ? 
              `User "${user.fullname}" has been approved and activated.` : 
              `User "${user.fullname}"'s request has been rejected.`,
            icon: 'success',
        });

      } catch (error) {
        fetchPendingUsers(); // Revert UI if API call fails
        console.error(`Frontend: Failed to ${action} request:`, error);
        Swal.fire({
            ...swalThemeProps, // Apply dark mode theme
            title: 'Error',
            text: error.response?.data?.message || error.message || `Failed to ${action} user request.`,
            icon: 'error',
        });
      }
    }
  };

  const handleApproveRequest = (user) => processRequest(user, 'approve');
  const handleRejectRequest = (user) => processRequest(user, 'reject');


  const inputBaseClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none ${
    darkMode
      ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100'
      : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
  }`;

  const buttonBaseClass = "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5";

  if (isLoadingAuth || isLoadingRequests || isLoadingDepartments) {
    return (
       <Layout>
          <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
             <LoadingSpinner size="lg" />
             <p className={`ml-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
               {isLoadingAuth ? 'Authenticating...' : (isLoadingDepartments ? 'Loading departments...' : 'Loading user requests...')}
             </p>
           </div>
        </Layout>
    );
  }

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
  
  const firstItemIndex = totalFilteredUsers > 0 ? (currentPage - 1) * usersPerPage + 1 : 0;
  const lastItemIndex = Math.min(currentPage * usersPerPage, totalFilteredUsers);


  return (
    <Layout>
       {/* Header needs to account for sidebar width - dynamically adjust 'left' */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 right-0 z-40 
             ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} 
             shadow-sm 
             left-[var(--sidebar-width,250px)] `}
            style={{ left: '250px' }}
         > 
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <MdPersonAdd size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              Pending User Requests ({pendingUsers.length})
            </h2>
          </div>
           <button 
                onClick={fetchPendingUsers}
                 className={`${buttonBaseClass} ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
             >
                 Refresh
             </button>
        </header>

         <main className="flex-1 p-6 pt-[104px] ml-[250px] overflow-y-auto max-w-full"
             style={{ marginLeft: '250px' }}
        >
          
          {/* Search, Sort & Pagination Controls */}
          <div className={`mb-4 p-4 rounded-lg shadow-md flex flex-wrap gap-4 items-center justify-between ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="flex-1 min-w-[200px] max-w-md">
              <label htmlFor="searchRequests" className="sr-only">Search requests</label>
              <input
                id="searchRequests"
                type="text"
                placeholder="Search by name, email, role, or department..."
                value={searchTerm}
                 onChange={(e) => {
                   setSearchTerm(e.target.value);
                   setCurrentPage(1); 
                 }}
                className={`${inputBaseClass} text-sm`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Requests per page:</span>
              <select
                value={usersPerPage}
                 onChange={(e) => { 
                   setUsersPerPage(Number(e.target.value)); 
                   setCurrentPage(1);
                  }}
                className={`${inputBaseClass} w-auto text-sm p-1.5`}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* User Requests Table */}
          <div className={`w-full rounded-xl shadow-xl p-0 overflow-hidden ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
             {totalFilteredUsers === 0 ? (
                 <div className={`p-10 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     <MdPeople size={48} className="mx-auto mb-3 opacity-70"/>
                     <p className="font-medium text-lg">
                         { pendingUsers.length === 0 ? "No pending user requests." : "No requests match your search."}
                      </p>
                     <p className="text-sm">
                          { pendingUsers.length === 0 
                             ? "All new user registrations are currently approved or no new requests have been made."
                             : "Try adjusting your search term."
                           }
                     </p>
                  </div>
             ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} text-xs uppercase tracking-wider`}>
                      <tr>
                        {[
                          { key: 'fullname', label: 'Full Name' },
                          { key: 'email', label: 'Email', hiddenClass: 'hidden sm:table-cell' },
                           { key: 'created_at', label: 'Requested On', hiddenClass: 'hidden xl:table-cell'},
                          { key: 'role', label: 'Requested Role' },
                          { key: 'department_name', label: 'Department', hiddenClass: 'hidden md:table-cell' },
                          { key: 'phone', label: 'Phone', hiddenClass: 'hidden lg:table-cell' },
                        ].map(({ key, label, hiddenClass }) => (
                          <th
                            key={key}
                             scope="col"
                            className={`py-3 px-4 text-left text-xs uppercase font-semibold cursor-pointer ${hiddenClass || ''}`}
                            onClick={() => handleSort(key)}
                          >
                            <div className="flex items-center gap-1">
                              {label}
                              {sortBy === key ? (
                                sortOrder === 'asc' ? <MdArrowUpward size={16} /> : <MdArrowDownward size={16} />
                              ) : (
                                 <MdSort size={16} className="text-slate-400 opacity-50"/>
                              )}
                            </div>
                          </th>
                        ))}
                        <th scope="col" className="py-3 px-4 text-center text-xs uppercase font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                       {usersOnCurrentPage.map((user) => (
                        <tr key={user.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'}`}>
                          <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{user.fullname || '-'}</td>
                          <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{user.email || '-'}</td>
                           <td className={`py-3 px-4 hidden xl:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {user.created_at ? new Date(user.created_at).toLocaleString() : '-'}
                           </td>
                          <td className="py-3 px-4">
                             {user.role ? (
                                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                     user.role === 'Admin' ? (darkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700')
                                     : user.role === 'Staff' ? (darkMode ? 'bg-sky-500/30 text-sky-300' : 'bg-sky-100 text-sky-700')
                                     : user.role === 'DepartmentHead' ? (darkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                                     : user.role === 'StockManager' ? (darkMode ? 'bg-teal-500/30 text-teal-300' : 'bg-teal-100 text-teal-700')
                                     : (darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600')
                                   }`}>
                                   {user.role}
                                 </span>
                              ) : '-'}
                          </td>
                           <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {user.department_name || 'N/A'}
                           </td>
                          <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user.phone || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleApproveRequest(user)}
                                className={`${buttonBaseClass} ${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                aria-label={`Approve request for ${user.fullname}`}
                                title="Approve"
                              >
                                <MdCheckCircle className="text-lg" /> <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectRequest(user)}
                                className={`${buttonBaseClass} ${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                aria-label={`Reject request for ${user.fullname}`}
                                 title="Reject"
                              >
                                <MdBlock className="text-lg" /> <span className="hidden sm:inline">Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className={`flex flex-col sm:flex-row gap-3 justify-between items-center px-4 py-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                     Showing {firstItemIndex} to {lastItemIndex} of {totalFilteredUsers} requests
                  </span>
                   {totalPages > 1 && (
                    <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                          ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                          ${currentPage <= 1 && 'opacity-50 cursor-not-allowed'}`}
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
                              ? (darkMode ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-indigo-500 border-indigo-600 text-white z-10')
                              : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                          ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}
                          ${currentPage >= totalPages && 'opacity-50 cursor-not-allowed'}`}
                      >
                        Next
                      </button>
                    </nav>
                   )}
                </div>
              </>
            )}
          </div>
        </main>
    </Layout>
  );
};

export default UserRequestsPage;