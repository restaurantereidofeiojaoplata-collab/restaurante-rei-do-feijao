import { useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { BottomNavigation } from './components/BottomNavigation';
import { LoginScreen } from './components/LoginScreen';
import { TermsModal } from './components/TermsModal';
import { ProductTour } from './components/ProductTour';
import { DeviceApprovalWaitScreen } from './components/DeviceApprovalWaitScreen';
import { DeviceRequestsPanel } from './components/DeviceRequestsPanel';
import { api } from './services/api';
import { initializeClientSecurity } from './utils/security';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardView } from './components/DashboardView';
import { PdvView } from './components/PdvView';
import { TablesView } from './components/TablesView';
import { OrdersView } from './components/OrdersView';
import { ProductsView } from './components/ProductsView';
import { FinanceView } from './components/FinanceView';
import { EmployeesView } from './components/EmployeesView';
import { SettingsView } from './components/SettingsView';
import {
  OfflineBanner,
  SessionExpiredScreen,
  AccessDeniedScreen,
  ServerErrorScreen
} from './components/SystemStates';

export default function App() {
  const {
    products,
    categories,
    tables,
    orders,
    employees,
    cashRegister,
    notifications,
    activeView,
    currentUser,
    isOffline,
    isSessionExpired,
    isAccessDenied,
    is500Error,
    isDarkMode,

    changeView,
    login,
    logout,
    toggleOffline,
    toggleSessionExpired,
    toggleAccessDenied,
    toggle500Error,
    toggleTheme,

    addProduct,
    updateProduct,
    deleteProduct,

    updateTableStatus,

    createOrder,
    updateOrderStatus,
    payOrder,

    addEmployee,
    updateEmployee,
    deleteEmployee,

    openCashRegister,
    closeCashRegister,
    addCashTransaction,

    bills,
    addBill,
    toggleBillStatus,
    deleteBill,

    addNotification,

    markAllNotificationsRead,
    clearNotifications,
    resetAllData,
    updateProfile,
    addCategory,
    updateCategory,
    deleteCategory,
    verifyAdminPassword,
    pendingDeviceCount,
    setPendingDeviceCount
  } = useAppState();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  // State for device approval flow (null = not waiting)
  const [deviceApprovalInfo, setDeviceApprovalInfo] = useState<{
    sessionId: string;
    restaurantId: string;
    restaurantSlug: string;
  } | null>(null);

  // Listen to global tour start event and handle auto-start tour on first login
  useEffect(() => {
    const handleStartTour = () => {
      changeView('dashboard');
      setIsTourOpen(true);
    };

    window.addEventListener('gourmet_start_tour', handleStartTour);

    if (currentUser && currentUser.termsAccepted) {
      const tourKey = `gourmet_tour_completed_${currentUser.id}`;
      const tourCompleted = localStorage.getItem(tourKey) === 'true';
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          changeView('dashboard');
          setIsTourOpen(true);
          localStorage.setItem(tourKey, 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    return () => window.removeEventListener('gourmet_start_tour', handleStartTour);
  }, [currentUser, changeView]);

  // Inicialização de segurança e limpeza de dados legados de mock
  useEffect(() => {
    // Ativa proteções client-side apenas em produção
    if (import.meta.env.PROD) {
      initializeClientSecurity();
    }
    // Limpar dados mock legados do localStorage se existirem
    const hasLegacyMocks = localStorage.getItem('gourmet_orders')?.includes('o_init_1') || 
                           localStorage.getItem('gourmet_cash_register')?.includes('tx1');
    if (hasLegacyMocks) {
      localStorage.removeItem('gourmet_products');
      localStorage.removeItem('gourmet_tables');
      localStorage.removeItem('gourmet_orders');
      localStorage.removeItem('gourmet_employees');
      localStorage.removeItem('gourmet_cash_register');
      localStorage.removeItem('gourmet_notifications');
    }
  }, []);

  // Route Guard: enforce device allowedViews restrictions
  useEffect(() => {
    if (currentUser) {
      const allowed = (currentUser as any).allowedViews || [];
      if (allowed.length > 0 && !allowed.includes(activeView)) {
        changeView(allowed[0] as any);
      }
    }
  }, [activeView, currentUser, changeView]);




  // Helper to create dynamic incoming simulated order for testing
  const handleCreateRandomOrder = () => {
    if (products.length === 0) return;

    // Pick 1-2 random items
    const itemCount = Math.floor(Math.random() * 2) + 1;
    const items: any[] = [];
    let subtotal = 0;

    for (let i = 0; i < itemCount; i++) {
      const randProduct = products[Math.floor(Math.random() * products.length)];
      if (!randProduct) continue;
      const selectedAdditions: any[] = [];

      // Pick random additions
      if (randProduct.additions && randProduct.additions.length > 0 && Math.random() > 0.4) {
        const randAdd = randProduct.additions[Math.floor(Math.random() * randProduct.additions.length)];
        if (randAdd) selectedAdditions.push(randAdd);
      }

      const quantity = Math.floor(Math.random() * 2) + 1;
      items.push({
        product: randProduct,
        quantity,
        selectedAdditions
      });

      const additionsSum = selectedAdditions.reduce((sum, add) => sum + add.price, 0);
      subtotal += (randProduct.price + additionsSum) * quantity;
    }

    // Pick a free table, or countertop, or delivery customer name
    const availableTables = tables.filter(t => t.status === 'available');
    const table = availableTables.length > 0 && Math.random() > 0.4
      ? availableTables[Math.floor(Math.random() * availableTables.length)]
      : null;

    const mockNames = ['Bruno Silveira', 'Vanessa Medeiros', 'Felipe Castro', 'Camila Neves', 'Rodrigo Lopes'];
    const customerName = mockNames[Math.floor(Math.random() * mockNames.length)];

    createOrder({
      tableId: table?.id,
      tableName: table ? `Mesa ${table.number}` : undefined,
      items,
      subtotal,
      discount: 0,
      total: subtotal,
      status: 'pending',
      paymentStatus: 'pending',
      customerName: table ? `Comanda Mesa ${table.number}` : `${customerName} (Balcão)`
    });
  };

  // If waiting for device approval, show the wait screen
  if (deviceApprovalInfo) {
    return (
      <DeviceApprovalWaitScreen
        deviceSessionId={deviceApprovalInfo.sessionId}
        restaurantId={deviceApprovalInfo.restaurantId}
        restaurantSlug={deviceApprovalInfo.restaurantSlug}
        onApproved={(allowedViews) => {
          // After approval, the user still needs to log in again to get their token
          // (the token is only issued on a successful login with an approved device)
          setDeviceApprovalInfo(null);
          // Show success notification and prompt re-login
          alert('✅ Acesso aprovado! Faça login novamente para entrar no sistema.');
        }}
        onRejected={() => setDeviceApprovalInfo(null)}
        onCancel={() => setDeviceApprovalInfo(null)}
      />
    );
  }

  // If no user is logged in, show premium Login screen
  if (!currentUser) {
    return (
      <LoginScreen
        employees={employees}
        onLogin={login}
        onDeviceApprovalRequired={(info) => setDeviceApprovalInfo(info)}
      />
    );
  }

  const handleAcceptTerms = async () => {
    try {
      await api.post('/auth/accept-terms', {});
      const updatedUser = { ...currentUser, termsAccepted: true };
      login(updatedUser);
    } catch (err) {
      console.error('Failed to accept terms:', err);
    }
  };

  // If terms are not accepted, show blocking terms screen
  if (!currentUser.termsAccepted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <TermsModal
          isOpen={true}
          onClose={() => {}}
          isForceAccept={true}
          onAccept={handleAcceptTerms}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans transition-colors duration-300`}>
      {/* Simulation Condition Overlays */}
      {is500Error && <ServerErrorScreen onResolve={toggle500Error} />}
      {isSessionExpired && <SessionExpiredScreen onResolve={toggleSessionExpired} />}
      {isAccessDenied && <AccessDeniedScreen onResolve={toggleAccessDenied} />}

      {/* Main app layout wrapper */}
      <div className="flex min-h-screen">
        {/* Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          onChangeView={changeView}
          currentUser={currentUser}
          onLogout={logout}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onUpdateProfile={updateProfile}
        />


        {/* Content body area wrapper */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Offline simulator status banner */}
          {isOffline && <OfflineBanner onResolve={toggleOffline} />}

          {/* Header Bar */}
          <Topbar
            activeView={activeView}
            onChangeView={changeView}
            cashRegister={cashRegister}
            orders={orders}
            products={products}
            notifications={notifications}
            isOffline={isOffline}
            isSessionExpired={isSessionExpired}
            isAccessDenied={isAccessDenied}
            is500Error={is500Error}
            isDarkMode={isDarkMode}
            pendingDeviceCount={pendingDeviceCount}
            onOpenDevicePanel={() => setShowDevicePanel(true)}
            isAdmin={(currentUser as any)?.permissions?.includes('system:admin')}
            onToggleOffline={toggleOffline}
            onToggleSessionExpired={toggleSessionExpired}
            onToggleAccessDenied={toggleAccessDenied}
            onToggle500Error={toggle500Error}
            onToggleTheme={toggleTheme}
            onResetData={resetAllData}
            onCreateRandomOrder={handleCreateRandomOrder}
            onMarkNotificationsRead={markAllNotificationsRead}
            onClearNotifications={clearNotifications}
          />

          {/* Device requests admin panel */}
          <DeviceRequestsPanel
            isOpen={showDevicePanel}
            onClose={() => setShowDevicePanel(false)}
            pendingCount={pendingDeviceCount}
            onPendingCountChange={setPendingDeviceCount}
          />

          {/* Router switch page container */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                >
                  {activeView === 'dashboard' && (
                    <DashboardView
                      products={products}
                      orders={orders}
                      cashRegister={cashRegister}
                      tables={tables}
                      employees={employees}
                      onChangeView={changeView}
                    />
                  )}

                  {activeView === 'pdv' && (
                    <PdvView
                      products={products}
                      categories={categories}
                      onCreateOrder={createOrder}
                      onPayOrder={payOrder}
                    />
                  )}

                  {activeView === 'tables' && (
                    <TablesView
                      tables={tables}
                      products={products}
                      orders={orders}
                      employees={employees}
                      currentUser={currentUser}
                      onCreateOrder={createOrder}
                      onUpdateOrderStatus={updateOrderStatus}
                      onPayOrder={payOrder}
                      onUpdateTableStatus={updateTableStatus}
                    />
                  )}

                  {activeView === 'orders' && (
                    <OrdersView
                      orders={orders}
                      onUpdateOrderStatus={updateOrderStatus}
                    />
                  )}

                  {activeView === 'products' && (
                    <ProductsView
                      products={products}
                      currentUser={currentUser}
                      categories={categories}
                      onAddProduct={addProduct}
                      onUpdateProduct={updateProduct}
                      onDeleteProduct={deleteProduct}
                      onAddCategory={addCategory}
                      onUpdateCategory={updateCategory}
                      onDeleteCategory={deleteCategory}
                      verifyAdminPassword={verifyAdminPassword}
                      cashRegister={cashRegister}
                      onAddCashTransaction={addCashTransaction}
                    />
                  )}

                  {activeView === 'finance' && (
                    <FinanceView
                      cashRegister={cashRegister}
                      onOpenCashRegister={openCashRegister}
                      onCloseCashRegister={closeCashRegister}
                      onAddCashTransaction={addCashTransaction}
                      bills={bills}
                      onAddBill={addBill}
                      onToggleBillStatus={toggleBillStatus}
                      onDeleteBill={deleteBill}
                      orders={orders}
                    />
                  )}


                  {activeView === 'employees' && (
                    <EmployeesView
                      employees={employees}
                      onAddEmployee={addEmployee}
                      onUpdateEmployee={updateEmployee}
                      onDeleteEmployee={deleteEmployee}
                      verifyAdminPassword={verifyAdminPassword}
                    />
                  )}

                  {activeView === 'settings' && (
                    <SettingsView
                      currentUser={currentUser}
                      onUpdateProfile={updateProfile}
                      onResetData={resetAllData}
                      onOpenDevicePanel={() => setShowDevicePanel(true)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Bottom navigation bar for mobile viewports */}
          <BottomNavigation
            activeView={activeView}
            onChangeView={changeView}
            currentUser={currentUser}
            onLogout={logout}
          />
        </div>
      </div>

      {/* Interactive Guided Product Tour */}
      <ProductTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onChangeView={changeView}
      />
    </div>
  );
}
