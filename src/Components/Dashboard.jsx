import React, { useContext, useEffect, useState, useRef} from "react"; // Added useRef
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios"; // Keep if you plan to use it for actual API calls
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { MdMenu, MdClose } from "react-icons/md";
// Importing icons
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
  MdSchool,
  MdLogout,
  MdWbSunny,
  MdModeNight,
  MdOutlineCategory,
  MdErrorOutline,
  MdWarningAmber,
  MdQueryStats,
  MdOutlineBarChart,
  MdAddCircleOutline,
  MdPieChartOutline,
  MdAccountCircle, MdHelpOutline
} from "react-icons/md";

import CategoryPieChart from './CategoryPieChart'; // Adjust path if needed
import LoadingSpinner from "../Components/LoadingSpinner"; // Adjust path if needed

// Assuming StatCardSkeleton is defined elsewhere or you'll add it


const StatCardSkeleton = ({ darkMode }) => (
  <div className={`p-5 sm:p-6 rounded-xl shadow-lg animate-pulse ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
    <div className={`h-4 w-3/4 mb-3 rounded ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
    <div className={`h-8 w-1/2 rounded ${darkMode ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
  </div>
);


const Dashboard = () => {
  const { items, loading: itemsLoading, error: itemsError, fetchItems } = useContext(InventoryContext); // Assuming context provides fetchItems
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [categoryData, setCategoryData] = useState([]);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Refs for click-outside detection for profile dropdown
  const profileButtonRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const lowStockCount = items.filter(item => item.quantity > 0 && item.quantity < 5).length;
  const outOfStockCount = items.filter(item => item.quantity === 0).length;

  useEffect(() => {
    if (items.length > 0) {
      const categoryCounts = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + item.quantity;
        return acc;
      }, {});
      const formattedData = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setCategoryData(formattedData.length > 0 ? formattedData : [{ name: 'No Data', value: 1 }]);
    } else if (!itemsLoading) {
      setCategoryData([{ name: 'No Items Yet', value: 1 }]);
    }
  }, [items, itemsLoading]);

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

  const handleThemeSwitch = () => setDarkMode(!darkMode);

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
         localStorage.removeItem("token");
         // Update auth state
         navigate("/login");
       }
     });
   };



  // Effect for user authentication check
  useEffect(() => {
    const fetchUser = async () => {
      setAuthLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        setAuthLoading(false);
        return;
      }
      try {
        // Replace with your actual API call for token validation
        // For demo: assume token means authenticated
        // const response = await axios.get("YOUR_AUTH_VALIDATION_ENDPOINT", { 
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        // if (response.status === 200) {
        //   setUserAuthenticated(true);
        //   if (fetchItems) fetchItems(); // Fetch items after successful auth
        // } else {
        //   throw new Error(`Authentication failed: Status ${response.status}`);
        // }
        console.log("Simulating user auth check with token:", token ? "Token found" : "No token");
        if (token) {
            setUserAuthenticated(true);
            if (fetchItems) fetchItems(); // Fetch items if authenticated
        } else {
            navigate("/login");
        }

      } catch (err) {
        console.error("Dashboard auth error:", err);
        localStorage.removeItem("token");
        navigate("/login");
        Swal.fire({
            ...swalThemeProps, icon: "error", title: "Authentication Failed", 
            text: "Your session may have expired. Please log in again."
        });
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, [navigate, fetchItems]); // Added fetchItems to dependency array

  // Effect to handle clicks outside the profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileOpen &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target) &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const sidebarLinkClass = ({ isActive }) => {
    const baseClasses = "px-5 py-3.5 transition-colors duration-150 flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 select-none";
    if (isActive) {
      return `${baseClasses} ${darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md'}`;
    } else {
      return `${baseClasses} ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/75' : 'text-indigo-100 hover:text-white hover:bg-white/20'}`;
    }
  };
  const sidebarIconClass = "text-xl";

  const statCards = [
    { title: "Total Items", value: items.length, Icon: MdQueryStats, color: "blue", link: "/viewitems" },
    { title: "Low Stock", value: lowStockCount, Icon: MdWarningAmber, color: "yellow", link: "/inventory?filter=lowstock" },
    { title: "Out of Stock", value: outOfStockCount, Icon: MdErrorOutline, color: "red", link: "/inventory?filter=outofstock" },
    { title: "Categories", value: new Set(items.map(i => i.category || 'Uncategorized')).size, Icon: MdOutlineCategory, color: "green", link: null },
  ];
  
  if (authLoading || (itemsLoading && userAuthenticated)) { // Show loader if auth is happening, or if user is auth'd but items are still loading
    return (
        <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
            <LoadingSpinner size="lg" />
        </div>
    );
  }

  if (!userAuthenticated && !authLoading) { // Only redirect or show nothing if auth has completed and failed
      // navigate("/login") is already handled in useEffect, so this can be null or a specific message
      return null; 
  }

  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-[250px] h-full flex flex-col z-50 transition-colors duration-300 shadow-xl
                       ${darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-r border-indigo-700'}`}>
        <div className="flex items-center justify-between h-20 border-b border-white/20 px-4">
          <div className="flex items-center">
            <MdSchool className={`text-3xl ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
            <h1 className={`ml-3 text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-white'}`}>School IMS</h1>
          </div>
          <button 
            className="md:hidden p-2 rounded-lg focus:outline-none focus:ring-2" // Hamburger for mobile overlay (appears in sidebar header)
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <MdClose className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-white'}`} />
            ) : (
              <MdMenu className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-white'}`} />
            )}
          </button>
        </div>
        <nav className="flex-grow pt-5">
          <NavLink to="/dashboard" className={sidebarLinkClass}><MdDashboard className={sidebarIconClass} /> Dashboard</NavLink>
          <NavLink to="/inventory" className={sidebarLinkClass}><MdInventory className={sidebarIconClass} /> Inventory</NavLink>
          <NavLink to="/AddItemsForm" className={sidebarLinkClass}><MdAddBox className={sidebarIconClass} /> Add Items</NavLink>
          <NavLink to="/viewitems" className={sidebarLinkClass}><MdList className={sidebarIconClass} /> View Items</NavLink>
          <NavLink to="/reports" className={sidebarLinkClass}><MdAssessment className={sidebarIconClass} /> Reports</NavLink>
          <NavLink to="/settings" className={sidebarLinkClass}><MdSettings className={sidebarIconClass} /> Settings</NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
             <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <MdDashboard size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              Dashboard Overview
            </h2>
            {/* Hamburger for mobile overlay (appears in main header) */}
            <button 
              className="md:hidden p-2 rounded-lg focus:outline-none focus:ring-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <MdClose className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              ) : (
                <MdMenu className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              )}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleThemeSwitch}
              aria-label="Toggle Dark Mode"
              className={`p-2.5 rounded-full transition-colors duration-300 focus-visible:ring-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400 focus-visible:ring-yellow-400' : 'bg-slate-200 hover:bg-slate-300 text-indigo-600 focus-visible:ring-indigo-500'}`}
            >
              {darkMode ? <MdWbSunny size={22}/> : <MdModeNight size={22} />}
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                ref={profileButtonRef} // Attach ref to the button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-full p-1.5 pr-3 transition-colors`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                  <MdAccountCircle size={20}/>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Admin</span>
              </button>
              
              {profileOpen && (
                <div 
                  ref={profileDropdownRef} // Attach ref to the dropdown menu
                  className={`absolute right-0 top-12 w-48 py-2 rounded-lg shadow-xl z-50 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                  // Removed onMouseLeave for more robust click-outside behavior
                >
                  <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}>
                    <MdAccountCircle size={18}/> Profile
                  </button>
                  <button 
                    onClick={() => {
                      navigate("/settings");
                      setProfileOpen(false); // Close dropdown on navigation
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
                  >
                    <MdSettings size={18}/> Settings
                  </button>
                  <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}>
                    <MdHelpOutline size={18}/> Help
                  </button>
                  <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} my-1`}></div>
                  <button 
                    onClick={() => {
                      handleLogout(); // handleLogout will show Swal
                      setProfileOpen(false); // Explicitly close dropdown
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-red-400' : 'hover:bg-slate-100 text-red-600'}`}
                  >
                    <MdLogout size={18}/> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay (for main navigation on small screens) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden"> {/* md:hidden ensures it's only for mobile */}
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setMobileMenuOpen(false)} // Click backdrop to close
            />
            <div className={`absolute top-0 left-0 w-64 h-full ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-indigo-600 to-indigo-700'} shadow-xl flex flex-col`}>
              <div className="flex items-center justify-between h-20 border-b border-white/20 px-4">
                <div className="flex items-center">
                  <MdSchool className={`text-3xl ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
                  <h1 className={`ml-3 text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-white'}`}>School IMS</h1>
                </div>
                <button 
                  className="p-2 rounded-lg focus:outline-none focus:ring-2"
                  onClick={() => setMobileMenuOpen(false)} // Close button for mobile overlay
                >
                  <MdClose className={`text-2xl ${darkMode ? 'text-slate-300' : 'text-white'}`} />
                </button>
              </div>
              <nav className="flex-grow pt-5 overflow-y-auto">
                {/* Close mobile menu when a link is clicked */}
                <NavLink to="/dashboard" className={sidebarLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  <MdDashboard className={sidebarIconClass} /> Dashboard
                </NavLink>
                <NavLink to="/inventory" className={sidebarLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  <MdInventory className={sidebarIconClass} /> Inventory
                </NavLink>
                <NavLink to="/AddItemsForm" className={sidebarLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  <MdAddBox className={sidebarIconClass} /> Add Items
                </NavLink>
                <NavLink to="/viewitems" className={sidebarLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  <MdList className={sidebarIconClass} /> View Items
                </NavLink>
                <NavLink to="/reports" className={sidebarLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  <MdAssessment className={sidebarIconClass} /> Reports
                </NavLink>
                <NavLink to="/settings" className={sidebarLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  <MdSettings className={sidebarIconClass} /> Settings
                </NavLink>
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto"> {/* 80px header + 24px top padding for content = 104px */}
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className={`p-6 rounded-xl shadow-lg flex items-start sm:items-center gap-4 sm:gap-6
                            ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'}`}>
              <span className={`text-4xl sm:text-5xl mt-1 sm:mt-0 p-3 rounded-full ${darkMode ? 'bg-indigo-500 text-white' : 'bg-white/25'}`}>👋</span>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-white'}`}>Welcome back!</h1>
                <p className={`${darkMode ? 'text-slate-300' : 'text-indigo-100'} mt-1 text-sm sm:text-base`}>
                  Here's your inventory at a glance. Manage items, view reports, and stay organized.
                </p>
              </div>
            </div>

            {/* Statistic Cards */}
            {itemsLoading && userAuthenticated ? ( // Show skeletons if user is auth'd and items are loading
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <StatCardSkeleton key={`skeleton-${i}`} darkMode={darkMode} />)}
              </div>
            ) : itemsError && userAuthenticated ? ( // Show error if user is auth'd and items failed to load
              <div className={`col-span-full text-center py-10 rounded-xl shadow-lg p-6 ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600'}`}>
                <MdErrorOutline size={48} className="mx-auto mb-3"/>
                <p className="font-semibold text-lg">Error loading inventory data.</p>
                <p className="text-sm">{itemsError.message || "Please try refreshing the page."}</p>
              </div>
            ) : !itemsLoading && items.length === 0 && userAuthenticated ? ( // Show no items message if user is auth'd and items loaded empty
              <div className={`col-span-full text-center py-10 rounded-xl shadow-lg p-6 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
                <MdInventory size={48} className="mx-auto mb-3"/>
                <p className="font-semibold text-lg">No items in your inventory yet.</p>
                <p className="text-sm">Click "Add New Item" to get started!</p>
              </div>
            ) : userAuthenticated && items.length > 0 ? ( // Display stat cards if user is auth'd and items are loaded
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                  <div
                    key={card.title}
                    onClick={() => card.link && navigate(card.link)}
                    className={`p-5 sm:p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-t-4
                                ${card.link ? 'cursor-pointer' : 'cursor-default'}
                                ${darkMode ? `bg-slate-800 border-${card.color}-600 hover:border-${card.color}-500` 
                                          : `bg-white border-${card.color}-400 hover:border-${card.color}-500`}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-base font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{card.title}</h3>
                      <div className={`p-2 rounded-full ${darkMode ? `bg-${card.color}-500/20 text-${card.color}-400` : `bg-${card.color}-100 text-${card.color}-600`}`}>
                        <card.Icon className="text-2xl" />
                      </div>
                    </div>
                    <p className={`text-3xl sm:text-4xl font-extrabold ${darkMode ? `text-${card.color}-300` : `text-${card.color}-600`}`}>{card.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            
            {/* Charts and Other Content - only if user is authenticated */}
            {userAuthenticated && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className={`lg:col-span-3 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                    <h3 className={`text-xl font-semibold mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                        <MdOutlineBarChart className={`text-2xl ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}/>
                        Item Categories Distribution
                    </h3>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Based on item quantity per category.</p>
                    {itemsError ? (
                        <div className={`flex flex-col items-center justify-center h-64 text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                            <MdWarningAmber size={40} className="mb-2"/>
                            <p>Error loading item data for chart.</p>
                        </div>
                    ) : categoryData.length > 0 && categoryData[0].name !== 'No Items Yet' && categoryData[0].name !== 'No Data' ? (
                        <CategoryPieChart data={categoryData} darkMode={darkMode} />
                    ) : (
                        <div className={`flex flex-col items-center justify-center h-64 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <MdPieChartOutline size={48} className="mb-3"/>
                        <p className="font-medium">No category data to display.</p>
                        <p className="text-xs">Add items with categories to see the chart.</p>
                        </div>
                    )
                    }
                </div>

                <div className={`lg:col-span-2 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} flex flex-col gap-5`}>
                    <h3 className={`text-xl font-semibold mb-1 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                        🚀 Quick Actions
                    </h3>
                    <button
                    onClick={() => navigate("/AddItemsForm")}
                    className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group
                                ${darkMode 
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-400' 
                                    : 'bg-indigo-500 hover:bg-indigo-600 text-white focus-visible:ring-2 focus-visible:ring-indigo-300'
                                } hover:shadow-md active:scale-95`}
                    > <MdAddCircleOutline className="text-xl transition-transform duration-300 group-hover:scale-110" /> Add New Item </button>
                    <button
                    onClick={() => navigate("/reports")}
                    className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group
                                ${darkMode 
                                    ? 'bg-sky-600 hover:bg-sky-500 text-white focus-visible:ring-2 focus-visible:ring-sky-400' 
                                    : 'bg-sky-500 hover:bg-sky-600 text-white focus-visible:ring-2 focus-visible:ring-sky-300'
                                } hover:shadow-md active:scale-95`}
                    > <MdAssessment className="text-xl transition-transform duration-300 group-hover:scale-110" /> Generate Reports </button>
                    <button
                    onClick={() => navigate("/viewitems")}
                    className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group
                                ${darkMode 
                                    ? 'bg-teal-600 hover:bg-teal-500 text-white focus-visible:ring-2 focus-visible:ring-teal-400' 
                                    : 'bg-teal-500 hover:bg-teal-600 text-white focus-visible:ring-2 focus-visible:ring-teal-300'
                                } hover:shadow-md active:scale-95`}
                    > <MdList className="text-xl transition-transform duration-300 group-hover:scale-110" /> View All Items </button>
                </div>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;