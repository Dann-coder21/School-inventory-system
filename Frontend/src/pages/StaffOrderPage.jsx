import React, { useContext, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { OrderForm } from '../Components/StaffOrders/OrderForm';
import { OrderTable } from '../Components/StaffOrders';
import Layout from '../Components/Layout/Layout';

import {
  MdDashboard, MdInventory, MdAddBox, MdList, MdAssessment,
  MdSettings, MdSchool, MdPeople, MdShoppingCart, MdAssignmentTurnedIn
} from 'react-icons/md';

function StaffOrderPage() {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth) {
      const allowedRoles = ['Admin', 'DepartmentHead', 'StockManager', 'Staff'];
      if (!currentUser || !allowedRoles.includes(currentUser.role)) {
        console.warn("Unauthorized access attempt to Staff Order Page. Redirecting.");
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, isLoadingAuth, navigate]);

  const allowedOrdersRoles = ['Admin', 'Staff', 'DepartmentHead', 'StockManager'];
  const showOrdersLink = useMemo(() => {
    return allowedOrdersRoles.includes(currentUser?.role);
  }, [currentUser?.role]);

  const allowedIncomingRoles = ['Admin', 'DepartmentHead', 'StockManager'];
  const showIncomingRequestsLink = useMemo(() => {
    return currentUser && allowedIncomingRoles.includes(currentUser.role);
  }, [currentUser]);


  if (isLoadingAuth) {
    return (
      <div className={`flex h-screen items-center justify-center ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        Loading authentication...
      </div>
    );
  }

  const allowedPageRoles = ['Admin', 'DepartmentHead', 'StockManager', 'Staff'];
  if (!currentUser || !allowedPageRoles.includes(currentUser.role)) {
    return null;
  }

  const handleOrderSubmitted = (newOrder) => {
    console.log("New order submitted, triggering refresh in OrderTable.");
  };

  return (
    <Layout>
      {/* Header: sticky, will always touch the sidebar and scroll with content */}
    <header className={`flex items-center justify-between h-20 px-6 sm:px-8 fixed top-0 left-[250px] right-0 z-40 ${
          darkMode ? 'bg-slate-800/75 backdrop-blur-lg border-b border-slate-700' : 'bg-white/75 backdrop-blur-lg border-b border-slate-200'
        } shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <MdShoppingCart size={24}/>
          </div>
          <h2 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Item Request Center
          </h2>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-6 pt-[96px] overflow-y-auto"> {/* Added pt-[96px] to create gap */}
        <div className="max-w-6xl mx-auto space-y-8">
          <OrderForm onOrderSubmitted={handleOrderSubmitted} />
          <OrderTable />
        </div>
      </main>
    </Layout>
  );
}

export default StaffOrderPage;