import React, { useContext, useState, useMemo } from "react"; // Added useState, useMemo
import { NavLink, Link, useNavigate } from "react-router-dom"; // Using NavLink
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import LoadingSpinner from "../Components/LoadingSpinner"; // Assuming you have this

// Importing icons
import {
  MdDashboard,
  MdInventory,
  MdAddBox,
  MdList,
  MdAssessment,
  MdSettings,
  MdSchool, // For sidebar brand
  MdSearch, // For search input (optional for view-only page)
  MdOutlineVisibility, // Icon for View Items header
  MdArrowUpward, // Sort icon
  MdArrowDownward, // Sort icon
  MdOutlineInventory2, // Empty state icon
  MdChevronLeft, // Back button icon
} from "react-icons/md";

const ViewItems = () => {
  const { items, loading, error, fetchItems } = useContext(InventoryContext); // Added loading, error, fetchItems
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'item_name', direction: 'ascending' });

  // Fetch items if not already loaded (optional, depends on your app structure)
  React.useEffect(() => {
    if (!items.length && !loading && !error) {
      // fetchItems(); // Uncomment if this page should trigger a fetch
    }
  }, [items.length, loading, error, fetchItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const itemStatus = item.quantity === 0 ? "out of stock" : item.quantity < 5 ? "low stock" : "available";
      return (
        (item.item_name?.toLowerCase() || '').includes(searchLower) ||
        (item.category?.toLowerCase() || '').includes(searchLower) ||
        (itemStatus.includes(searchLower)) ||
        (item.quantity?.toString() || '').includes(searchTerm)
      );
    });
  }, [items, searchTerm]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valueA = a[sortConfig.key];
        let valueB = b[sortConfig.key];
        
        if (sortConfig.key === 'date_added') {
          valueA = new Date(valueA || 0); // Handle potential null date
          valueB = new Date(valueB || 0);
        } else if (sortConfig.key === 'status') {
            const getStatusValue = (qty) => qty === 0 ? 2 : qty < 5 ? 1 : 0;
            valueA = getStatusValue(a.quantity);
            valueB = getStatusValue(b.quantity);
        } else if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
            // Standard number comparison
        } else {
            if (valueA == null) return sortConfig.direction === 'ascending' ? 1 : -1;
            if (valueB == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        
        if (valueA < valueB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <MdArrowUpward className="ml-1.5 text-xs" /> : <MdArrowDownward className="ml-1.5 text-xs" />;
  };

  // Sidebar link styling (identical to other pages)
  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive 
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md') 
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  // Table styles
  const tableContainerClass = `rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`;
  const tableHeaderClass = `py-3.5 px-4 text-left text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors`;
  const tableCellClass = `py-3 px-4 whitespace-nowrap text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  const tableRowHoverClass = darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70';

  const tableHeaders = [
    { key: 'item_name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity', isNumeric: true },
    { key: 'status', label: 'Status' },
    { key: 'location', label: 'Location' },
    { key: 'date_added', label: 'Date Added' },
  ];


  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar (Identical to other pages) */}
      <aside className={`fixed top-0 left-0 w-[250px] h-full flex flex-col z-50 transition-colors duration-300 shadow-xl print:hidden
                       ${darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-r border-indigo-700'}`}>
        <div className="flex items-center justify-center h-20 border-b border-white/20">
          <MdSchool className={`text-3xl ${darkMode ? 'text-indigo-400' : 'text-white'}`} />
          <h1 className={`ml-3 text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-white'}`}>School IMS</h1>
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
        {/* Header (Identical structure, title changed) */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
              <MdOutlineVisibility size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              All Inventory Items
            </h2>
          </div>
          <div className="relative">
           
            <input
              type="text"
              placeholder="Search all items..."
              className={`w-full md:w-72 py-2.5 pl-11 pr-4 rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:shadow-md
                          ${darkMode ? 'bg-slate-700 text-slate-200 placeholder-slate-400 focus:ring-sky-500 border border-slate-600 hover:border-slate-500' 
                                    : 'bg-white text-slate-700 placeholder-slate-400 focus:ring-sky-500 border border-slate-300 hover:border-slate-400'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto"> {/* 80px header + 24px padding */}
          <div className="max-w-full mx-auto">
            
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]"> <LoadingSpinner /> </div>
            ) : error ? (
              <div className={`text-center p-8 sm:p-10 rounded-lg shadow-md ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-white text-red-600'}`}>
                <MdSettings className="text-5xl mx-auto mb-4"/> {/* Error Icon */}
                <h3 className="text-xl font-semibold mb-2">Error Loading Items</h3>
                <p className="text-sm sm:text-base">{error.message || "Could not fetch item data."}</p>
                 <button 
                    onClick={() => fetchItems ? fetchItems() : window.location.reload()} // Add fetchItems if available
                    className={`mt-6 py-2.5 px-5 rounded-lg font-semibold text-sm transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                > Retry </button>
              </div>
            ) : sortedItems.length === 0 ? (
              <div className={`text-center p-10 sm:p-12 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'} min-h-[350px] flex flex-col justify-center items-center`}>
                <MdOutlineInventory2 className={`text-6xl sm:text-7xl mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <h3 className={`text-xl sm:text-2xl font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {searchTerm ? "No Items Match Your Search" : "No Items in Inventory"}
                </h3>
                <p className={`mb-6 text-sm sm:text-base ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {searchTerm ? "Try different keywords." : "Add items to the inventory to see them here."}
                </p>
                {!searchTerm && (
                  <Link
                    to="/AddItemsForm"
                    className={`flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group
                                ${darkMode 
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-400' 
                                  : 'bg-indigo-500 hover:bg-indigo-600 text-white focus-visible:ring-2 focus-visible:ring-indigo-300'
                                } hover:shadow-lg active:scale-95`}
                  > <MdAddBox className="text-lg" /> Add New Item </Link>
                )}
              </div>
            ) : (
              <div className={tableContainerClass}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]"> {/* Min width for horizontal scroll */}
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      <tr>
                        {tableHeaders.map(header => (
                            <th 
                                key={header.key} 
                                className={`${tableHeaderClass} ${header.isNumeric ? 'text-center' : 'text-left'} ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}`}
                                onClick={() => requestSort(header.key)}
                            >
                                <div className={`flex items-center ${header.isNumeric ? 'justify-center' : ''}`}>
                                    {header.label}
                                    {getSortIcon(header.key)}
                                </div>
                            </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {sortedItems.map((item) => (
                        <tr key={item.id} className={`${tableRowHoverClass} transition-colors duration-150`}>
                          <td className={`${tableCellClass} font-medium`}>{item.item_name}</td>
                          <td className={tableCellClass}>{item.category}</td>
                          <td className={`${tableCellClass} text-center font-medium`}>{item.quantity}</td>
                          <td className={tableCellClass}>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full
                              ${item.quantity === 0 ? (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')
                              : item.quantity < 5 ? (darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                              : (darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')}`}>
                              {item.quantity === 0 ? "Out of Stock" : item.quantity < 5 ? "Low Stock" : "Available"}
                            </span>
                          </td>
                          <td className={tableCellClass}>{item.location || '-'}</td>
                          <td className={tableCellClass}>{item.date_added ? new Date(item.date_added).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="text-center mt-10">
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-1.5 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all duration-300 group
                            ${darkMode 
                              ? 'bg-slate-600 hover:bg-slate-500 text-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400' 
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400'
                            } hover:shadow-md active:scale-95`}
              > <MdChevronLeft className="text-lg" /> Back to Dashboard </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewItems;