import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  Package, 
  Layers, 
  Settings, 
  ArrowUpRight, 
  Plus, 
  Minus,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function InventoryView() {
  const { inventory, invoices, purchaseOrders, adjustStock, safetyThresholds } = usePortal();
  
  // Local Adjustment Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // add / subtract

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem || !adjustQty) return;

    const qty = Number(adjustQty);
    if (qty <= 0) {
      alert("Adjustment quantity must be greater than 0!");
      return;
    }

    const currentStock = inventory[selectedItem] || 0;
    if (adjustType === 'sub' && qty > currentStock) {
      alert(`Cannot subtract ${qty} units. The current stock level for ${selectedItem} is only ${currentStock} units.`);
      return;
    }

    const change = qty * (adjustType === 'add' ? 1 : -1);
    adjustStock(selectedItem, change);

    // Reset Form
    setSelectedItem('');
    setAdjustQty('');
  };

  // Divide inventory items
  const rawMaterialsKeys = ['Jar & Lid', 'Canister', 'Bottle & Pump'];
  const finishedGoodsKeys = Object.keys(inventory).filter(k => !rawMaterialsKeys.includes(k));

  // Generate automated ledger transactions from invoices
  const stockTransactions = invoices.map(inv => {
    const po = purchaseOrders.find(p => p.id === inv.poId);
    let item = po?.itemType === 'Finished Goods' ? (purchaseOrders.find(p => p.batchId === inv.batchId)?.itemType || 'Finished Product') : (po?.itemType || 'Raw Material');
    
    // Better description mapping
    return {
      id: inv.id,
      item: po?.itemType === 'Finished Goods' ? 'Finished Product Goods' : po?.itemType,
      detail: `${po?.vendor} Delivered ${inv.quantityDelivered} units`,
      qty: inv.quantityDelivered,
      date: inv.invoiceDate,
      type: 'inbound'
    };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Inventory</h1>
          <p className="page-subtitle">Real-time balances of packaging materials and finished health goods</p>
        </div>
      </div>

      {/* Grid: Left - Stock Lists, Right - Manual Adjustment Form */}
      <div className="grid-cols-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Raw Materials Stocks */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="var(--color-cyan)" /> Packaging & Raw Materials Stock
            </h3>

            <div className="grid-cols-3" style={{ gap: '1rem' }}>
              {rawMaterialsKeys.map(key => {
                const qty = inventory[key] || 0;
                const threshold = safetyThresholds[key] !== undefined ? safetyThresholds[key] : 500;
                const isLow = qty < threshold;
                return (
                  <div key={key} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderColor: isLow ? 'rgba(244,63,94,0.2)' : 'var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{key}</span>
                    <strong style={{ fontSize: '1.5rem', color: isLow ? 'var(--color-rose)' : 'var(--text-main)' }}>{qty.toLocaleString()}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Threshold: {threshold}</div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem' }}>
                      <div 
                        style={{ 
                          width: `${Math.min(100, (qty / 3000) * 100)}%`, 
                          height: '100%', 
                          background: isLow ? 'var(--grad-danger)' : 'var(--grad-primary)',
                          borderRadius: '2px'
                        }} 
                      />
                    </div>
                    {isLow && (
                      <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600 }}>⚠️ LOW STOCK LEVEL</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finished Goods Stock */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--color-cyan)" /> Finished Products Inventory
            </h3>

            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              {finishedGoodsKeys.map(key => {
                const qty = inventory[key] || 0;
                const threshold = safetyThresholds[key] !== undefined ? safetyThresholds[key] : 150;
                const isLow = qty < threshold;
                return (
                  <div key={key} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{key}</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>Threshold: {threshold}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '1.1rem', 
                        color: isLow ? 'var(--color-rose)' : 'var(--color-emerald)' 
                      }}>
                        {qty}
                      </span>
                      {isLow && <span title="Low Finished Stock">⚠️</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Panel: Manual Adjustments & Stock Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Manual Adjustments Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} /> Manual Adjustments
            </h3>
            
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="glass-label">Select Item</label>
                <select 
                  className="glass-input" 
                  value={selectedItem} 
                  onChange={(e) => setSelectedItem(e.target.value)}
                  required
                >
                  <option value="">Choose item to adjust...</option>
                  <optgroup label="Packaging Materials">
                    {rawMaterialsKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                  <optgroup label="Finished Products">
                    {finishedGoodsKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="glass-label">Quantity</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={adjustQty} 
                    onChange={(e) => setAdjustQty(e.target.value)} 
                    placeholder="Enter units..."
                    min={1} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label className="glass-label">Action</label>
                  <select 
                    className="glass-input" 
                    value={adjustType} 
                    onChange={(e) => setAdjustType(e.target.value)}
                  >
                    <option value="add">Add (+)</option>
                    <option value="sub">Subtract (-)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="glass-btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                Apply Stock Correction
              </button>
            </form>
          </div>

          {/* Inbound Transaction Log */}
          <div className="glass-panel" style={{ padding: '1.5rem', flexGrow: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} /> Recent Stock Inbounds
            </h3>
            
            {stockTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
                No recent stock deliveries.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stockTransactions.slice(0, 5).map((tx, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{tx.detail}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>{tx.date}</span>
                    </div>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
                      +{tx.qty}
                    </span>
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
