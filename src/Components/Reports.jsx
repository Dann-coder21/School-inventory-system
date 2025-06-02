import React, { useContext, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import "../Styles/print.css";
import LoadingSpinner from "../Components/LoadingSpinner";

// Icon imports
import { 
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment, 
  MdSettings, MdSchool, MdTrendingUp, MdCheckCircleOutline, 
  MdErrorOutline, MdNewLabel, MdWarningAmber, MdHistory, 
  MdPrint, MdDownload, MdDateRange ,MdPeople
} from "react-icons/md";

const Reports = () => {
  const { items, loading: itemsLoading, error: itemsError } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);

  // Date range state with validation
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  });

  // Handle date changes
  const handleDateChange = (e) => {
    const { id, value } = e.target;
    setDateRange(prev => {
      const newRange = { ...prev, [id]: value };
      if (new Date(newRange.start) > new Date(newRange.end)) {
        return id === 'start' 
          ? { ...newRange, end: value } 
          : { ...newRange, start: value };
      }
      return newRange;
    });
  };

  // Optimized report calculations
  const reportData = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    const itemsInRange = items.filter(item => {
      const itemDate = new Date(item.date_added);
      return itemDate >= start && itemDate <= end;
    });

    const lowStockThreshold = 5;
    const lowStockItems = itemsInRange.filter(item => 
      item.quantity > 0 && item.quantity < lowStockThreshold
    );

    return {
      totalItems: itemsInRange.length,
      availableItems: itemsInRange.filter(item => item.quantity > 0).length,
      outOfStockItems: itemsInRange.filter(item => item.quantity === 0).length,
      addedThisPeriod: itemsInRange.length,
      lowStockItems,
      recentlyAdded: [...itemsInRange]
        .sort((a, b) => new Date(b.date_added) - new Date(a.date_added))
        .slice(0, 5),
      dateRangeApplied: dateRange.start && dateRange.end
    };
  }, [items, dateRange]);

  // Consolidated styling
  const styles = {
    sidebarLink: ({ isActive }) => 
      `px-5 py-3.5 transition-colors flex items-center gap-3.5 text-sm font-medium rounded-lg mx-3 my-1.5 ${
        isActive
          ? (darkMode 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-white/30 text-white shadow-md')
          : (darkMode 
              ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' 
              : 'text-indigo-100 hover:text-white')
      }`,
    summaryCard: `p-5 sm:p-6 rounded-xl shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border-t-4 ${
      darkMode ? 'bg-slate-800' : 'bg-white'
    }`,
    tableContainer: `rounded-lg shadow-xl overflow-hidden print-table ${
      darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`,
    input: `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus:outline-none ${
      darkMode 
        ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100 [color-scheme:dark]' 
        : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
    }`
  };

  // Summary card data with color classes
  const summaryCards = [
    { title: "Items in Period", value: reportData.totalItems, Icon: MdTrendingUp, color: "blue" },
    { title: "Available Items", value: reportData.availableItems, Icon: MdCheckCircleOutline, color: "green" },
    { title: "Out of Stock", value: reportData.outOfStockItems, Icon: MdErrorOutline, color: "red" },
    { title: "Added This Period", value: reportData.addedThisPeriod, Icon: MdNewLabel, color: "yellow" },
  ];

  if (itemsLoading) {
    return (
      <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
        <aside className={`fixed top-0 left-0 w-[250px] h-full ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-indigo-600 to-indigo-700'} z-50 print:hidden`} />
        <div className={`flex-1 flex flex-col ml-[250px] items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Handle CSV export
  const exportToCSV = () => {
    const headers = ["Item Name", "Category", "Quantity", "Status", "Date Added"];
    const csvContent = [
      headers.join(","),
      ...items.map(item => [
        `"${item.item_name}"`,
        `"${item.category}"`,
        item.quantity,
        item.quantity === 0 ? "Out of Stock" : item.quantity < 5 ? "Low Stock" : "In Stock",
        new Date(item.date_added).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          <NavLink to="/dashboard" className={styles.sidebarLink}><MdDashboard className="text-xl" /> Dashboard</NavLink>
          <NavLink to="/inventory" className={styles.sidebarLink}><MdInventory className="text-xl" /> Inventory</NavLink>
          <NavLink to="/AddItemsForm" className={styles.sidebarLink}><MdAddBox className="text-xl" /> Add Items</NavLink>
          <NavLink to="/viewitems" className={styles.sidebarLink}><MdList className="text-xl" /> View Items</NavLink>
          <NavLink to="/reports" className={styles.sidebarLink}><MdAssessment className="text-xl" /> Reports</NavLink>
              
          <NavLink to="/admin/users" className={styles.sidebarLink}><MdPeople className="text-xl" /> User Management</NavLink>
          <NavLink to="/settings" className={styles.sidebarLink}><MdSettings className="text-xl" /> Settings</NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ml-[250px] min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {/* Header */}
        <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 print:hidden
                           ${darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <MdAssessment size={24} aria-label="Reports"/>
            </div>
            <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              Inventory Reports
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 group
                          ${darkMode ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'} 
                          focus:ring-2 ${darkMode ? 'focus:ring-sky-400' : 'focus:ring-sky-300'} hover:shadow-md active:scale-95`}
              aria-label="Print report"
            > 
              <MdPrint className="text-lg" /> Print 
            </button>
          </div>
        </header>

        {/* Print Header */}
        <div className="hidden print:block print-header p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <MdSchool className="text-3xl text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">School Inventory Management</h1>
                <p className="text-xl text-indigo-600 font-medium">Inventory Analysis Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 font-medium">
                Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
              {reportData.dateRangeApplied && (
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-medium">Period:</span> {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                </p>
              )}
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium">Total Items:</span> {items.length}
              </p>
            </div>
          </div>
        </div>

        {/* Confidential Watermark - Print Only */}
        <div className="hidden print:block print-watermark absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-6xl font-bold text-slate-700 rotate-45 pointer-events-none">
          CONFIDENTIAL
        </div>

        {/* Report Content */}
        <main className="flex-1 p-6 pt-[104px] print:pt-4 overflow-y-auto print-content">
          <div className="max-w-full mx-auto space-y-8 print:space-y-10">

            {/* Date Range Filter - Screen Only */}
            <section className="no-print p-5 sm:p-6 rounded-xl shadow-lg 
                               ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}">
              <div className="flex items-center gap-2 mb-3">
                <MdDateRange className={`text-xl ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>Filter Report by Date Range</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="start" className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Start Date</label>
                  <input 
                    type="date" 
                    id="start" 
                    value={dateRange.start} 
                    onChange={handleDateChange} 
                    className={styles.input}
                    max={dateRange.end}
                  />
                </div>
                <div>
                  <label htmlFor="end" className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>End Date</label>
                  <input 
                    type="date" 
                    id="end" 
                    value={dateRange.end} 
                    onChange={handleDateChange} 
                    className={styles.input}
                    min={dateRange.start}
                  />
                </div>
              </div>
            </section>
            
            {itemsError && (
              <div className={`p-4 rounded-md text-center ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
                <p className="font-medium">Error loading inventory data: {itemsError.message || "Please try again later."}</p>
              </div>
            )}

            {/* Summary Cards - Screen Only */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
              {summaryCards.map((card, index) => (
                <div 
                  key={index} 
                  className={`${styles.summaryCard} border-${card.color}-400 hover:border-${card.color}-500`}
                >
                  <card.Icon className={`text-3xl sm:text-4xl mb-2.5 mx-auto text-${card.color}-500`} />
                  <h3 className={`text-sm sm:text-base font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {card.title}
                  </h3>
                  <p className={`text-2xl sm:text-3xl font-extrabold mb-1 text-${card.color}-600`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </section>

            {/* Print Summary Section */}
            <section className="hidden print:block print-section">
              <h2 className="print-section-title text-2xl font-bold text-slate-800 border-b border-slate-300 pb-3 mb-6">
                Key Metrics Summary
              </h2>
              <div className="print-summary-grid grid grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card, index) => (
                  <div 
                    key={index} 
                    className="summary-card bg-white border border-slate-200 rounded-lg p-4 text-center shadow-sm"
                    data-color={card.color}
                  >
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">{card.title}</h3>
                    <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Low Stock Items */}
            <LowStockSection 
              darkMode={darkMode} 
              items={reportData.lowStockItems} 
              tableContainerClass={styles.tableContainer}
            />

            {/* Recently Added Items */}
            <RecentlyAddedSection
              darkMode={darkMode}
              items={reportData.recentlyAdded}
              tableContainerClass={styles.tableContainer}
            />

            {/* Print Footer */}
            <div className="hidden print:block print-footer mt-10 pt-4 border-t border-slate-200 text-sm text-slate-600 text-center">
              <p>School Inventory Management System • Report generated on {new Date().toLocaleDateString()}</p>
              <p className="mt-1">This report is confidential and intended for authorized personnel only</p>
            </div>

            {/* Action Buttons - Screen Only */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 no-print">
              <button
                onClick={() => window.print()}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all
                            ${darkMode 
                              ? 'bg-sky-600 hover:bg-sky-500 text-white focus:ring-2 focus:ring-sky-400' 
                              : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-2 focus:ring-sky-300'
                            } hover:shadow-lg w-full sm:w-auto`}
              > 
                <MdPrint className="text-lg" /> Print Report 
              </button>
              <button
                onClick={exportToCSV}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all
                            ${darkMode 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-2 focus:ring-emerald-400' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-2 focus:ring-emerald-300'
                            } hover:shadow-lg w-full sm:w-auto`}
              > 
                <MdDownload className="text-lg" /> Export as CSV 
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Extracted Low Stock Component
const LowStockSection = ({ darkMode, items, tableContainerClass }) => (
  <section className="print-section">
    <div className="flex justify-between items-center mb-4">
      <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
        <MdWarningAmber className="text-2xl" /> Low Stock Items
      </h2>
      <span className={`text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full no-print
                      ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </span>
    </div>
    
    <div className={tableContainerClass}>
      <table className="w-full text-sm print:w-full">
        <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          <tr>
            <th className="py-3 px-4 text-left text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Item Name</th>
            <th className="py-3 px-4 text-left text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Category</th>
            <th className="py-3 px-4 text-center text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Quantity</th>
            <th className="py-3 px-4 text-left text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Status</th>
          </tr>
        </thead>
        <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
          {items.length > 0 ? items.map((item) => (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
              <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {item.item_name}
              </td>
              <td className={`py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`}>
                {item.category}
              </td>
              <td className={`py-2.5 px-4 text-center font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} print:text-yellow-700`}>
                {item.quantity}
              </td>
              <td className="py-2.5 px-4">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full
                    ${darkMode 
                      ? 'bg-yellow-500/20 text-yellow-300' 
                      : 'bg-yellow-100 text-yellow-700'} print:bg-yellow-50 print:text-yellow-800 print:border print:border-yellow-200`}>
                  Low Stock
                </span>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className={`py-6 text-center italic ${darkMode ? 'text-slate-400' : 'text-slate-500'} print:text-slate-600`}>
                🎉 No low stock items!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

// Extracted Recently Added Component
const RecentlyAddedSection = ({ darkMode, items, tableContainerClass }) => (
  <section className="print-section">
    <div className="flex justify-between items-center mb-4">
      <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
        <MdHistory className="text-2xl" /> Recently Added Items
        <span className="text-sm font-normal">(top 5)</span>
      </h2>
    </div>
    
    <div className={tableContainerClass}>
      <table className="w-full text-sm print:w-full">
        <thead className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          <tr>
            <th className="py-3 px-4 text-left text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Item Name</th>
            <th className="py-3 px-4 text-left text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Category</th>
            <th className="py-3 px-4 text-center text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Quantity</th>
            <th className="py-3 px-4 text-left text-xs uppercase font-semibold print:bg-slate-100 print:text-slate-700">Date Added</th>
          </tr>
        </thead>
        <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
          {items.length > 0 ? items.map((item) => (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
              <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {item.item_name}
              </td>
              <td className={`py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`}>
                {item.category}
              </td>
              <td className={`py-2.5 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {item.quantity}
              </td>
              <td className={`py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`}>
                {new Date(item.date_added).toLocaleDateString()}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className={`py-6 text-center italic ${darkMode ? 'text-slate-400' : 'text-slate-500'} print:text-slate-600`}>
                No items found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default Reports;