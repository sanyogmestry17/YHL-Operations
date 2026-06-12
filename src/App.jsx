import React, { useState, useEffect } from 'react';
import { PortalProvider, usePortal } from './context/PortalContext';
import { 
  Activity, 
  Layers, 
  FileText, 
  DollarSign, 
  Package, 
  Sliders, 
  Download,
  ShieldAlert
} from 'lucide-react';

// Views
import DashboardView from './views/DashboardView';
import BatchesView from './views/BatchesView';
import POsView from './views/POsView';
import InvoicesView from './views/InvoicesView';
import InventoryView from './views/InventoryView';
import ExportView from './views/ExportView';
import ConfigurationView from './views/ConfigurationView';
import WarningsView from './views/WarningsView';

function MainAppLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const { 
    theme, 
    toggleTheme, 
    role, 
    setRole, 
    notifications, 
    markAllNotificationsRead, 
    clearNotifications 
  } = usePortal();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">Y</div>
          <div className="logo-text">YHL Ops</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Activity className="sidebar-item-icon" />
                <span>Overview Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'batches' ? 'active' : ''}`}
                onClick={() => setActiveTab('batches')}
              >
                <Layers className="sidebar-item-icon" />
                <span>Production Batches</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'pos' ? 'active' : ''}`}
                onClick={() => setActiveTab('pos')}
              >
                <FileText className="sidebar-item-icon" />
                <span>Purchase Orders</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => {
                  if (role !== 'Accounts') {
                    alert('Only the Accounts Team can view and log invoices. Please switch your role to Accounts in the sidebar to access Invoices.');
                    return;
                  }
                  setActiveTab('invoices');
                }}
                style={{ opacity: role !== 'Accounts' ? 0.5 : 1 }}
                title={role !== 'Accounts' ? 'Accounts view required' : ''}
              >
                <DollarSign className="sidebar-item-icon" />
                <span>Invoices Registry</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                <Package className="sidebar-item-icon" />
                <span>Stock Inventory</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'export' ? 'active' : ''}`}
                onClick={() => setActiveTab('export')}
              >
                <Download className="sidebar-item-icon" />
                <span>Reports Export</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'configuration' ? 'active' : ''}`}
                onClick={() => setActiveTab('configuration')}
              >
                <Sliders className="sidebar-item-icon" />
                <span>System Configuration</span>
              </button>
            </li>
          </ul>

          <div className="sidebar-footer">
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginBottom: '0.5rem' }}>
              <button className="theme-toggle-btn" style={{ flexGrow: 1 }} onClick={toggleTheme}>
                {theme === 'light' ? '🌙 Light' : '☀️ Dark'}
              </button>
              <button 
                className="theme-toggle-btn" 
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', padding: 0 }}
                onClick={() => {
                  setShowNotifDrawer(true);
                  // Mark read on open
                  markAllNotificationsRead();
                }}
                title="Notifications Ledger"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-4px', 
                    right: '-4px', 
                    background: 'var(--color-rose)', 
                    color: '#fff', 
                    fontSize: '0.65rem', 
                    fontWeight: 700, 
                    borderRadius: '50%', 
                    width: '18px', 
                    height: '18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 0 8px var(--color-rose)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="user-badge" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div className="user-avatar" style={{ background: role === 'Operations' ? 'var(--color-cyan)' : 'var(--color-emerald)', color: '#000', fontWeight: 700 }}>
                  {role === 'Operations' ? 'OP' : 'AC'}
                </div>
                <div className="user-info">
                  <span className="user-name">Sanyog Mestry</span>
                  <span className="user-role" style={{ color: role === 'Operations' ? 'var(--color-cyan)' : 'var(--color-emerald)', fontWeight: 600 }}>
                    {role} view
                  </span>
                </div>
              </div>
              <button 
                className="glass-btn-primary" 
                style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.35rem', 
                  justifyContent: 'center', 
                  width: '100%', 
                  marginTop: '0.25rem',
                  background: role === 'Operations' ? 'var(--grad-primary)' : 'var(--grad-success-real)'
                }} 
                onClick={() => {
                  const newRole = role === 'Operations' ? 'Accounts' : 'Operations';
                  setRole(newRole);
                  if (newRole === 'Operations' && activeTab === 'invoices') {
                    setActiveTab('dashboard'); // fallback
                  }
                }}
              >
                Switch to {role === 'Operations' ? 'Accounts' : 'Operations'}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === 'batches' && <BatchesView />}
        {activeTab === 'pos' && <POsView />}
        {activeTab === 'invoices' && (role === 'Accounts' ? <InvoicesView /> : <DashboardView setActiveTab={setActiveTab} />)}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'export' && <ExportView />}
        {activeTab === 'configuration' && <ConfigurationView />}
        {activeTab === 'warnings' && <WarningsView setActiveTab={setActiveTab} />}
      </main>

      {/* Notifications Drawer Slider */}
      {showNotifDrawer && (
        <div className="drawer-overlay" onClick={() => setShowNotifDrawer(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="drawer-header">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Notifications Ledger
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                  System Alerts
                </h2>
              </div>
              <button className="drawer-close" onClick={() => setShowNotifDrawer(false)}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button className="glass-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', flexGrow: 1, justifyContent: 'center' }} onClick={markAllNotificationsRead}>
                Mark All Read
              </button>
              <button className="glass-btn-danger" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', flexGrow: 1, justifyContent: 'center' }} onClick={clearNotifications}>
                Clear All
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark)', fontSize: '0.85rem', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
                No notifications logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', paddingRight: '0.2rem' }}>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    style={{ 
                      background: notif.read ? 'var(--bg-input)' : 'var(--bg-card-hover)', 
                      border: '1px solid var(--border-color)', 
                      borderLeft: notif.read ? '3px solid var(--border-color)' : '3px solid var(--color-cyan)',
                      borderRadius: '8px', 
                      padding: '0.75rem', 
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      boxShadow: notif.read ? 'none' : 'var(--shadow-glow-cyan)'
                    }}
                  >
                    <div style={{ color: 'var(--text-main)', fontWeight: notif.read ? 400 : 600 }}>
                      {notif.text}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {notif.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Remove the no-transitions class after the initial render has finished painting
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PortalProvider>
      <MainAppLayout />
    </PortalProvider>
  );
}
