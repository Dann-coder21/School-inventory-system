import React, { useContext, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { InventoryContext } from "../contexts/InventoryContext";
import { ThemeContext } from "../contexts/ThemeContext";
import "../Styles/print.css";
import LoadingSpinner from "../Components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext"; // To ensure user is authenticated
import Layout from "../Components/Layout/Layout";

// Icon imports
import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment,
  MdSettings, MdSchool, MdTrendingUp, MdCheckCircleOutline,
  MdErrorOutline, MdNewLabel, MdWarningAmber, MdHistory,
  MdPrint, MdDownload, MdDateRange, MdPeople, MdAttachMoney,
  MdStorage, MdArrowUpward, MdArrowDownward,
  MdShoppingCart // ADDED: Icon for Staff Order Page
} from "react-icons/md";

// Helper function for currency formatting (unchanged, assuming KES now)
const formatKESCurrency = (value) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
};

// Helper function to format time ago (unchanged)
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds} secs ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return `${years} years ago`;
};


const Reports = () => {
  const { items, loading: itemsLoading, error: itemsError } = useContext(InventoryContext);
  const { darkMode } = useContext(ThemeContext);
  const { isLoadingAuth, currentUser } = useAuth(); // Auth context for page access control

  // Date range state with validation (unchanged)
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  });

  // Handle date changes with simple validation (unchanged)
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

  // Optimized report calculations using useMemo (updated to use cost_price)
  const reportData = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    const itemsInRange = items.filter(item => {
      const itemDate = new Date(item.date_added || item.createdAt);
      return itemDate >= start && itemDate <= end;
    });

    const lowStockThreshold = 5;
    const lowStockItems = itemsInRange.filter(item =>
      (item.quantity !== undefined && item.quantity !== null) &&
      item.quantity > 0 && item.quantity < lowStockThreshold
    );

    let totalInventoryValue = 0;
    const valueByCategory = {};

    items.forEach(item => {
        const category = item.category || 'Uncategorized';
        const quantity = Number(item.quantity) || 0;
        const cost_price = Number(item.cost_price) || 0; // Correctly using cost_price here

        totalInventoryValue += (quantity * cost_price);

        if (!valueByCategory[category]) {
            valueByCategory[category] = 0;
        }
        valueByCategory[category] += (quantity * cost_price);
    });

    const formattedValueByCategory = Object.entries(valueByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const topStockedItems = [...items]
        .filter(item => (Number(item.quantity) || 0) > 0)
        .sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0))
        .slice(0, 5);

    const leastStockedItems = [...items]
        .filter(item => (Number(item.quantity) || 0) > 0)
        .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
        .slice(0, 5);

    return {
      totalItems: items.length,
      itemsInSelectedPeriod: itemsInRange.length,
      availableItems: items.filter(item => item.quantity > 0).length,
      outOfStockItems: items.filter(item => item.quantity === 0).length,
      lowStockItems,
      recentlyAdded: [...itemsInRange]
        .sort((a, b) => new Date(b.date_added || b.createdAt) - new Date(a.date_added || a.createdAt))
        .slice(0, 5),
      dateRangeApplied: dateRange.start && dateRange.end,
      totalInventoryValue,
      valueByCategory: formattedValueByCategory,
      topStockedItems,
      leastStockedItems,
    };
  }, [items, dateRange]);

  // Consolidated styling (unchanged)
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
    summaryCard: `p-5 sm:p-6 rounded-xl shadow-lg text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border-b-4 ${
      darkMode ? 'bg-slate-800' : 'bg-white'
    }`,
    sectionCard: `p-6 rounded-xl shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`,
    tableContainer: `rounded-lg shadow-xl overflow-hidden print-table ${
      darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
    }`,
    input: `w-full px-3 py-2 rounded-md border text-sm transition-colors duration-150 focus:ring-2 focus:outline-none ${
      darkMode
        ? 'bg-slate-700 border-slate-600 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-100 [color-scheme:dark]'
        : 'bg-white border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800'
    }`,
    tableHeader: `py-3 px-4 text-left text-xs uppercase font-semibold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} print:bg-slate-100 print:text-slate-700`,
    tableRow: `py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`,
  };

  // Summary card data with color classes (unchanged from last version, values updated by useMemo)
  const summaryCards = [
    { title: "Total Items", value: reportData.totalItems, Icon: MdStorage, color: "blue" },
    { title: "Available Items", value: reportData.availableItems, Icon: MdCheckCircleOutline, color: "green" },
    { title: "Out of Stock", value: reportData.outOfStockItems, Icon: MdErrorOutline, color: "red" },
    { title: "Total Value", value: formatKESCurrency(reportData.totalInventoryValue), Icon: MdAttachMoney, color: "purple" },
    { title: "Items Added (Period)", value: reportData.itemsInSelectedPeriod, Icon: MdNewLabel, color: "yellow" },
  ];

  // Auth/Loading state
  if (isLoadingAuth || itemsLoading) {
    return (
      <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
        <aside className={`fixed top-0 left-0 w-[250px] h-full ${darkMode ? 'bg-slate-800' : 'bg-gradient-to-b from-indigo-600 to-indigo-700'} z-50 print:hidden`} />
        <div className={`flex-1 flex flex-col ml-[250px] items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Access Denied for non-logged-in users
  if (!currentUser) {
    return null; // RouteWrapper handles redirection
  }

  // NEW: Staff Order Page link visibility
  const canViewOrders = ['Admin', 'Staff', 'DepartmentHead', 'StockManager'];
  const showOrdersLink = canViewOrders.includes(currentUser?.role);

  // Handle CSV export (updated to use cost_price and location)
  const exportToCSV = () => {
    const headers = [
      "Item Name", "Category", "Quantity", "Cost Price", "Location", "Total Item Value",
      "Status", "Date Added"
    ];
    const csvContent = [
      headers.join(","),
      ...items.map(item => [
        `"${item.item_name}"`,
        `"${item.category}"`,
        item.quantity,
        (Number(item.cost_price) || 0).toFixed(2),
        `"${item.location || 'N/A'}"`,
        ( (Number(item.quantity) || 0) * (Number(item.cost_price) || 0) ).toFixed(2),
        item.quantity === 0 ? "Out of Stock" : item.quantity < 5 ? "Low Stock" : "In Stock",
        new Date(item.date_added || item.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    <Layout>
    <div className={`flex h-screen font-sans antialiased ${darkMode ? 'dark' : ''}`}>
     

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
                <span className="font-medium">Total Items Overall:</span> {items.length}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium">Total Inventory Value:</span> {formatKESCurrency(reportData.totalInventoryValue)}
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
            <section className={`${styles.sectionCard} no-print`}>
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
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 no-print">
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
                {summaryCards.filter(card => card.title !== "Items Added (Period)").map((card, index) => (
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

            {/* Main Report Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Low Stock Items Section */}
              <LowStockSection
                darkMode={darkMode}
                items={reportData.lowStockItems}
                tableContainerClass={styles.tableContainer}
                tableHeaderClass={styles.tableHeader}
                tableRowClass={styles.tableRow}
              />

              {/* Recently Added Items Section (using itemsInRange) */}
              <RecentlyAddedSection
                darkMode={darkMode}
                items={reportData.recentlyAdded}
                tableContainerClass={styles.tableContainer}
                tableHeaderClass={styles.tableHeader}
                tableRowClass={styles.tableRow}
              />

              {/* NEW FEATURE: Inventory Value by Category */}
              <InventoryValueSection
                darkMode={darkMode}
                valueByCategory={reportData.valueByCategory}
                tableContainerClass={styles.tableContainer}
                tableHeaderClass={styles.tableHeader}
                tableRowClass={styles.tableRow}
              />

              {/* NEW FEATURE: Top/Least Stocked Items */}
              <TopLeastStockedSection
                darkMode={darkMode}
                topItems={reportData.topStockedItems}
                leastItems={reportData.leastStockedItems}
                tableContainerClass={styles.tableContainer}
                tableHeaderClass={styles.tableHeader}
                tableRowClass={styles.tableRow}
              />
            </div>

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
     </Layout>
  );
};

// --- Extracted Components for Reports (unchanged) ---
const LowStockSection = ({ darkMode, items, tableContainerClass, tableHeaderClass, tableRowClass }) => (
  <section className={`print-section ${tableContainerClass}`}>
    <div className="flex justify-between items-center mb-4 p-4 no-print">
      <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
        <MdWarningAmber className="text-2xl" /> Low Stock Items
      </h2>
      <span className={`text-xs sm:text-sm font-medium px-2.5 py-1 rounded-full no-print
                      ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </span>
    </div>
    <div className="px-4 pb-4 print:p-0">
      <table className="w-full text-sm print:w-full">
        <thead className={tableHeaderClass}>
          <tr>
            <th className="py-3 px-4 text-left">Item Name</th>
            <th className="py-3 px-4 text-left">Category</th>
            <th className="py-3 px-4 text-center">Quantity</th>
            <th className="py-3 px-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
          {items.length > 0 ? items.map((item) => (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
              <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {item.item_name}
              </td>
              <td className={`py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`}>
                {item.category || 'N/A'}
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
                🎉 No low stock items within the selected period!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const RecentlyAddedSection = ({ darkMode, items, tableContainerClass, tableHeaderClass, tableRowClass }) => (
  <section className={`print-section ${tableContainerClass}`}>
    <div className="flex justify-between items-center mb-4 p-4 no-print">
      <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
        <MdHistory className="text-2xl" /> Recently Added Items
        <span className="text-sm font-normal">(top 5 in period)</span>
      </h2>
    </div>
    <div className="px-4 pb-4 print:p-0">
      <table className="w-full text-sm print:w-full">
        <thead className={tableHeaderClass}>
          <tr>
            <th className="py-3 px-4 text-left">Item Name</th>
            <th className="py-3 px-4 text-left">Category</th>
            <th className="py-3 px-4 text-center">Quantity</th>
            <th className="py-3 px-4 text-left">Added</th>
          </tr>
        </thead>
        <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
          {items.length > 0 ? items.map((item) => (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
              <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {item.item_name}
              </td>
              <td className={`py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`}>
                {item.category || 'N/A'}
              </td>
              <td className={`py-2.5 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {item.quantity}
              </td>
              <td className={`py-2.5 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} print:text-slate-700`}>
                {formatTimeAgo(item.date_added || item.createdAt)}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className={`py-6 text-center italic ${darkMode ? 'text-slate-400' : 'text-slate-500'} print:text-slate-600`}>
                No recently added items in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const InventoryValueSection = ({ darkMode, valueByCategory, tableContainerClass, tableHeaderClass, tableRowClass }) => (
  <section className={`print-section ${tableContainerClass}`}>
    <div className="flex justify-between items-center mb-4 p-4 no-print">
      <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
        <MdAttachMoney className="text-2xl" /> Inventory Value by Category
      </h2>
    </div>
    <div className="px-4 pb-4 print:p-0">
      <table className="w-full text-sm print:w-full">
        <thead className={tableHeaderClass}>
          <tr>
            <th className="py-3 px-4 text-left">Category</th>
            <th className="py-3 px-4 text-right">Total Value</th>
          </tr>
        </thead>
        <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
          {valueByCategory.length > 0 ? valueByCategory.map((data) => (
            <tr key={data.name} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
              <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {data.name}
              </td>
              <td className={`py-2.5 px-4 text-right ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                {formatKESCurrency(data.value)}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="2" className={`py-6 text-center italic ${darkMode ? 'text-slate-400' : 'text-slate-500'} print:text-slate-600`}>
                No category value data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const TopLeastStockedSection = ({ darkMode, topItems, leastItems, tableContainerClass, tableHeaderClass, tableRowClass }) => (
  <section className={`print-section ${tableContainerClass}`}>
    <div className="flex justify-between items-center mb-4 p-4 no-print">
      <h2 className={`text-xl font-semibold flex items-center gap-2.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
        <MdStorage className="text-2xl" /> Stock Level Overview
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4 print:p-0">
      <div>
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          <MdArrowUpward className="text-xl text-green-500" /> Top 5 Stocked
        </h3>
        <table className="w-full text-sm print:w-full">
          <thead className={tableHeaderClass}>
            <tr>
              <th className="py-3 px-4 text-left">Item Name</th>
              <th className="py-3 px-4 text-center">Qty</th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
            {topItems.length > 0 ? topItems.map((item) => (
              <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
                <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                  {item.item_name}
                </td>
                <td className={`py-2.5 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                  {item.quantity}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="2" className={`py-6 text-center italic ${darkMode ? 'text-slate-400' : 'text-slate-500'} print:text-slate-600`}>
                  No items in stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          <MdArrowDownward className="text-xl text-red-500" /> Least 5 Stocked
        </h3>
        <table className="w-full text-sm print:w-full">
          <thead className={tableHeaderClass}>
            <tr>
              <th className="py-3 px-4 text-left">Item Name</th>
              <th className="py-3 px-4 text-center">Qty</th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-slate-700' : 'divide-y divide-slate-200'}>
            {leastItems.length > 0 ? leastItems.map((item) => (
              <tr key={item.id} className={`${darkMode ? 'hover:bg-slate-700/60' : 'hover:bg-slate-50/70'} print:hover:bg-transparent`}>
                <td className={`py-2.5 px-4 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                  {item.item_name}
                </td>
                <td className={`py-2.5 px-4 text-center ${darkMode ? 'text-slate-200' : 'text-slate-700'} print:text-slate-800`}>
                  {item.quantity}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="2" className={`py-6 text-center italic ${darkMode ? 'text-slate-400' : 'text-slate-500'} print:text-slate-600`}>
                  All items are well stocked or out of stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    
  </section>
);


export default Reports;