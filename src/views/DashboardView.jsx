import React from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  Activity, 
  Layers, 
  FileText, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Package
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const formatYAxisTicks = (value) => {
  if (value === 0) return '0';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
};

export default function DashboardView({ setActiveTab }) {
  const { batches, purchaseOrders, invoices, inventory, products, notifications } = usePortal();

  // Calculations
  const activeBatchesCount = batches.filter(b => b.status !== 'Completed').length;
  
  const pendingPOsCount = purchaseOrders.filter(po => 
    po.status === 'Draft' || po.status === 'Requested' || po.status === 'Ready' || po.status === 'Sent' || po.status === 'Partially Served'
  ).length;

  const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0);

  // Check low stock
  const rawMaterialsKeys = ['Jar & Lid', 'Canister', 'Bottle & Pump'];
  const lowStockItems = Object.entries(inventory).filter(([item, qty]) => {
    const isRaw = rawMaterialsKeys.includes(item);
    return qty < (isRaw ? 500 : 150);
  });

  // Recharts Data: Group PO and Invoice amounts by Batch
  const chartData = batches.map(b => {
    const batchPOs = purchaseOrders.filter(po => po.batchId === b.id);
    const batchInvoices = invoices.filter(inv => inv.batchId === b.id);

    const poSum = batchPOs.reduce((sum, po) => sum + po.totalAmount, 0);
    const invSum = batchInvoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0);

    return {
      name: b.name.split(' - ')[1] || b.name,
      id: b.id,
      'PO Amount': poSum,
      'Invoice Amount': invSum
    };
  });

  // Recent activity log (merging PO status updates, invoices, etc.)
  const recentActivities = [
    ...invoices.map(inv => {
      const po = purchaseOrders.find(p => p.id === inv.poId);
      return {
        type: 'Invoice logged',
        text: `Logged Invoice ${inv.invoiceNumber} for ${inv.quantityDelivered} units against PO ${po?.poNumber || 'Unknown'}`,
        date: inv.invoiceDate,
        amount: inv.invoiceAmount,
        category: 'invoice'
      };
    }),
    ...purchaseOrders.filter(po => po.status === 'Sent').map(po => ({
      type: 'PO Sent',
      text: `Purchase Order ${po.poNumber} sent to ${po.vendor} (${po.itemType})`,
      date: po.startDate,
      amount: po.totalAmount,
      category: 'po'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Overview</h1>
          <p className="page-subtitle">Real-time status of batches, POs, Invoices, and Inventory</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="glass-btn-primary" onClick={() => setActiveTab('batches')}>
            <Layers size={16} /> New Batch
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4">
        <div className="glass-card kpi-card">
          <div className="kpi-title">Active Batches</div>
          <div className="kpi-val-container">
            <div className="kpi-value">
              {activeBatchesCount}
            </div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-blue)' }}>
              <Layers size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Production runs in progress</p>
        </div>

        <div className="glass-card kpi-card" style={{ borderColor: 'var(--border-color)' }}>
          <div className="kpi-title">Pending POs</div>
          <div className="kpi-val-container">
            <div className="kpi-value">{pendingPOsCount}</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-amber)' }}>
              <FileText size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>POs awaiting supplier service</p>
        </div>

        <div className="glass-card kpi-card" style={{ borderColor: 'var(--border-color)' }}>
          <div className="kpi-title">Financial Summary</div>
          <div className="kpi-val-container">
            <div className="kpi-value">
              ₹{totalInvoicedAmount.toLocaleString('en-IN')}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}> / ₹{totalPOAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-cyan)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Total Invoiced value vs PO Budget</p>
        </div>

        <div className="glass-card kpi-card" style={{ borderColor: lowStockItems.length > 0 ? 'var(--color-rose)' : 'var(--border-color)' }}>
          <div className="kpi-title">Inventory Alerts</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: lowStockItems.length > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
              {lowStockItems.length > 0 ? `${lowStockItems.length} Warnings` : 'All Healthy'}
            </div>
            <div className="kpi-icon-wrapper" style={{ color: lowStockItems.length > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
              {lowStockItems.length > 0 ? <AlertTriangle size={20} /> : <Package size={20} />}
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Stock levels below safety thresholds</p>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid-cols-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Side: Chart and Production Batches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Recharts Chart */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--color-cyan)" /> Budget Analysis: PO Value vs Invoiced Value
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={formatYAxisTicks} width={50} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--chart-tooltip-bg)', 
                      borderColor: 'var(--chart-tooltip-border)',
                      borderRadius: '8px',
                      color: 'var(--text-main)'
                    }} 
                    cursor={{ fill: 'var(--chart-cursor-bg)' }}
                    formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="PO Amount" fill="url(#poGrad)" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={300} />
                  <Bar dataKey="Invoice Amount" fill="url(#invGrad)" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={300} />
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="poGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-blue)" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Production Batches */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>Active Production Runs</h3>
            
            {batches.filter(b => b.status !== 'Completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No active production batches. Create a new batch to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {batches.filter(b => b.status !== 'Completed').map(batch => {
                  const product = products.find(p => p.id === batch.productId);
                  const batchPOs = purchaseOrders.filter(po => po.batchId === batch.id);
                  
                  return (
                    <div key={batch.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                            {product?.category} • {batch.id}
                          </span>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{batch.name}</h4>
                        </div>
                        <span className={`badge ${batch.status === 'Draft' ? 'badge-draft' : 'badge-dispatched'}`}>
                          {batch.status}
                        </span>
                      </div>

                      {/* Production Line Flow Progress */}
                      <div className="flow-steps">
                        {product?.lifecycle.map((step, idx) => {
                          const matchingPO = batchPOs.find(p => p.itemType === step.itemType && p.vendor === step.vendor);
                          
                          let stepStatus = 'pending'; // pending, active, completed
                          if (matchingPO) {
                            if (matchingPO.status === 'Fully Served' || matchingPO.status === 'Closed') {
                              stepStatus = 'completed';
                            } else if (['Ready', 'Sent', 'Partially Served'].includes(matchingPO.status)) {
                              stepStatus = 'active';
                            }
                          }

                          return (
                            <div 
                              key={step.id} 
                              className={`flow-step ${stepStatus === 'completed' ? 'completed' : stepStatus === 'active' ? 'active' : ''}`}
                            >
                              <div className="flow-step-icon">
                                {idx + 1}
                              </div>
                              <span className="flow-step-label">{step.itemType}</span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-dark)' }}>{step.vendor.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                        <div>Target: <strong style={{ color: 'var(--text-main)' }}>{batch.targetQuantity}</strong> units</div>
                        <div>Timeline: <strong style={{ color: 'var(--text-main)' }}>{batch.startDate} to {batch.endDate}</strong></div>
                        <button 
                          className="glass-btn" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setActiveTab('batches')}
                        >
                          Details <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Inventory Overview & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Stock Summary */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>Stock Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {Object.entries(inventory).slice(0, 5).map(([item, qty]) => {
                const isRaw = ['Jar & Lid', 'Canister', 'Bottle & Pump'].includes(item);
                const isLow = qty < (isRaw ? 500 : 150);
                const maxCapacity = isRaw ? 3000 : 1000;
                return (
                  <div key={item} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                      <span style={{ fontWeight: 600, color: isLow ? 'var(--color-rose)' : 'var(--text-main)' }}>
                        {qty} {isLow && '⚠️'}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${Math.min(100, (qty / maxCapacity) * 100)}%`, 
                          height: '100%', 
                          background: isLow ? 'var(--grad-danger)' : 'var(--grad-primary)',
                          borderRadius: '2px'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              className="glass-btn" 
              style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('inventory')}
            >
              View Full Stock Ledger
            </button>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel" style={{ padding: '1.5rem', flexGrow: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>Recent Ledger Activity</h3>
            
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent activity logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentActivities.map((act, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: act.category === 'invoice' ? 'var(--color-emerald)' : 'var(--color-blue)',
                      marginTop: '4px',
                      flexShrink: 0
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flexGrow: 1 }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{act.text}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dark)', fontSize: '0.7rem' }}>
                        <span>{act.date}</span>
                        {act.amount > 0 && <span style={{ color: 'var(--text-muted)' }}>₹{act.amount.toLocaleString('en-IN')}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications Feed */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>Approval Notifications Feed</h3>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
                No notifications logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: 'var(--color-cyan)', 
                      marginTop: '5px',
                      flexShrink: 0
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flexGrow: 1 }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{notif.text}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{notif.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  );
}
