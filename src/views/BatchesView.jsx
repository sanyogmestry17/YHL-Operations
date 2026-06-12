import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  Layers, 
  Plus, 
  Calendar, 
  Trash2, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function BatchesView() {
  const { 
    batches, 
    products, 
    purchaseOrders, 
    invoices,
    createBatch, 
    deleteBatch, 
    carryForwards,
    getLocalDateStr,
    createSinglePO,
    vendorsConfig,
    role
  } = usePortal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Batch details drawer and Single PO modal states
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [showSinglePOForm, setShowSinglePOForm] = useState(false);
  const [singlePOLinkedBatchId, setSinglePOLinkedBatchId] = useState(null);

  // Single PO Form State
  const [singlePOProduct, setSinglePOProduct] = useState('');
  const [singlePOItemType, setSinglePOItemType] = useState('');
  const [singlePOVendor, setSinglePOVendor] = useState('');
  const [singlePOQuantity, setSinglePOQuantity] = useState('');
  const [singlePOUnitPrice, setSinglePOUnitPrice] = useState('');
  const [singlePOStartDate, setSinglePOStartDate] = useState(() => getLocalDateStr());
  const [singlePOEndDate, setSinglePOEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [singlePONotes, setSinglePONotes] = useState('');

  const handleSinglePOSubmit = (e) => {
    e.preventDefault();
    if (!singlePOItemType || !singlePOVendor || !singlePOQuantity || !singlePOUnitPrice) return;

    if (Number(singlePOQuantity) <= 0 || Number(singlePOUnitPrice) <= 0) {
      alert("Quantity and Unit Price must be greater than 0!");
      return;
    }

    createSinglePO({
      batchId: singlePOLinkedBatchId || null,
      productId: singlePOProduct || null,
      vendor: singlePOVendor,
      itemType: singlePOItemType,
      orderedQuantity: Number(singlePOQuantity),
      unitPrice: Number(singlePOUnitPrice),
      startDate: singlePOStartDate,
      endDate: singlePOEndDate,
      notes: singlePONotes ? `Operations Note: ${singlePONotes}` : ''
    });

    alert('Purchase Order request created successfully!');
    closeSinglePOForm();
  };

  const closeSinglePOForm = () => {
    setShowSinglePOForm(false);
    setSinglePOProduct('');
    setSinglePOItemType('');
    setSinglePOVendor('');
    setSinglePOQuantity('');
    setSinglePOUnitPrice('');
    setSinglePOStartDate(getLocalDateStr());
    
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSinglePOEndDate(dateStr);
    
    setSinglePONotes('');
    setSinglePOLinkedBatchId(null);
  };
  
  // Form State
  const [selectedProducts, setSelectedProducts] = useState({}); // mapping: productId -> targetQuantity
  const [batchName, setBatchName] = useState('');
  const [startDate, setStartDate] = useState(() => getLocalDateStr());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // 30 days default
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedCFIds, setSelectedCFIds] = useState([]);
  const [cfQuantities, setCfQuantities] = useState({});
  const [notes, setNotes] = useState('');

  // Adjust carry forward quantities if they exceed the target quantity
  React.useEffect(() => {
    setCfQuantities(prev => {
      let updated = false;
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        const cf = carryForwards.find(c => c.id === id);
        if (cf) {
          const prodQty = selectedProducts[cf.productId] || 0;
          const maxCFAllowed = Math.min(cf.quantity, prodQty);
          if (next[id] > maxCFAllowed) {
            next[id] = maxCFAllowed;
            updated = true;
          }
        }
      });
      return updated ? next : prev;
    });
  }, [selectedProducts, carryForwards]);

  const handleProductToggle = (pId) => {
    let nextProducts;
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (next[pId] !== undefined) {
        delete next[pId];
      } else {
        next[pId] = 1000;
      }
      nextProducts = next;
      return next;
    });

    // Clean up selectedCFIds and cfQuantities that belong to unchecked products
    setSelectedCFIds(prev => prev.filter(cfId => {
      const cf = carryForwards.find(c => c.id === cfId);
      return cf && nextProducts[cf.productId] !== undefined;
    }));

    // Auto pre-fill batch name based on current selected products
    setTimeout(() => {
      const selectedProductIds = Object.keys(nextProducts || {});
      if (selectedProductIds.length > 0) {
        const names = selectedProductIds.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
        const randomNum = Math.floor(100 + Math.random() * 900);
        setBatchName(`Batch #${randomNum} - ${names.join(' & ')}`);
      } else {
        setBatchName('');
      }
    }, 0);
  };

  const handleProductQuantityChange = (pId, qty) => {
    setSelectedProducts(prev => ({
      ...prev,
      [pId]: Math.max(1, Number(qty) || 1)
    }));
  };

  const handleStartDateChange = (dateVal) => {
    setStartDate(dateVal);
    // Enforce completion date to be at least the start date, or default to start + 30 days
    if (endDate && new Date(endDate) < new Date(dateVal)) {
      const d = new Date(dateVal);
      d.setDate(d.getDate() + 30);
      const newEndStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setEndDate(newEndStr);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedProductIds = Object.keys(selectedProducts);
    if (selectedProductIds.length === 0 || !batchName) {
      alert("Please select at least one product!");
      return;
    }

    const todayStr = getLocalDateStr();
    if (startDate < todayStr) {
      alert("Start Date cannot be in the past!");
      return;
    }
    if (endDate < startDate) {
      alert("Target Completion Date cannot be earlier than the Start Date!");
      return;
    }

    // Verify all selected products have positive quantities
    for (const pId of selectedProductIds) {
      if (selectedProducts[pId] <= 0) {
        alert("Target quantity for all products must be greater than 0!");
        return;
      }
    }

    const selectedCFQuantitiesMap = {};
    selectedCFIds.forEach(id => {
      const cf = carryForwards.find(c => c.id === id);
      if (cf) {
        const prodQty = selectedProducts[cf.productId] || 0;
        const maxCFAllowed = Math.min(cf.quantity, prodQty);
        selectedCFQuantitiesMap[id] = cfQuantities[id] !== undefined ? Math.min(cfQuantities[id], maxCFAllowed) : maxCFAllowed;
      }
    });

    const productsList = selectedProductIds.map(pId => ({
      productId: pId,
      targetQuantity: selectedProducts[pId]
    }));

    createBatch({
      productsList,
      name: batchName,
      startDate,
      endDate,
      notes
    }, selectedCFQuantitiesMap);

    // Reset Form
    setSelectedProducts({});
    setBatchName('');
    setSelectedCFIds([]);
    setCfQuantities({});
    setNotes('');
    setIsModalOpen(false);
  };

  const handleDeleteBatch = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    const batchPOs = purchaseOrders.filter(po => po.batchId === batchId);
    const batchInvoices = invoices.filter(inv => inv.batchId === batchId);
    
    let msg = `Are you sure you want to delete "${batch.name}"?`;
    if (batch.status === 'Completed') {
      msg = `WARNING: "${batch.name}" is COMPLETED. Deleting it will remove all history of its POs and Invoices, but will NOT reverse stock inventory changes. Are you sure you want to proceed?`;
    } else if (batchInvoices.length > 0) {
      msg = `WARNING: "${batch.name}" has ${batchInvoices.length} invoice(s) logged against it. Deleting it will delete these invoices and POs from the ledger, but will NOT reverse the inventory stock additions. Proceed?`;
    } else if (batchPOs.some(po => po.status !== 'Draft' && po.status !== 'Requested')) {
      msg = `"${batch.name}" has active/dispatched POs. Deleting it will cancel all associated active POs. Proceed?`;
    }

    if (window.confirm(msg)) {
      deleteBatch(batchId);
    }
  };

  // Filter batches
  const filteredBatches = batches.filter(b => {
    if (filterStatus === 'All') return true;
    return b.status === filterStatus;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Production Batches</h1>
          <p className="page-subtitle">Initiate production runs, allocate materials, and track batch sequences</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {role === 'Operations' && (
            <button className="glass-btn-primary" style={{ background: 'var(--grad-primary)' }} onClick={() => { setSinglePOLinkedBatchId(null); setShowSinglePOForm(true); }}>
              <Plus size={16} style={{ marginRight: '4px' }} /> Create PO Request
            </button>
          )}
          <button className="glass-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Batch
          </button>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="tabs-container">
        {['All', 'Draft', 'In Production', 'Completed'].map(status => (
          <button
            key={status}
            className={`tab-btn ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status} ({status === 'All' ? batches.length : batches.filter(b => b.status === status).length})
          </button>
        ))}
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={40} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--color-cyan)' }} />
          <h3>No Batches Found</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Start by clicking "Create Batch" to raise Purchase Orders and begin production.</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {filteredBatches.map(batch => {
            const batchPOs = purchaseOrders.filter(po => po.batchId === batch.id);
            const completedPOs = batchPOs.filter(po => po.status === 'Fully Served' || po.status === 'Closed').length;
            const progressPct = batchPOs.length > 0 ? Math.round((completedPOs / batchPOs.length) * 100) : 0;

            // Retrieve list of products
            const productsInBatch = batch.productsList || (batch.productId ? [{ productId: batch.productId, targetQuantity: batch.targetQuantity }] : []);
            
            // Format product names & details
            const productsDetailString = productsInBatch.map(pi => {
              const p = products.find(prod => prod.id === pi.productId);
              return p ? `${p.name} (${pi.targetQuantity} units)` : 'Unknown Product';
            }).join(', ');

            return (
              <div 
                key={batch.id} 
                className="glass-panel" 
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', cursor: 'pointer' }}
                onClick={() => setSelectedBatchId(batch.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                      {batch.id} • {batch.startDate} to {batch.endDate}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '2px' }}>{batch.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Products: <strong style={{ color: 'var(--text-main)' }}>{productsDetailString}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${
                      batch.status === 'Completed' ? 'badge-served' : batch.status === 'In Production' ? 'badge-dispatched' : 'badge-draft'
                    }`}>
                      {batch.status}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch.id); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', padding: '0.2rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-rose)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dark)'}
                      title="Delete Batch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Workflow Progress</span>
                    <span style={{ fontWeight: 600 }}>{progressPct}% ({completedPOs}/{batchPOs.length} POs Served)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${progressPct}%`, 
                        height: '100%', 
                        background: progressPct === 100 ? 'var(--grad-success-real)' : 'var(--grad-primary)',
                        boxShadow: progressPct > 0 ? 'var(--shadow-glow-cyan)' : 'none',
                        borderRadius: '3px',
                        transition: 'width var(--trans-slow)'
                      }} 
                    />
                  </div>
                </div>

                {/* Sub-POs raised list */}
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                    Triggered Purchase Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {batchPOs.map(po => {
                      const p = products.find(prod => prod.id === po.productId);
                      return (
                        <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>{po.vendor} {p ? `[${p.name}]` : ''}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>{po.itemType} • {po.poNumber}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: po.balanceQuantity > 0 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                              {po.orderedQuantity - po.balanceQuantity} / {po.orderedQuantity}
                            </span>
                            <span className={`badge ${
                              po.status === 'Fully Served' ? 'badge-served' : po.status === 'Partially Served' ? 'badge-partial' : po.status === 'Sent' ? 'badge-sent' : po.status === 'Ready' ? 'badge-ready' : po.status === 'Closed' ? 'badge-closed' : 'badge-draft'
                            }`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                              {po.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    <span>Est. Delivery: {batch.endDate}</span>
                  </div>
                  <div>Aggregate Target: <strong style={{ color: 'var(--text-main)' }}>{batch.targetQuantity} units</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="drawer-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Initiate Production Batch</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="glass-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Select Products to include in Batch</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {products.map(p => {
                    const isChecked = selectedProducts[p.id] !== undefined;
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                          type="checkbox" 
                          style={{ width: 'auto', margin: 0 }}
                          checked={isChecked}
                          onChange={() => handleProductToggle(p.id)}
                        />
                        <span style={{ fontSize: '0.8rem' }}>{p.name} ({p.category})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.keys(selectedProducts).length > 0 && (
                <div className="form-group" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem' }}>
                  <label className="glass-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Specify Target Quantities</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.keys(selectedProducts).map(pId => {
                      const p = products.find(prod => prod.id === pId);
                      if (!p) return null;
                      return (
                        <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{p.name} Target Qty:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="number" 
                              className="glass-input" 
                              style={{ width: '120px', height: '34px', padding: '0.25rem 0.5rem' }}
                              value={selectedProducts[pId]} 
                              onChange={(e) => handleProductQuantityChange(pId, e.target.value)} 
                              min={10} 
                              required 
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Object.keys(selectedProducts).length > 0 && (
                <div className="form-group">
                  <label className="glass-label">Batch Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={batchName} 
                    onChange={(e) => setBatchName(e.target.value)} 
                    placeholder="Enter batch label..." 
                    required 
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">Start Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    value={startDate} 
                    onChange={(e) => handleStartDateChange(e.target.value)} 
                    min={getLocalDateStr()}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="glass-label">Target Completion Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={startDate}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="glass-label">Notes for Accounts Team</label>
                <textarea 
                  className="glass-input" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Enter notes about special requirements, vendor terms, or price matches for the accounting team..."
                  rows={2}
                />
              </div>

              {/* Carry Forward shortage selector list */}
              {(() => {
                const selectedProductIds = Object.keys(selectedProducts);
                const matchingCFs = (selectedProductIds.length > 0 && Array.isArray(carryForwards)) ? carryForwards.filter(cf => 
                  selectedProductIds.includes(cf.productId) &&
                  (() => {
                    const prod = products.find(p => p.id === cf.productId);
                    return prod?.lifecycle.some(step => step.vendor === cf.vendor && step.itemType === cf.itemType);
                  })()
                ) : [];

                if (matchingCFs.length === 0) return null;

                return (
                  <div style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚠️ Available Shortage Carry-Forwards
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {matchingCFs.map(cf => {
                        const isChecked = selectedCFIds.includes(cf.id);
                        const prodQty = selectedProducts[cf.productId] || 0;
                        const maxCFAllowed = Math.min(cf.quantity, prodQty);
                        const currentVal = cfQuantities[cf.id] !== undefined ? Math.min(cfQuantities[cf.id], maxCFAllowed) : maxCFAllowed;
                        const product = products.find(p => p.id === cf.productId);
                        
                        return (
                          <div key={cf.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}>
                              <input 
                                type="checkbox" 
                                style={{ width: 'auto' }}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCFIds(prev => [...prev, cf.id]);
                                    setCfQuantities(prev => ({ ...prev, [cf.id]: maxCFAllowed }));
                                  } else {
                                    setSelectedCFIds(prev => prev.filter(id => id !== cf.id));
                                    setCfQuantities(prev => {
                                      const copy = { ...prev };
                                      delete copy[cf.id];
                                      return copy;
                                    });
                                  }
                                }}
                              />
                              <span>
                                Add shortage from PO <strong>{cf.sourcePONumber}</strong> ({cf.vendor} - {cf.itemType} for {product?.name || 'Unknown'})
                              </span>
                            </label>
                            
                            {isChecked && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.25rem', animation: 'scale-up 0.15s ease-out' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quantity to carry forward:</span>
                                <input 
                                  type="number"
                                  className="glass-input"
                                  style={{ width: '90px', padding: '0.15rem 0.4rem', fontSize: '0.75rem', height: '28px' }}
                                  min={1}
                                  max={maxCFAllowed}
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = Math.max(1, Math.min(maxCFAllowed, Number(e.target.value) || 1));
                                    setCfQuantities(prev => ({ ...prev, [cf.id]: val }));
                                  }}
                                />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  (Max: {maxCFAllowed} units)
                                </span>
                                <button
                                  type="button"
                                  className="glass-btn"
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', height: '28px' }}
                                  onClick={() => setCfQuantities(prev => ({ ...prev, [cf.id]: maxCFAllowed }))}
                                >
                                  Use Full
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Production Cycle Preview */}
              {(() => {
                const selectedProductIds = Object.keys(selectedProducts);
                if (selectedProductIds.length === 0) return null;

                return (
                  <div style={{ background: 'rgba(0, 242, 254, 0.03)', border: '1px solid rgba(0, 242, 254, 0.12)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <TrendingUp size={14} /> Production Sequence & PO Preview
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {selectedProductIds.map((pId) => {
                        const product = products.find((p) => p.id === pId);
                        const targetQty = selectedProducts[pId];
                        if (!product) return null;

                        return (
                          <div key={pId} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {product.name} ({targetQty} units)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                              {(product.lifecycle || []).map((step, idx) => {
                                const stepCFs = Array.isArray(carryForwards) ? carryForwards.filter(
                                  cf => selectedCFIds.includes(cf.id) && cf.productId === product.id && cf.vendor === step.vendor && cf.itemType === step.itemType
                                ) : [];
                                const cfQty = stepCFs.reduce((sum, cf) => {
                                  const maxCFAllowed = Math.min(cf.quantity, Number(targetQty) || 0);
                                  const val = cfQuantities[cf.id] !== undefined ? Math.min(cfQuantities[cf.id], maxCFAllowed) : maxCFAllowed;
                                  return sum + val;
                                }, 0);
                                const baseQty = Number(targetQty);
                                const finalQty = baseQty + cfQty;
                                const stepCost = finalQty * step.defaultUnitPrice;
                                const cfDetails = stepCFs.map(cf => {
                                  const maxCFAllowed = Math.min(cf.quantity, Number(targetQty) || 0);
                                  const val = cfQuantities[cf.id] !== undefined ? Math.min(cfQuantities[cf.id], maxCFAllowed) : maxCFAllowed;
                                  return `${val} units from PO ${cf.sourcePONumber}`;
                                }).join(', ');

                                return (
                                  <div key={step.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Step {idx + 1}: {step.itemType} ({step.vendor})</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                      <span style={{ fontWeight: 600 }}>
                                        {cfQty > 0 ? (
                                          <span style={{ color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            {baseQty} + {cfQty} CF = {finalQty} units
                                          </span>
                                        ) : (
                                          `${finalQty} units`
                                        )}
                                      </span>
                                      <span style={{ color: 'var(--text-dark)' }}>
                                        @ ₹{step.defaultUnitPrice.toFixed(2)}/u = ₹{stepCost.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="glass-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="glass-btn-primary" disabled={Object.keys(selectedProducts).length === 0}>Raise PO Requests</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Detail Drawer Slider */}
      {selectedBatchId && (() => {
        const batch = batches.find(b => b.id === selectedBatchId);
        if (!batch) return null;

        const batchPOs = purchaseOrders.filter(po => po.batchId === batch.id);
        const completedPOs = batchPOs.filter(po => po.status === 'Fully Served' || po.status === 'Closed').length;
        const progressPct = batchPOs.length > 0 ? Math.round((completedPOs / batchPOs.length) * 100) : 0;

        const productsInBatch = batch.productsList || (batch.productId ? [{ productId: batch.productId, targetQuantity: batch.targetQuantity }] : []);

        return (
          <div className="drawer-overlay" onClick={() => setSelectedBatchId(null)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '95vh', overflowY: 'auto' }}>
              <div className="drawer-header">
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Production Batch Detail
                  </span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                    {batch.name}
                  </h2>
                </div>
                <button className="drawer-close" onClick={() => setSelectedBatchId(null)}>×</button>
              </div>

              {/* Info Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--color-cyan)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch ID</span>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{batch.id}</div>
                  </div>
                  <span className={`badge ${
                    batch.status === 'Completed' ? 'badge-served' : batch.status === 'In Production' ? 'badge-dispatched' : 'badge-draft'
                  }`}>
                    {batch.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Duration: <strong>{batch.startDate} to {batch.endDate}</strong>
                </div>

                {batch.notes && (
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                    <strong>Notes for Accounts:</strong>
                    <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{batch.notes}</p>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Workflow Progress</span>
                  <span style={{ fontWeight: 600 }}>{progressPct}% ({completedPOs}/{batchPOs.length} POs Served)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${progressPct}%`, 
                      height: '100%', 
                      background: progressPct === 100 ? 'var(--grad-success-real)' : 'var(--grad-primary)',
                      borderRadius: '3px'
                    }} 
                  />
                </div>
              </div>

              {/* Products Table inside batch */}
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Batch Product Mix
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {productsInBatch.map(pi => {
                    const p = products.find(prod => prod.id === pi.productId);
                    return (
                      <div key={pi.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                        <span>{p ? p.name : 'Unknown Product'} ({p?.category})</span>
                        <strong style={{ color: 'var(--text-main)' }}>{pi.targetQuantity} units</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Triggered POs list with "+ Create PO Request" button */}
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Triggered Purchase Orders
                  </span>
                  {role === 'Operations' && (
                    <button 
                      className="glass-btn-primary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSinglePOLinkedBatchId(batch.id);
                        setSinglePOProduct(productsInBatch[0]?.productId || '');
                        setSinglePOItemType('');
                        setSinglePOVendor('');
                        setSinglePOUnitPrice('');
                        setSinglePOQuantity('');
                        setSinglePONotes('');
                        setShowSinglePOForm(true);
                      }}
                    >
                      + Create PO Request
                    </button>
                  )}
                </div>

                {batchPOs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dark)', fontSize: '0.8rem' }}>
                    No Purchase Orders linked to this batch.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {batchPOs.map(po => {
                      let prodNames = '';
                      if (po.itemsList) {
                        prodNames = po.itemsList.map(item => products.find(p => p.id === item.productId)?.name).filter(Boolean).join(' & ');
                      } else {
                        prodNames = products.find(p => p.id === po.productId)?.name || '';
                      }

                      return (
                        <div key={po.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--color-cyan)' }}>{po.poNumber}</strong>
                            <span className={`badge ${
                              po.status === 'Fully Served' ? 'badge-served' : po.status === 'Partially Served' ? 'badge-partial' : po.status === 'Sent' ? 'badge-sent' : po.status === 'Ready' ? 'badge-ready' : po.status === 'Closed' ? 'badge-closed' : 'badge-draft'
                            }`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                              {po.status}
                            </span>
                          </div>
                          <div>Vendor: <strong>{po.vendor}</strong></div>
                          <div>Material: <strong>{po.itemType}</strong></div>
                          {prodNames && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product: {prodNames}</div>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', fontSize: '0.75rem' }}>
                            <span>Qty: <strong>{po.orderedQuantity - po.balanceQuantity} / {po.orderedQuantity}</strong></span>
                            <span>Budget: <strong>₹{po.totalAmount.toLocaleString('en-IN')}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Standalone / Batch Linked Single PO Request Modal */}
      {showSinglePOForm && (() => {
        const linkedBatch = singlePOLinkedBatchId ? batches.find(b => b.id === singlePOLinkedBatchId) : null;
        const productsInLinkedBatch = linkedBatch 
          ? (linkedBatch.productsList || (linkedBatch.productId ? [{ productId: linkedBatch.productId }] : [])) 
          : [];
        const selectableProducts = singlePOLinkedBatchId 
          ? products.filter(p => productsInLinkedBatch.some(pi => pi.productId === p.id)) 
          : products;

        return (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="drawer-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {singlePOLinkedBatchId ? `Initiate PO Request for Batch ${singlePOLinkedBatchId}` : 'Initiate Standalone PO Request'}
                </h2>
                <button className="drawer-close" onClick={closeSinglePOForm}>×</button>
              </div>

              <form onSubmit={handleSinglePOSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="glass-label">Associate Product</label>
                    <select 
                      className="glass-input" 
                      value={singlePOProduct} 
                      onChange={(e) => {
                        const prodId = e.target.value;
                        setSinglePOProduct(prodId);
                        setSinglePOItemType('');
                        setSinglePOVendor('');
                        setSinglePOUnitPrice('');
                      }}
                      required={!!singlePOLinkedBatchId}
                    >
                      <option value="">{singlePOLinkedBatchId ? 'Choose product...' : 'None / Standalone Component'}</option>
                      {selectableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="glass-label">Item / Material Type</label>
                    {(() => {
                      const prod = products.find(p => p.id === singlePOProduct);
                      if (prod && prod.lifecycle) {
                        return (
                          <select 
                            className="glass-input" 
                            value={singlePOItemType} 
                            required
                            onChange={(e) => {
                              const item = e.target.value;
                              setSinglePOItemType(item);
                              const step = prod.lifecycle.find(s => s.itemType === item);
                              if (step) {
                                setSinglePOVendor(step.vendor);
                                setSinglePOUnitPrice(step.defaultUnitPrice);
                              }
                            }}
                          >
                            <option value="">Choose component...</option>
                            {prod.lifecycle.map(s => (
                              <option key={s.id} value={s.itemType}>{s.itemType}</option>
                            ))}
                          </select>
                        );
                      } else {
                        return (
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="e.g. Custom Bottle" 
                            value={singlePOItemType} 
                            onChange={e => setSinglePOItemType(e.target.value)} 
                            required 
                          />
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="glass-label">Supplier / Vendor</label>
                    <select 
                      className="glass-input" 
                      value={singlePOVendor} 
                      onChange={e => setSinglePOVendor(e.target.value)} 
                      required
                    >
                      <option value="">Choose vendor...</option>
                      {Object.keys(vendorsConfig).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                      <option value="Custom Vendor">Custom Vendor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="glass-label">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="glass-input" 
                      placeholder="0.00" 
                      value={singlePOUnitPrice} 
                      onChange={e => setSinglePOUnitPrice(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="glass-label">Ordered Quantity</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      placeholder="e.g. 1000" 
                      value={singlePOQuantity} 
                      onChange={e => setSinglePOQuantity(e.target.value)} 
                      min={1} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="glass-label">Start Date</label>
                    <input 
                      type="date" 
                      className="glass-input" 
                      value={singlePOStartDate} 
                      onChange={e => setSinglePOStartDate(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="glass-label">End Date</label>
                    <input 
                      type="date" 
                      className="glass-input" 
                      value={singlePOEndDate} 
                      onChange={e => setSinglePOEndDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="glass-label">Notes / Instructions</label>
                  <textarea 
                    className="glass-input" 
                    rows={2} 
                    placeholder="Appended as Operations Note..." 
                    value={singlePONotes} 
                    onChange={e => setSinglePONotes(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="glass-btn" onClick={closeSinglePOForm}>Cancel</button>
                  <button type="submit" className="glass-btn-primary">Raise PO Request</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  );
}
