import React, { useContext, useMemo, useState, useEffect } from "react"; // Added useState, useEffect
import { NavLink, useNavigate } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import "../Styles/print.css"; // Keep your print-specific CSS
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
  MdOutlineSummarize, // Icon for Reports header
  MdTrendingUp, // Total Items
  MdCheckCircleOutline, // Available
  MdErrorOutline, // Out of Stock
  MdNewLabel, // Added This Period
  MdWarningAmber, // Low Stock / Error
  MdHistory, // Recently Added
  MdPrint, // Print icon
  MdDownload, // Export icon
  MdDateRange, // Date range icon
  MdFilterList, // Filter icon
} from "react-icons/md";

const Reports = () => {
  const { items, loading: itemsLoading, error: itemsError } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // --- Date Range State ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  // --- End Date Range State ---

  // Calculate report data using useMemo for efficiency
  const reportData = useMemo(() => {
    // Filter items by date range first
    const itemsInDateRange = items.filter(item => {
      if (!startDate || !endDate) return true; // If no dates, include all (though we have defaults)
      const itemDate = new Date(item.date_added);
      // Ensure comparison is done correctly by setting time to 0 for start and end of day for end
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      return itemDate >= start && itemDate <= end;
    });

    const now = new Date(); // For "Added This Month" - can be dynamic based on date range too if desired
    const currentMonth = endDate ? new Date(endDate).getMonth() : now.getMonth(); // Use end date's month or current
    const currentYear = endDate ? new Date(endDate).getFullYear() : now.getFullYear();


    const totalItemsInPeriod = itemsInDateRange.length; // This now reflects items added/relevant within the period
    
    const outOfStockItemsCount = itemsInDateRange.filter(item => item.quantity === 0).length;
    const lowStockThreshold = 5;
    const availableItemsCount = itemsInDateRange.filter(item => item.quantity > 0).length;

    // "Added This Period" - items whose date_added falls within the selected range
    const addedThisPeriodCount = itemsInDateRange.length; // Since itemsInDateRange is already filtered by date_added

    const lowStockItemsList = itemsInDateRange.filter(
      (item) => item.quantity > 0 && item.quantity < lowStockThreshold
    );

    // "Recently Added" should also respect the date range, or be a separate "Overall Recently Added"
    // For now, let's make it recently added *within the period*
    const recentlyAddedList = [...itemsInDateRange] // Use itemsInDateRange
      .sort((a, b) => new Date(b.date_added) - new Date(a.date_added))
      .slice(0, 5);

    return {
      totalItemsInPeriod: totalItemsInPeriod,
      availableItems: availableItemsCount,
      outOfStockItems: outOfStockItemsCount,
      addedThisPeriod: addedThisPeriodCount, // Renamed for clarity
      lowStockItems: lowStockItemsList,
      recentlyAdded: recentlyAddedList,
      dateRangeApplied: !!(startDate && endDate),
    };
  }, [items, startDate, endDate]);

  // Sidebar link styling
  const sidebarLinkClass = ({ isActive }) =>
    `px-5 py-3.5 hover:bg-white/20 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
      isActive 
        ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/30 text-white shadow-md') 
        : (darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-indigo-100 hover:text-white')
    }`;
  const sidebarIconClass = "text-xl";

  // Card styles
  const summaryCardBaseClass = `p-5 sm:p-6 rounded-xl shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border-t-4
                                ${darkMode ? 'bg-slate-800' : 'bg-white'}`;
  const summaryCardTitleClass = `text-sm sm:text-base font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`;
  const summaryCardValueClass = `text-2xl sm:text-3xl font-extrabold mb-1`;
  const summaryCardDescriptionClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;

  // Table styles
  const tableContainerClass = `rounded-lg shadow-xl overflow-hidden print-table ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`;
  const tableHeaderClass = `py-3 px-4 text-left text-xs uppercase tracking-wider font-semibold`;
  const tableCellClass = `py-2.5 px-4 whitespace-nowrap text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  const tableRowHoverClass = darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70';
  
  // Input style for date pickers
  const inputBaseClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus-visible:outline-none
                        ${darkMode ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100 [color-scheme:dark]' 
                                  : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'}`;


  const summaryCards = [
    { title: "Items in Period", value: reportData.totalItemsInPeriod, description: "Items relevant to selected dates", Icon: MdTrendingUp, color: "blue" },
    { title: "Available Items", value: reportData.availableItems, description: "Currently in stock (in period)", Icon: MdCheckCircleOutline, color: "green" },
    { title: "Out of Stock", value: reportData.outOfStockItems, description: "Needs restocking (in period)", Icon: MdErrorOutline, color: "red" },
    { title: "Added This Period", value: reportData.addedThisPeriod, description: "New entries in date range", Icon: MdNewLabel, color: "yellow" },
  ];
  
  if (itemsLoading) {
     return (
        <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
            <aside className={`fixed top-0 left-0 w-[250px] h-full ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-indigo-600 to-indigo-700'} z-50 print:hidden`}></aside> {/* Placeholder sidebar */}
            <div className={`flex-1 flex flex-col ml-[250px] items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                <LoadingSpinner size="lg" />
            </div>
        </div>
    );
  }


  return (
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
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
        {/* Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 transition-colors duration-300 print:hidden
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <MdAssessment size={24}/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              Inventory Reports
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
                onClick={() => window.print()}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out group
                            ${darkMode ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'} 
                            focus-visible:ring-2 ${darkMode ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-sky-300'} hover:shadow-md active:scale-95`}
            > <MdPrint className="text-lg" /> Print </button>
          </div>
        </header>

        {/* Print-only Header */}
        <div className="hidden print:block print-header p-6 border-b border-slate-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MdSchool className="text-3xl text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">School Inventory Management - Report</h1>
            </div>
            <div>
                <p className="text-sm text-slate-600">Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                {reportData.dateRangeApplied && (
                    <p className="text-sm text-slate-600">Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                )}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <main className="flex-1 p-6 pt-[104px] overflow-y-auto print-content">
          <div className="max-w-full mx-auto space-y-8">

            {/* Date Range Filter UI - Screen Only */}
            <section className="no-print p-5 sm:p-6 rounded-xl shadow-lg 
                               ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}">
              <div className="flex items-center gap-2 mb-3">
                <MdDateRange className={`text-xl ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>Filter Report by Date Range</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label htmlFor="startDate" className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Start Date</label>
                  <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputBaseClass} />
                </div>
                <div>
                  <label htmlFor="endDate" className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>End Date</label>
                  <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputBaseClass} 
                         min={startDate} /> {/* Prevent end date before start date */}
                </div>
                {/* Optional: Apply button if you don't want auto-update on date change
                <button className={`sm:col-start-3 py-2.5 px-4 rounded-lg text-sm font-semibold text-white ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}>
                  Apply Filters
                </button> */}
              </div>
               {reportData.dateRangeApplied && (
                    <p className={`text-xs mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Report data is filtered for the period: <strong>{new Date(startDate).toLocaleDateString()}</strong> to <strong>{new Date(endDate).toLocaleDateString()}</strong>.
                    </p>
                )}
            </section>
            
            {itemsError && (
                <div className={`p-4 rounded-md text-center ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
                    <MdWarningAmber className="mx-auto text-3xl mb-2" />
                    <p className="font-medium">Error loading inventory data: {itemsError.message || "Please try again."}</p>
                </div>
            )}

            {/* Summary Cards - Screen Version */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
              {summaryCards.map((card, index) => (
                <div key={index} className={`${summaryCardBaseClass} 
                  ${darkMode ? `border-${card.color}-600 hover:border-${card.color}-500` 
                            : `border-${card.color}-400 hover:border-${card.color}-500`}`}>
                  <card.Icon className={`text-3xl sm:text-4xl mb-2.5 mx-auto ${darkMode ? `text-${card.color}-400` : `text-${card.color}-500`}`} />
                  <h3 className={summaryCardTitleClass}>{card.title}</h3>
                  <p className={`${summaryCardValueClass} ${darkMode ? `text-${card.color}-300` : `text-${card.color}-600`}`}>{card.value}</p>
                  <p className={summaryCardDescriptionClass}>{card.description}</p>
                </div>
              ))}
            </section>

            {/* Summary Cards - Print Version (Simplified) */}
            <section className="hidden print:block print-summary-grid mb-8 p-4 border border-slate-300 rounded-md">
              <h2 className="text-xl font-semibold text-slate-700 mb-3">Key Metrics For Period</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {summaryCards.map((card, index) => (
                  <div key={index} className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600">{card.title}:</span>
                    <span className="font-semibold text-slate-800">{card.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Low Stock Items Table */}
            <section className="print-section">
               <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <MdWarningAmber className="text-2xl" /> Low Stock Items <span className="text-sm font-normal"> (in period)</span>
                </h2>
                <span className={`text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full no-print
                                ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
                  {reportData.lowStockItems.length} items
                </span>
              </div>
              <div className={tableContainerClass}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      <tr>
                        <th className={`${tableHeaderClass} rounded-tl-lg`}>Item Name</th>
                        <th className={tableHeaderClass}>Category</th>
                        <th className={`${tableHeaderClass} text-center`}>Quantity</th>
                        <th className={`${tableHeaderClass} rounded-tr-lg`}>Status</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {reportData.lowStockItems.length > 0 ? (
                        reportData.lowStockItems.map((item) => (
                          <tr key={item.id} className={`${tableRowHoverClass} transition-colors`}>
                            <td className={`${tableCellClass} font-medium`}>{item.item_name}</td>
                            <td className={tableCellClass}>{item.category}</td>
                            <td className={`${tableCellClass} text-center font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{item.quantity}</td>
                            <td className={tableCellClass}>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full
                                    ${darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                                    Low Stock
                                </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className={`${tableCellClass} text-center italic py-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            🎉 No low stock items in the selected period!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Recently Added Items Table */}
            <section className="print-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                  <MdHistory className="text-2xl" /> Recently Added Items <span className="text-sm font-normal">(top 5 in period)</span>
                </h2>
              </div>
              <div className={tableContainerClass}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      <tr>
                        <th className={`${tableHeaderClass} rounded-tl-lg`}>Item Name</th>
                        <th className={tableHeaderClass}>Category</th>
                        <th className={`${tableHeaderClass} text-center`}>Quantity Added</th>
                        <th className={`${tableHeaderClass} rounded-tr-lg`}>Date Added</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}`}>
                      {reportData.recentlyAdded.length > 0 ? (
                        reportData.recentlyAdded.map((item) => (
                          <tr key={item.id} className={`${tableRowHoverClass} transition-colors`}>
                            <td className={`${tableCellClass} font-medium`}>{item.item_name}</td>
                            <td className={tableCellClass}>{item.category}</td>
                            <td className={`${tableCellClass} text-center`}>{item.quantity}</td> {/* This quantity is total, might need adjustment if tracking "quantity added at that time" */}
                            <td className={tableCellClass}>{new Date(item.date_added).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                         <tr>
                          <td colSpan="4" className={`${tableCellClass} text-center italic py-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            No items were added in the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Action Buttons for Screen */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 no-print">
              <button
                onClick={() => window.print()}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out group
                            ${darkMode 
                              ? 'bg-sky-600 hover:bg-sky-500 text-white focus-visible:ring-2 focus-visible:ring-sky-400' 
                              : 'bg-sky-500 hover:bg-sky-600 text-white focus-visible:ring-2 focus-visible:ring-sky-300'
                            } hover:shadow-lg active:scale-95`}
              > <MdPrint className="text-lg" /> Print Report </button>
              <button
                onClick={() => alert("Export to CSV functionality is planned!")}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out group
                            ${darkMode 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-2 focus-visible:ring-emerald-400' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white focus-visible:ring-2 focus-visible:ring-emerald-300'
                            } hover:shadow-lg active:scale-95`}
              > <MdDownload className="text-lg" /> Export as CSV </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;