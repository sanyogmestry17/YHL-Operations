import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  FileText, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';

export default function InvoicesView() {
  const { invoices, purchaseOrders, batches, updateInvoiceNotes, deleteInvoice, role } = usePortal();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterVendor, setFilterVendor] = useState('All');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  React.useEffect(() => {
    const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
    if (selectedInvoice) {
      setNotesInput(selectedInvoice.notes || '');
    } else {
      setNotesInput('');
    }
    setIsEditingNotes(false);
  }, [selectedInvoiceId, invoices]);

  // Aggregated totals
  const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + inv.invoiceAmount, 0);
  const totalDeliveredQty = invoices.reduce((sum, inv) => sum + inv.quantityDelivered, 0);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const po = purchaseOrders.find(p => p.id === inv.poId);
    const batch = batches.find(b => b.id === inv.batchId);
    
    const matchesVendor = filterVendor === 'All' || po?.vendor === filterVendor;
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po?.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po?.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po?.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesVendor && matchesSearch;
  });

  // Extract unique vendors for dropdown
  const uniqueVendors = ['All', ...new Set(purchaseOrders.map(p => p.vendor))];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices Directory</h1>
          <p className="page-subtitle">Centralized billing logs, supplier disbursements, and delivery receipts</p>
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className="grid-cols-3">
        <div className="glass-card kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="kpi-title">Total Invoiced Amount</div>
          <div className="kpi-val-container">
            <div className="kpi-value">₹{totalInvoicedAmount.toLocaleString('en-IN')}</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-emerald)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Aggregated across all suppliers</p>
        </div>

        <div className="glass-card kpi-card" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <div className="kpi-title">Total Units Delivered</div>
          <div className="kpi-val-container">
            <div className="kpi-value">{totalDeliveredQty.toLocaleString()} units</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-blue)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Raw materials & finished products</p>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-title">Invoice Count</div>
          <div className="kpi-val-container">
            <div className="kpi-value">{invoices.length} Invoices</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-cyan)' }}>
              <FileText size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Total transaction entries in ledger</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
          <input 
            type="text" 
            className="glass-input" 
            style={{ paddingLeft: '2.25rem' }} 
            placeholder="Search invoice numbers, vendors, batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className="glass-input" 
          style={{ width: '200px' }}
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
        >
          <option value="All">All Vendors</option>
          {uniqueVendors.filter(v => v !== 'All').map(vendor => (
            <option key={vendor} value={vendor}>{vendor}</option>
          ))}
        </select>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Invoice Date</th>
              <th>PO Number</th>
              <th>Batch</th>
              <th>Vendor</th>
              <th>Destination</th>
              <th>Item Type</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No Invoices found matching your search.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => {
                const po = purchaseOrders.find(p => p.id === inv.poId);
                const batch = batches.find(b => b.id === inv.batchId);

                return (
                  <tr key={inv.id}>
                    <td>
                      <button 
                        style={{ background: 'transparent', border: 'none', fontWeight: 600, color: 'var(--color-cyan)', cursor: 'pointer', textAlign: 'left', padding: 0, font: 'inherit' }}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td>{inv.invoiceDate}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{po?.poNumber}</td>
                    <td style={{ fontSize: '0.8rem' }} title={batch?.name}>
                      {batch?.id}
                    </td>
                    <td>{po?.vendor}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-amber)', fontWeight: 500 }}>{inv.destination || 'N/A'}</td>
                    <td>{po?.itemType}</td>
                    <td style={{ fontWeight: 600 }}>{inv.quantityDelivered}</td>
                    <td>₹{inv.unitPrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-emerald)' }}>
                      ₹{inv.invoiceAmount.toLocaleString('en-IN')}
                    </td>
                     <td style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className="glass-btn" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => setSelectedInvoiceId(inv.id)}
                      >
                        Details
                      </button>
                      {role === 'Super Admin' && (
                        <button 
                          className="glass-btn" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-rose)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete Invoice "${inv.invoiceNumber}"? This will restore the PO balance and subtract delivered stock from inventory. This cannot be undone.`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Drawer Slider */}
      {(() => {
        const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
        const selectedPO = selectedInvoice ? purchaseOrders.find(p => p.id === selectedInvoice.poId) : null;
        const selectedBatch = selectedInvoice ? batches.find(b => b.id === selectedInvoice.batchId) : null;

        if (!selectedInvoice) return null;

        return (
          <div className="drawer-overlay" onClick={() => setSelectedInvoiceId(null)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Invoice Ledger Detail
                  </span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                    {selectedInvoice.invoiceNumber}
                  </h2>
                </div>
                <button className="drawer-close" onClick={() => setSelectedInvoiceId(null)}>×</button>
              </div>

              {/* Main Invoice Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--color-emerald)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date Logged</span>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedInvoice.invoiceDate}</div>
                  </div>
                  <span className="badge badge-served">
                    Verified Inbound
                  </span>
                </div>

                <div className="grid-cols-3" style={{ gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Quantity Received</span>
                    <strong style={{ fontSize: '1.1rem' }}>{selectedInvoice.quantityDelivered} units</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Unit Price</span>
                    <strong style={{ fontSize: '1.1rem' }}>₹{selectedInvoice.unitPrice.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Invoice Total</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-emerald)' }}>₹{selectedInvoice.invoiceAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {selectedInvoice.destination && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Delivery Destination</span>
                    <strong style={{ color: 'var(--color-amber)' }}>{selectedInvoice.destination}</strong>
                  </div>
                )}

                {selectedInvoice.logistics && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Logistics / Transporter Details</span>
                    <strong style={{ color: 'var(--color-cyan)' }}>{selectedInvoice.logistics}</strong>
                  </div>
                )}

                {selectedInvoice.pdfName && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Attached Document</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', fontSize: '0.75rem', width: 'fit-content' }}>
                      <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>📄 Invoice PDF:</span>
                      <a 
                        href={selectedInvoice.pdfUrl || '#'} 
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (!selectedInvoice.pdfUrl || selectedInvoice.pdfUrl === '#') {
                            e.preventDefault();
                            alert(`Mock opening PDF: ${selectedInvoice.pdfName}`);
                          }
                        }}
                        style={{ color: 'var(--color-cyan)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {selectedInvoice.pdfName}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Invoice Notes Panel */}
              <div className="glass-panel" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Invoice Status & Audit Notes</span>
                  {!isEditingNotes ? (
                    <button 
                      className="glass-btn" 
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                      onClick={() => setIsEditingNotes(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        className="glass-btn-primary" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        onClick={() => {
                          updateInvoiceNotes(selectedInvoice.id, notesInput);
                          setIsEditingNotes(false);
                        }}
                      >
                        Save
                      </button>
                      <button 
                        className="glass-btn" 
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        onClick={() => { setNotesInput(selectedInvoice.notes || ''); setIsEditingNotes(false); }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                {!isEditingNotes ? (
                  <div style={{ 
                    background: 'var(--bg-input)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '0.75rem', 
                    fontSize: '0.75rem', 
                    whiteSpace: 'pre-line',
                    color: selectedInvoice.notes ? 'var(--text-main)' : 'var(--text-muted)',
                    fontStyle: selectedInvoice.notes ? 'normal' : 'italic'
                  }}>
                    {selectedInvoice.notes || 'No status notes recorded yet.'}
                  </div>
                ) : (
                  <textarea
                    className="glass-input"
                    style={{ fontSize: '0.75rem', width: '100%', padding: '0.5rem' }}
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Add notes about payment status, verification, differences in items delivered..."
                  />
                )}
              </div>

              {/* Associated Purchase Order Section */}
              {selectedPO ? (
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} color="var(--color-cyan)" /> Associated Purchase Order Details
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>PO Number: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{selectedPO.poNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>PO Status: </span>
                      <span className={`badge ${
                        selectedPO.status === 'Fully Served' ? 'badge-served' : selectedPO.status === 'Partially Served' ? 'badge-partial' : selectedPO.status === 'Sent' ? 'badge-sent' : selectedPO.status === 'Ready' ? 'badge-ready' : selectedPO.status === 'Closed' ? 'badge-closed' : 'badge-draft'
                      }`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                        {selectedPO.status}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Supplier/Vendor: </span>
                      <strong>{selectedPO.vendor}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Item Ordered: </span>
                      <strong>{selectedPO.itemType}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Ordered Qty: </span>
                      <strong>{selectedPO.orderedQuantity}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Balance Qty: </span>
                      <strong style={{ color: selectedPO.balanceQuantity > 0 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>{selectedPO.balanceQuantity}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>PO Budget: </span>
                      <strong>₹{selectedPO.totalAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>PO Duration: </span>
                      <strong>{selectedPO.startDate} to {selectedPO.endDate}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-dark)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No associated Purchase Order details found.
                </div>
              )}

              {/* Associated Production Batch Section */}
              {selectedBatch ? (
                <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} color="var(--color-cyan)" /> Associated Production Batch
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Batch ID: </span>
                      <strong style={{ color: 'var(--color-cyan)' }}>{selectedBatch.id}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Batch Name: </span>
                      <strong style={{ color: 'var(--text-main)' }}>{selectedBatch.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Target Quantity: </span>
                      <strong>{selectedBatch.targetQuantity} units</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Batch Status: </span>
                      <span className={`badge ${selectedBatch.status === 'Completed' ? 'badge-served' : selectedBatch.status === 'In Production' ? 'badge-dispatched' : 'badge-draft'}`} style={{ fontSize: '0.65rem' }}>
                        {selectedBatch.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-dark)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No associated production batch found.
                </div>
              )}
              {role === 'Super Admin' && (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <button 
                    className="glass-btn-danger" 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete Invoice "${selectedInvoice.invoiceNumber}"? This will restore the PO balance and subtract delivered stock from inventory. This cannot be undone.`)) {
                        deleteInvoice(selectedInvoice.id);
                        setSelectedInvoiceId(null);
                      }
                    }}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Delete Invoice (Permanently)
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
