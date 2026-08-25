import React, { useState, useEffect } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  FileText, 
  Search, 
  Send, 
  Plus,
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Info,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function POsView() {
  const { 
    purchaseOrders, 
    batches, 
    products, 
    invoices, 
    updatePO, 
    dispatchPO, 
    addInvoice, 
    closePO,
    deletePO,
    getLocalDateStr,
    role, 
    generatePO, 
    updatePONotes, 
    companyConfig, 
    vendorsConfig, 
    createSinglePO,
    deliveryDestinations,
    addDeliveryDestination
  } = usePortal();

  const [selectedPOId, setSelectedPOId] = useState(null);
  const [previewPO, setPreviewPO] = useState(null);
  const [filterVendor, setFilterVendor] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice Form State
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => getLocalDateStr());
  const [logistics, setLogistics] = useState('');
  const [deliveryDestination, setDeliveryDestination] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoicePDFName, setInvoicePDFName] = useState('');
  const [invoicePDFUrl, setInvoicePDFUrl] = useState('');
  const [invoiceItemQuantities, setInvoiceItemQuantities] = useState({});

  // PO Edit Form State (only for Requested status by Operations)
  const [isEditing, setIsEditing] = useState(false);
  const [editPONumber, setEditPONumber] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editItemType, setEditItemType] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Accounts PO Generation / Approval Form State
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [accountsPONumber, setAccountsPONumber] = useState('');
  const [accountsVendor, setAccountsVendor] = useState('');
  const [accountsItemType, setAccountsItemType] = useState('');
  const [accountsOrderedQuantity, setAccountsOrderedQuantity] = useState('');
  const [accountsUnitPrice, setAccountsUnitPrice] = useState('');
  const [accountsStartDate, setAccountsStartDate] = useState('');
  const [accountsEndDate, setAccountsEndDate] = useState('');
  const [accountsPDFName, setAccountsPDFName] = useState('');
  const [accountsNotes, setAccountsNotes] = useState('');
  const [accountsItems, setAccountsItems] = useState([]);

  // PO Notes edit state
  const [isEditingPONotes, setIsEditingPONotes] = useState(false);
  const [poNotesInput, setPoNotesInput] = useState('');
  const [absorbFromPOId, setAbsorbFromPOId] = useState(null);
  const [absorbedQty, setAbsorbedQty] = useState(0);
  const [absorbInputQty, setAbsorbInputQty] = useState('');

  // Item Level Absorption States
  const [itemAbsorptions, setItemAbsorptions] = useState({});
  const [itemAbsorbInputs, setItemAbsorbInputs] = useState({});

  // Absorption Ignored POs State
  const [ignoredAbsorbPOIds, setIgnoredAbsorbPOIds] = useState([]);

  // Single Standalone PO Request Form State
  const [showSinglePOForm, setShowSinglePOForm] = useState(false);
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

  const selectedPO = purchaseOrders.find(p => p.id === selectedPOId);
  const selectedPOBatch = selectedPO ? batches.find(b => b.id === selectedPO.batchId) : null;
  const selectedPOProduct = selectedPO ? products.find(p => p.id === selectedPO.productId) : (selectedPOBatch ? products.find(p => p.id === selectedPOBatch.productId) : null);

  useEffect(() => {
    setIgnoredAbsorbPOIds([]);
    setAbsorbFromPOId(null);
    setAbsorbedQty(0);
    setItemAbsorptions({});
    setItemAbsorbInputs({});
    
    if (selectedPO) {
      setPoNotesInput(selectedPO.notes || '');
      setAccountsPONumber(selectedPO.poNumber.startsWith('PO-REQ-') ? `PO-YHL-${selectedPO.id.split('-')[1] || Math.floor(100+Math.random()*900)}` : selectedPO.poNumber);
      setAccountsVendor(selectedPO.vendor || '');
      setAccountsItemType(selectedPO.itemType || '');
      setAccountsOrderedQuantity(selectedPO.orderedQuantity || '');
      setAccountsUnitPrice(selectedPO.unitPrice || '');
      setAccountsStartDate(selectedPO.startDate || '');
      setAccountsEndDate(selectedPO.endDate || '');
      setAccountsPDFName(`PO_${selectedPO.poNumber.replace('PO-REQ-', 'YHL_')}.pdf`);
      setAccountsNotes('');

      const items = selectedPO.itemsList ? JSON.parse(JSON.stringify(selectedPO.itemsList)) : [{
        id: `${selectedPO.id}-item-0`,
        productId: selectedPO.productId,
        itemType: selectedPO.itemType,
        orderedQuantity: selectedPO.orderedQuantity,
        balanceQuantity: selectedPO.balanceQuantity,
        unitPrice: selectedPO.unitPrice,
        totalAmount: selectedPO.totalAmount
      }];
      setAccountsItems(items);

      const initialAbsorbInputs = {};
      items.forEach(item => {
        const firstPPO = purchaseOrders.find(po => 
          po.id !== selectedPO.id &&
          po.vendor === selectedPO.vendor &&
          ['Sent', 'Partially Served'].includes(po.status) &&
          po.itemsList && po.itemsList.some(poItem => 
            poItem.productId === item.productId &&
            poItem.itemType === item.itemType &&
            poItem.balanceQuantity > 0
          )
        );
        if (firstPPO) {
          const matchItem = firstPPO.itemsList.find(i => i.productId === item.productId && i.itemType === item.itemType);
          initialAbsorbInputs[item.id] = matchItem ? matchItem.balanceQuantity : '';
        }
      });
      setItemAbsorbInputs(initialAbsorbInputs);

      const initialInvoiceItems = {};
      items.forEach(item => {
        initialInvoiceItems[item.id] = '';
      });
      setInvoiceItemQuantities(initialInvoiceItems);

      const firstPPO = purchaseOrders.find(po => 
        po.id !== selectedPO.id &&
        po.vendor === selectedPO.vendor &&
        po.itemType === selectedPO.itemType &&
        ['Sent', 'Partially Served'].includes(po.status) &&
        po.balanceQuantity > 0
      );
      setAbsorbInputQty(firstPPO ? firstPPO.balanceQuantity : '');
    } else {
      setPoNotesInput('');
      setAbsorbInputQty('');
      setAccountsItems([]);
      setInvoiceItemQuantities({});
    }
    setIsEditingPONotes(false);
    setShowGenerateForm(false);
    setShowInvoiceForm(false);
    setAbsorbFromPOId(null);
    setAbsorbedQty(0);
  }, [selectedPOId]);

  // Handle PO editing save by Operations
  const handleSavePO = () => {
    if (!selectedPO) return;
    if (Number(editQty) <= 0) {
      alert("Ordered Quantity must be greater than 0!");
      return;
    }
    if (Number(editPrice) <= 0) {
      alert("Unit Price must be greater than 0!");
      return;
    }
    updatePO(selectedPO.id, {
      poNumber: editPONumber,
      vendor: editVendor,
      itemType: editItemType,
      orderedQuantity: Number(editQty),
      unitPrice: Number(editPrice),
      startDate: editStartDate,
      endDate: editEndDate
    });
    setIsEditing(false);
  };

  // Start editing by Operations
  const startEditing = () => {
    if (!selectedPO) return;
    setEditPONumber(selectedPO.poNumber);
    setEditQty(selectedPO.orderedQuantity);
    setEditPrice(selectedPO.unitPrice);
    setEditVendor(selectedPO.vendor);
    setEditItemType(selectedPO.itemType);
    setEditStartDate(selectedPO.startDate);
    setEditEndDate(selectedPO.endDate);
    setIsEditing(true);
  };

  // Handle Dispatch / Sending
  const handleDispatch = (poId) => {
    dispatchPO(poId);
  };

  const handleInvoiceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInvoicePDFName(file.name);
      try {
        const fileUrl = URL.createObjectURL(file);
        setInvoicePDFUrl(fileUrl);
      } catch (err) {
        console.error("Failed to create object URL:", err);
        setInvoicePDFUrl('#');
      }
    }
  };

  // Handle Invoice Submission
  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!selectedPOId) return;

    if (!selectedPO) return;

    const todayStr = getLocalDateStr();
    if (invoiceDate > todayStr) {
      alert("Invoice date cannot be in the future!");
      return;
    }
    if (invoiceDate < selectedPO.startDate) {
      alert(`Invoice date cannot be earlier than the PO Start Date (${selectedPO.startDate})!`);
      return;
    }

    // compile items list
    const items = selectedPO.itemsList || [];
    const invoiceItemsList = [];

    for (const item of items) {
      const qty = Number(invoiceItemQuantities[item.id]) || 0;
      if (qty < 0) {
        alert("Delivered quantity cannot be negative!");
        return;
      }
      if (qty > item.balanceQuantity) {
        alert(`Delivered quantity for ${item.itemType} (${qty}) cannot exceed balance (${item.balanceQuantity})!`);
        return;
      }
      if (qty > 0) {
        invoiceItemsList.push({
          productId: item.productId,
          itemType: item.itemType,
          quantityDelivered: qty,
          unitPrice: item.unitPrice,
          totalAmount: qty * item.unitPrice
        });
      }
    }

    if (invoiceItemsList.length === 0) {
      alert("Please log at least one item with a quantity greater than 0!");
      return;
    }

    addInvoice(selectedPOId, {
      invoiceNumber,
      invoiceDate,
      logistics,
      destination: deliveryDestination,
      notes: invoiceNotes,
      pdfName: invoicePDFName || null,
      pdfUrl: invoicePDFUrl || (invoicePDFName ? '#' : null),
      itemsList: invoiceItemsList
    });

    // Reset Form
    setInvoiceNumber('');
    setLogistics('');
    setDeliveryDestination('');
    setInvoiceNotes('');
    setInvoicePDFName('');
    setInvoicePDFUrl('');
    setInvoiceItemQuantities({});
    setShowInvoiceForm(false);
  };

  // Handle Standalone Single PO Request Submit
  const handleSinglePOSubmit = (e) => {
    e.preventDefault();
    if (!singlePOItemType || !singlePOVendor || !singlePOQuantity || !singlePOUnitPrice) return;

    if (Number(singlePOQuantity) <= 0 || Number(singlePOUnitPrice) <= 0) {
      alert("Quantity and Unit Price must be greater than 0!");
      return;
    }

    createSinglePO({
      productId: singlePOProduct || null,
      vendor: singlePOVendor,
      itemType: singlePOItemType,
      orderedQuantity: Number(singlePOQuantity),
      unitPrice: Number(singlePOUnitPrice),
      startDate: singlePOStartDate,
      endDate: singlePOEndDate,
      notes: singlePONotes ? `Operations Note: ${singlePONotes}` : ''
    });

    alert('Standalone Purchase Order request created successfully!');
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
  };

  // Handle Serve & Close PO
  const handleClosePO = (poId, shouldCarryForward) => {
    closePO(poId, shouldCarryForward);
    // Refresh selection
    setSelectedPOId(poId);
  };

  // Handle Accounts PO Generation, Editing & PDF Upload
  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    if (!selectedPOId || !accountsPONumber) return;

    // Validate accountsItems
    for (const item of accountsItems) {
      if (item.orderedQuantity < 0) {
        alert("Quantity must be greater than or equal to 0!");
        return;
      }
      if (item.unitPrice <= 0) {
        alert("Unit Price must be greater than 0!");
        return;
      }
    }

    // compile absorptions
    const absorptionsList = Object.values(itemAbsorptions);

    generatePO(selectedPOId, {
      poNumber: accountsPONumber,
      vendor: accountsVendor,
      startDate: accountsStartDate,
      endDate: accountsEndDate,
      pdfName: accountsPDFName || `PO_${accountsPONumber}.pdf`,
      pdfUrl: '#',
      notes: accountsNotes,
      itemsList: accountsItems,
      absorptionsList
    });
    setShowGenerateForm(false);
  };

  // Handle saving PO notes
  const handleSavePONotes = () => {
    updatePONotes(selectedPOId, poNotesInput);
    setIsEditingPONotes(false);
  };

  // Filter & Search POs
  const filteredPOs = purchaseOrders.filter(po => {
    const batch = batches.find(b => b.id === po.batchId);
    const prod = po.productId ? products.find(p => p.id === po.productId) : (batch ? products.find(p => p.id === batch.productId) : null);
    const productName = prod ? prod.name : '';

    const matchesVendor = filterVendor === 'All' || po.vendor === filterVendor;
    const matchesStatus = filterStatus === 'All' || po.status === filterStatus;
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesVendor && matchesStatus && matchesSearch;
  });

  // Extract unique vendors
  const uniqueVendors = ['All', ...new Set(purchaseOrders.map(p => p.vendor))];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders (POs)</h1>
          <p className="page-subtitle">Track materials, contract pricing, deliveries, and balances per supplier</p>
        </div>
        {role === 'Operations' && (
          <button className="glass-btn-primary" onClick={() => setShowSinglePOForm(true)}>
            <Plus size={16} style={{ marginRight: '4px' }} /> Create PO Request
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
          <input 
            type="text" 
            className="glass-input" 
            style={{ paddingLeft: '2.25rem' }} 
            placeholder="Search POs, vendors, item types or batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select 
            className="glass-input" 
            style={{ width: '160px' }}
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
          >
            <option value="All">All Vendors</option>
            {uniqueVendors.filter(v => v !== 'All').map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          <select 
            className="glass-input" 
            style={{ width: '160px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Ready">Ready</option>
            <option value="Sent">Sent</option>
            <option value="Partially Served">Partially Served</option>
            <option value="Fully Served">Fully Served</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* PO Table list */}
      <div className="glass-panel glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Batch</th>
              <th>Vendor</th>
              <th>Item Type</th>
              <th>Ordered Qty</th>
              <th>Balance Qty</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No Purchase Orders matched your filters.
                </td>
              </tr>
            ) : (
              filteredPOs.map(po => {
                const batch = batches.find(b => b.id === po.batchId);
                return (
                  <tr 
                    key={po.id} 
                    onClick={() => { setSelectedPOId(po.id); setIsEditing(false); setShowInvoiceForm(false); }} 
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{po.poNumber}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} title={batch?.name}>
                      {batch?.id}
                    </td>
                    <td>{po.vendor}</td>
                    <td>{po.itemType}</td>
                    <td>{po.orderedQuantity}</td>
                    <td style={{ 
                      fontWeight: 600, 
                      color: po.balanceQuantity === 0 ? 'var(--color-emerald)' : po.balanceQuantity < po.orderedQuantity ? 'var(--color-amber)' : 'var(--text-muted)' 
                    }}>
                      {po.balanceQuantity}
                    </td>
                    <td style={{ fontWeight: 500 }}>₹{po.totalAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${
                        po.status === 'Fully Served' ? 'badge-served' : po.status === 'Partially Served' ? 'badge-partial' : po.status === 'Sent' ? 'badge-sent' : po.status === 'Ready' ? 'badge-ready' : po.status === 'Closed' ? 'badge-closed' : 'badge-draft'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        className="glass-btn" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPOId(po.id);
                          setIsEditing(false);
                          setShowInvoiceForm(false);
                        }}
                      >
                        Details
                      </button>
                      {role === 'Super Admin' && (
                        <button 
                          className="glass-btn" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-rose)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete PO "${po.poNumber}"? This will delete all associated invoices and reverse stock changes in inventory. This cannot be undone.`)) {
                              deletePO(po.id);
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

      {/* PO Detail Drawer Slider */}
      {selectedPO && (
        <div className="drawer-overlay" onClick={() => setSelectedPOId(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '95vh', overflowY: 'auto' }}>
            <div className="drawer-header">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Purchase Order Detail
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                  {selectedPO.poNumber}
                </h2>
              </div>
              <button className="drawer-close" onClick={() => setSelectedPOId(null)}>×</button>
            </div>

            {/* Main PO Info */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--color-cyan)' }}>
              
              {isEditing ? (
                // Edit Form (Draft/Requested status only by Operations)
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="glass-label">PO Number</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={editPONumber} 
                      onChange={(e) => setEditPONumber(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="glass-label">Vendor</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={editVendor} 
                      onChange={(e) => setEditVendor(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="glass-label">Material / Item Type</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={editItemType} 
                      onChange={(e) => setEditItemType(e.target.value)} 
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="glass-label">Ordered Qty</label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={editQty} 
                        onChange={(e) => setEditQty(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="glass-label">Unit Price (₹)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="glass-input" 
                        value={editPrice} 
                        onChange={(e) => setEditPrice(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="glass-label">Start Date</label>
                      <input 
                        type="date" 
                        className="glass-input" 
                        value={editStartDate} 
                        onChange={(e) => setEditStartDate(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="glass-label">End Date</label>
                      <input 
                        type="date" 
                        className="glass-input" 
                        value={editEndDate} 
                        onChange={(e) => setEditEndDate(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button className="glass-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="glass-btn-primary" onClick={handleSavePO}>Save Changes</button>
                  </div>
                </div>
              ) : (
                // Normal View
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier & Item</span>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedPO.vendor}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-cyan)' }}>{selectedPO.itemType}</div>
                    </div>
                    <span className={`badge ${
                      selectedPO.status === 'Fully Served' ? 'badge-served' : selectedPO.status === 'Partially Served' ? 'badge-partial' : selectedPO.status === 'Sent' ? 'badge-sent' : selectedPO.status === 'Ready' ? 'badge-ready' : selectedPO.status === 'Closed' ? 'badge-closed' : 'badge-draft'
                    }`}>
                      {selectedPO.status}
                    </span>
                  </div>

                  <div className="grid-cols-3" style={{ gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Ordered Qty</span>
                      <strong style={{ fontSize: '1.1rem' }}>{selectedPO.orderedQuantity}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Balance Qty</span>
                      <strong style={{ fontSize: '1.1rem', color: selectedPO.balanceQuantity > 0 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                        {selectedPO.balanceQuantity}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Budget</span>
                      <strong style={{ fontSize: '1.1rem' }}>₹{selectedPO.totalAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {selectedPO.carriedForwardQty && (
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--color-emerald)' }}>
                      <RefreshCw size={14} style={{ flexShrink: 0 }} />
                      <span>Includes carried-forward balance of {selectedPO.carriedForwardQty} units.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div>Production Batch: <strong style={{ color: 'var(--text-main)' }}>{selectedPOBatch?.name || 'N/A (Standalone)'}</strong></div>
                    {selectedPOProduct && <div>Product Category: <strong>{selectedPOProduct.name} ({selectedPOProduct.category})</strong></div>}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                      <div>Start: <strong>{selectedPO.startDate}</strong></div>
                      <div>End: <strong>{selectedPO.endDate}</strong></div>
                    </div>
                    {selectedPO.pdfName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>📄 PO PDF:</span>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setPreviewPO(selectedPO); }}
                          style={{ color: 'var(--color-cyan)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          {selectedPO.pdfName}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Items List in Normal View */}
                  <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Purchase Order Items List
                    </div>
                    {(selectedPO.itemsList || []).map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                            <span style={{ color: 'var(--text-main)' }}>{item.itemType} {prod ? `[${prod.name}]` : ''}</span>
                            <span style={{ color: item.balanceQuantity > 0 ? 'var(--color-amber)' : 'var(--color-emerald)', fontWeight: 600 }}>
                              Bal: {item.balanceQuantity} / {item.orderedQuantity}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dark)', fontSize: '0.7rem' }}>
                            <span>Rate: ₹{item.unitPrice.toFixed(2)}</span>
                            <span>Amount: ₹{item.totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          {item.carryForwardDetailStr && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-emerald)', marginTop: '0.15rem' }}>
                              ✓ Absorbed {item.carryForwardDetailStr}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    {/* Operations Actions */}
                    {role === 'Operations' && (
                      <>
                        {selectedPO.status === 'Requested' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                            <button className="glass-btn" onClick={startEditing} style={{ width: '100%', justifyContent: 'center' }}>
                              Edit requested terms
                            </button>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', justifyContent: 'center', textAlign: 'center' }}>
                              <span>Awaiting Accounts PO generation & PDF upload</span>
                            </div>
                          </div>
                        )}
                        {selectedPO.status === 'Ready' && (
                          <button className="glass-btn-primary" onClick={() => handleDispatch(selectedPO.id)} style={{ width: '100%', justifyContent: 'center' }}>
                            <Send size={14} /> Send PO to Supplier
                          </button>
                        )}
                        {(selectedPO.status === 'Sent' || selectedPO.status === 'Partially Served') && (
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button 
                              className="glass-btn" 
                              onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                              style={{ flexGrow: 1, justifyContent: 'center', borderColor: 'var(--border-color-hover)' }}
                            >
                              <PlusCircle size={14} /> Log Invoice
                            </button>
                            <button 
                              className="glass-btn-danger" 
                              onClick={() => {
                                if (selectedPO.balanceQuantity > 0) {
                                  const cf = window.confirm(`Mark PO Served? Do you want to carry forward the remaining ${selectedPO.balanceQuantity} units to the next PO for this vendor?`);
                                  handleClosePO(selectedPO.id, cf);
                                } else {
                                  if (window.confirm("Are you sure you want to mark this PO as closed/served?")) {
                                    handleClosePO(selectedPO.id, false);
                                  }
                                }
                              }}
                              style={{ flexGrow: 1, justifyContent: 'center' }}
                            >
                              Mark Served / Close
                            </button>
                          </div>
                        )}
                        {['Fully Served', 'Closed'].includes(selectedPO.status) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            No operations actions available (PO status: {selectedPO.status})
                          </div>
                        )}
                      </>
                    )}

                    {/* Accounts Actions */}
                    {role === 'Accounts' && (
                      <>
                        {selectedPO.status === 'Requested' && (
                          <button 
                            className="glass-btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', background: 'var(--grad-success-real)' }}
                            onClick={() => setShowGenerateForm(!showGenerateForm)}
                          >
                            <CheckCircle size={14} /> Approve & Generate PO (Full Editor)
                          </button>
                        )}
                        {selectedPO.status === 'Ready' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', textAlign: 'center', padding: '0.5rem', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', borderRadius: '8px' }}>
                            PO Approved & Ready. Awaiting Operations dispatch to supplier.
                          </div>
                        )}
                        {(selectedPO.status === 'Sent' || selectedPO.status === 'Partially Served') && (
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button 
                              className="glass-btn" 
                              onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                              style={{ flexGrow: 1, justifyContent: 'center', borderColor: 'var(--border-color-hover)' }}
                            >
                              <PlusCircle size={14} /> Log Invoice
                            </button>
                            <button 
                              className="glass-btn-danger" 
                              onClick={() => {
                                if (selectedPO.balanceQuantity > 0) {
                                  const cf = window.confirm(`Mark PO Served? Do you want to carry forward the remaining ${selectedPO.balanceQuantity} units to the next PO for this vendor?`);
                                  handleClosePO(selectedPO.id, cf);
                                } else {
                                  if (window.confirm("Are you sure you want to mark this PO as closed/served?")) {
                                    handleClosePO(selectedPO.id, false);
                                  }
                                }
                              }}
                              style={{ flexGrow: 1, justifyContent: 'center' }}
                            >
                              Mark Served / Close
                            </button>
                          </div>
                        )}
                        {['Fully Served', 'Closed'].includes(selectedPO.status) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', textAlign: 'center', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
                            PO fully served and reconciled (Status: {selectedPO.status})
                          </div>
                        )}
                      </>
                    )}
                    {role === 'Super Admin' && (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button 
                          className="glass-btn-danger" 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete PO "${selectedPO.poNumber}"? This will delete all associated invoices and reverse stock changes in inventory. This cannot be undone.`)) {
                              deletePO(selectedPO.id);
                              setSelectedPOId(null);
                            }
                          }}
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          Delete Purchase Order (Permanently)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Editable PO Notes Panel */}
                  <div className="glass-panel" style={{ padding: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>PO Status & Ledger Notes</span>
                      {!isEditingPONotes ? (
                        <button 
                          className="glass-btn" 
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          onClick={() => setIsEditingPONotes(true)}
                        >
                          Edit
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            className="glass-btn-primary" 
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                            onClick={handleSavePONotes}
                          >
                            Save
                          </button>
                          <button 
                            className="glass-btn" 
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                            onClick={() => { setPoNotesInput(selectedPO.notes || ''); setIsEditingPONotes(false); }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {!isEditingPONotes ? (
                      <div style={{ 
                        background: 'var(--bg-input)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '0.75rem', 
                        fontSize: '0.75rem', 
                        whiteSpace: 'pre-line',
                        color: selectedPO.notes ? 'var(--text-main)' : 'var(--text-muted)',
                        fontStyle: selectedPO.notes ? 'normal' : 'italic'
                      }}>
                        {selectedPO.notes || 'No notes or status comments recorded yet.'}
                      </div>
                    ) : (
                      <textarea
                        className="glass-input"
                        style={{ fontSize: '0.75rem', width: '100%', padding: '0.5rem' }}
                        rows={3}
                        value={poNotesInput}
                        onChange={(e) => setPoNotesInput(e.target.value)}
                        placeholder="Add notes about supplier correspondence, dispatch dates, or shortage carry-forwards..."
                      />
                    )}
                  </div>

                  {/* Generate & Upload PO Accounts Subform */}
                  {showGenerateForm && (
                    <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '0.75rem', animation: 'scale-up 0.2s ease-out', border: '1px solid var(--color-emerald)', background: 'rgba(16, 185, 129, 0.02)' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-emerald)' }}>
                        <CheckCircle size={16} /> Edit & Approve Purchase Order
                      </h3>

                      <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="glass-label">PO Number</label>
                          <input 
                            type="text" 
                            className="glass-input" 
                            value={accountsPONumber} 
                            onChange={(e) => setAccountsPONumber(e.target.value)} 
                            placeholder="e.g. PO-YHL-9821"
                            required 
                          />
                        </div>

                        <div className="form-group">
                          <label className="glass-label">Vendor</label>
                          <input 
                            type="text" 
                            className="glass-input" 
                            value={accountsVendor} 
                            onChange={(e) => setAccountsVendor(e.target.value)} 
                            required 
                          />
                        </div>

                        {/* Items List Editor */}
                        <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Line Items Pricing & Quantities
                          </span>
                          
                          {accountsItems.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            const ppo = purchaseOrders.find(po => 
                              po.id !== selectedPO.id &&
                              po.vendor === selectedPO.vendor &&
                              ['Sent', 'Partially Served'].includes(po.status) &&
                              !ignoredAbsorbPOIds.includes(po.id) &&
                              (!selectedPO.batchId ? !po.batchId : true) &&
                              po.itemsList && po.itemsList.some(poItem => 
                                poItem.productId === item.productId &&
                                poItem.itemType === item.itemType &&
                                poItem.balanceQuantity > 0
                              )
                            );
                            const ppoItem = ppo?.itemsList.find(i => i.productId === item.productId && i.itemType === item.itemType);
                            const availableBal = ppoItem ? ppoItem.balanceQuantity : 0;
                            const isAbsorbed = !!itemAbsorptions[item.id];

                            return (
                              <div key={item.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                                  <span style={{ color: 'var(--color-cyan)' }}>Item #{index + 1}: {item.itemType}</span>
                                  <span>Product: {product ? product.name : 'Standalone'}</span>
                                </div>

                                <div className="form-row" style={{ margin: 0 }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="glass-label">Quantity</label>
                                    <input 
                                      type="number" 
                                      className="glass-input"
                                      style={{ height: '34px' }}
                                      value={item.orderedQuantity} 
                                      onChange={(e) => {
                                        const val = Math.max(0, Number(e.target.value) || 0);
                                        setAccountsItems(prev => prev.map(i => i.id === item.id ? { ...i, orderedQuantity: val, totalAmount: val * i.unitPrice } : i));
                                      }}
                                      required
                                      disabled={isAbsorbed}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label className="glass-label">Unit Price (₹)</label>
                                    <input 
                                      type="number" 
                                      step="0.01" 
                                      className="glass-input"
                                      style={{ height: '34px' }}
                                      value={item.unitPrice} 
                                      onChange={(e) => {
                                        const val = Math.max(0.01, Number(e.target.value) || 0.01);
                                        setAccountsItems(prev => prev.map(i => i.id === item.id ? { ...i, unitPrice: val, totalAmount: i.orderedQuantity * val } : i));
                                      }}
                                      required
                                    />
                                  </div>
                                </div>

                                {ppo && (
                                  <div style={{ marginTop: '0.25rem', padding: '0.5rem', border: '1px solid var(--color-amber)', background: 'rgba(245,158,11,0.04)', borderRadius: '6px', fontSize: '0.75rem' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--color-amber)', marginBottom: '0.25rem' }}>
                                      ⚠️ Pending PO Balance Available: {ppo.poNumber} ({availableBal} units)
                                    </div>
                                    {!isAbsorbed ? (
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span>Absorb qty:</span>
                                        <input 
                                          type="number"
                                          className="glass-input"
                                          style={{ width: '80px', height: '28px', padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
                                          min={1}
                                          max={availableBal}
                                          value={itemAbsorbInputs[item.id] !== undefined ? itemAbsorbInputs[item.id] : availableBal}
                                          onChange={(e) => {
                                            const val = Math.max(1, Math.min(availableBal, Number(e.target.value) || 1));
                                            setItemAbsorbInputs(prev => ({ ...prev, [item.id]: val }));
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="glass-btn"
                                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', height: '28px' }}
                                          onClick={() => setItemAbsorbInputs(prev => ({ ...prev, [item.id]: availableBal }))}
                                        >
                                          Use Full
                                        </button>
                                        <button
                                          type="button"
                                          className="glass-btn-primary"
                                          style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', height: '28px', background: 'var(--grad-primary)', border: 'none' }}
                                          onClick={() => {
                                            const absorbQty = Number(itemAbsorbInputs[item.id]) || availableBal;
                                            const originalQty = item.orderedQuantity;
                                            const newQty = Math.max(0, originalQty - absorbQty);
                                            
                                            setAccountsItems(prev => prev.map(i => i.id === item.id ? { ...i, orderedQuantity: newQty, totalAmount: newQty * i.unitPrice } : i));
                                            
                                            setItemAbsorptions(prev => ({
                                              ...prev,
                                              [item.id]: {
                                                absorbFromPOId: ppo.id,
                                                absorbedQty: absorbQty,
                                                absorbPONumber: ppo.poNumber,
                                                absorbProductId: item.productId,
                                                absorbItemType: item.itemType
                                              }
                                            }));
                                          }}
                                        >
                                          Absorb
                                        </button>
                                        <button
                                          type="button"
                                          className="glass-btn"
                                          style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', height: '28px', color: 'var(--text-muted)' }}
                                          onClick={() => {
                                            setIgnoredAbsorbPOIds(prev => [...prev, ppo.id]);
                                          }}
                                        >
                                          Ignore
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>
                                          ✓ Absorbed {itemAbsorptions[item.id]?.absorbedQty} units from past PO
                                        </span>
                                        <button
                                          type="button"
                                          className="glass-btn"
                                          style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}
                                          onClick={() => {
                                            const originalPOItem = selectedPO.itemsList?.find(i => i.id === item.id) || selectedPO;
                                            const origQty = originalPOItem.orderedQuantity;
                                            
                                            setAccountsItems(prev => prev.map(i => i.id === item.id ? { ...i, orderedQuantity: origQty, totalAmount: origQty * i.unitPrice } : i));
                                            
                                            setItemAbsorptions(prev => {
                                              const copy = { ...prev };
                                              copy[item.id] = null;
                                              delete copy[item.id];
                                              return copy;
                                            });
                                            setItemAbsorbInputs(prev => ({ ...prev, [item.id]: availableBal }));
                                          }}
                                        >
                                          Undo
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="glass-label">Start Date</label>
                            <input 
                              type="date" 
                              className="glass-input" 
                              value={accountsStartDate} 
                              onChange={(e) => setAccountsStartDate(e.target.value)} 
                              required 
                            />
                          </div>
                          <div className="form-group">
                            <label className="glass-label">End Date</label>
                            <input 
                              type="date" 
                              className="glass-input" 
                              value={accountsEndDate} 
                              onChange={(e) => setAccountsEndDate(e.target.value)} 
                              required 
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="glass-label">Mock PDF Document Upload</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              className="glass-input" 
                              value={accountsPDFName} 
                              onChange={(e) => setAccountsPDFName(e.target.value)} 
                              placeholder="e.g. PO_KPL_2026.pdf"
                              required 
                            />
                            <button 
                              type="button" 
                              className="glass-btn" 
                              style={{ fontSize: '0.75rem', height: '38px', flexShrink: 0 }}
                              onClick={() => {
                                const mockName = `PO_${accountsVendor.replace(/\s+/g, '_')}_${accountsPONumber || 'DOC'}.pdf`;
                                setAccountsPDFName(mockName);
                              }}
                            >
                              Auto-Name
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="glass-label">Accounts Status Notes</label>
                          <textarea 
                            className="glass-input" 
                            value={accountsNotes} 
                            onChange={(e) => setAccountsNotes(e.target.value)} 
                            placeholder="Appended to PO status notes..."
                            rows={2}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button type="button" className="glass-btn" onClick={() => setShowGenerateForm(false)}>Cancel</button>
                          <button type="submit" className="glass-btn-primary" style={{ background: 'var(--grad-success-real)' }}>Generate & Approve</button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Log Invoice Nested Form */}
            {showInvoiceForm && (
              <div className="glass-panel" style={{ padding: '1.25rem', animation: 'scale-up 0.2s ease-out' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PlusCircle size={16} color="var(--color-cyan)" /> Log Invoice Details
                </h3>
                <form onSubmit={handleInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="glass-label">Invoice Number</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={invoiceNumber} 
                      onChange={(e) => setInvoiceNumber(e.target.value)} 
                      placeholder="e.g. INV-KPL-1002"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="glass-label">Invoice Date</label>
                    <input 
                      type="date" 
                      className="glass-input" 
                      value={invoiceDate} 
                      onChange={(e) => setInvoiceDate(e.target.value)} 
                      min={selectedPO.startDate}
                      max={getLocalDateStr()}
                      required 
                    />
                  </div>

                  {/* Item-level Delivered Quantities */}
                  <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Delivered Quantities Per Item
                      </span>
                      <button
                        type="button"
                        className="glass-btn"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => {
                          const updated = {};
                          (selectedPO.itemsList || []).forEach(item => {
                            updated[item.id] = item.balanceQuantity;
                          });
                          setInvoiceItemQuantities(updated);
                        }}
                      >
                        Use All Full
                      </button>
                    </div>

                    {(selectedPO.itemsList || []).map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              #{index + 1}: {item.itemType} {product ? `[${product.name}]` : ''}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Balance: <strong style={{ color: 'var(--color-amber)' }}>{item.balanceQuantity}</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="number"
                              className="glass-input"
                              style={{ flexGrow: 1, height: '32px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              placeholder="Delivered qty..."
                              min={0}
                              max={item.balanceQuantity}
                              value={invoiceItemQuantities[item.id] !== undefined ? invoiceItemQuantities[item.id] : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, Math.min(item.balanceQuantity, Number(e.target.value) || 0));
                                setInvoiceItemQuantities(prev => ({
                                  ...prev,
                                  [item.id]: val
                                }));
                              }}
                            />
                            <button
                              type="button"
                              className="glass-btn"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', height: '32px' }}
                              onClick={() => {
                                setInvoiceItemQuantities(prev => ({
                                  ...prev,
                                  [item.id]: item.balanceQuantity
                                }));
                              }}
                            >
                              Use Full
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="form-group">
                    <label className="glass-label">Delivery Destination</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        className="glass-input" 
                        value={deliveryDestination} 
                        onChange={(e) => setDeliveryDestination(e.target.value)}
                        required
                      >
                        <option value="">-- Select Destination --</option>
                        {(deliveryDestinations || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="glass-btn"
                        style={{ flexShrink: 0, padding: '0.25rem 0.75rem', height: '38px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const newDest = prompt("Enter new delivery destination:");
                          if (newDest && newDest.trim()) {
                            const trimmed = newDest.trim();
                            addDeliveryDestination(trimmed);
                            setDeliveryDestination(trimmed);
                          }
                        }}
                      >
                        + Add New
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="glass-label">Logistics / Transporter Details</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={logistics} 
                      onChange={(e) => setLogistics(e.target.value)} 
                      placeholder="e.g. Delhivery Express - Track #9871"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="glass-label">Notes (optional)</label>
                    <textarea 
                      className="glass-input" 
                      value={invoiceNotes} 
                      onChange={(e) => setInvoiceNotes(e.target.value)} 
                      placeholder="Enter details about delivery condition, partial items..."
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label className="glass-label">Upload Invoice PDF / Document</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="file" 
                          id="invoice-pdf-upload" 
                          accept=".pdf,image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleInvoiceFileChange}
                        />
                        <button 
                          type="button" 
                          className="glass-btn" 
                          style={{ height: '38px', flexGrow: 1, justifyContent: 'center', background: 'var(--bg-input)' }}
                          onClick={() => document.getElementById('invoice-pdf-upload').click()}
                        >
                          📎 Choose Invoice File
                        </button>
                        
                        <button 
                          type="button" 
                          className="glass-btn" 
                          style={{ fontSize: '0.75rem', height: '38px', flexShrink: 0 }}
                          onClick={() => {
                            const mockName = `INV_${(selectedPO?.vendor || 'Vendor').replace(/\s+/g, '_')}_${invoiceNumber || 'DOC'}.pdf`;
                            setInvoicePDFName(mockName);
                            setInvoicePDFUrl('#');
                          }}
                        >
                          Auto-Generate Mock
                        </button>
                      </div>
                      
                      {invoicePDFName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 500, padding: '0.25rem 0.5rem', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Selected: <strong>{invoicePDFName}</strong></span>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: 'var(--color-rose)', cursor: 'pointer', fontSize: '0.8rem' }}
                            onClick={() => {
                              setInvoicePDFName('');
                              setInvoicePDFUrl('');
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button type="button" className="glass-btn" onClick={() => { setShowInvoiceForm(false); setInvoicePDFName(''); setInvoicePDFUrl(''); }}>Cancel</button>
                    <button type="submit" className="glass-btn-primary">Log & Add to Stock</button>
                  </div>
                </form>
              </div>
            )}

            {/* Invoices List */}
            <div style={{ marginTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={16} /> Invoice Ledger ({selectedPO.invoiceIds.length})
              </h3>
              
              {selectedPO.invoiceIds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dark)', fontSize: '0.8rem', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
                  No invoices logged against this purchase order yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedPO.invoiceIds.map(invId => {
                    const inv = invoices.find(i => i.id === invId);
                    if (!inv) return null;
                    return (
                      <div key={inv.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inv.invoiceNumber}</span>
                          <span style={{ color: 'var(--text-dark)', fontSize: '0.7rem' }}>Date: {inv.invoiceDate}</span>
                          {inv.logistics && <span style={{ color: 'var(--color-cyan)', fontSize: '0.7rem', display: 'block', marginTop: '0.15rem' }}>Logistics: {inv.logistics}</span>}
                          {inv.destination && <span style={{ color: 'var(--color-amber)', fontSize: '0.7rem', display: 'block', marginTop: '0.15rem', fontWeight: 500 }}>Destination: {inv.destination}</span>}
                          {inv.notes && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem', fontStyle: 'italic', display: 'block' }}>"{inv.notes}"</span>}
                          {inv.pdfName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '6px', fontSize: '0.7rem', width: 'fit-content' }}>
                              <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>📄 Invoice PDF:</span>
                              <a 
                                href={inv.pdfUrl || '#'} 
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  if (!inv.pdfUrl || inv.pdfUrl === '#') {
                                    e.preventDefault();
                                    alert(`Mock opening PDF: ${inv.pdfName}`);
                                  }
                                }}
                                style={{ color: 'var(--color-cyan)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                              >
                                {inv.pdfName}
                              </a>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{inv.quantityDelivered} units</strong>
                          <span style={{ color: 'var(--color-emerald)', fontWeight: 500 }}>₹{inv.invoiceAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Standalone Single PO Request Modal */}
      {showSinglePOForm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '540px', animation: 'scale-up 0.2s ease-out' }}>
            <div className="drawer-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Initiate Standalone PO Request</h2>
              <button className="drawer-close" onClick={closeSinglePOForm}>×</button>
            </div>

            <form onSubmit={handleSinglePOSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">Associate Product (Optional)</label>
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
                  >
                    <option value="">None / Standalone Component</option>
                    {products.map(p => (
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
      )}

      {/* PO Preview Modal */}
      {previewPO && (() => {
        const vendor = vendorsConfig[previewPO.vendor] || {
          name: previewPO.vendor,
          address: 'Supplier Address Details',
          gstin: 'N/A',
          stateName: 'N/A',
          stateCode: '0'
        };
        const product = products.find(p => p.id === previewPO.productId) || {
          name: 'Item',
          sku: 'N/A',
          hsn: '21069099'
        };
        
        const items = previewPO.itemsList || [];
        const subtotal = items.reduce((sum, item) => sum + (item.orderedQuantity * item.unitPrice), 0);
        const totalQty = items.reduce((sum, item) => sum + item.orderedQuantity, 0);
        
        const isSameState = String(companyConfig.shipToStateCode).trim() === String(vendor.stateCode).trim();
        const cgstAmount = isSameState ? subtotal * 0.025 : 0;
        const sgstAmount = isSameState ? subtotal * 0.025 : 0;
        const igstAmount = !isSameState ? subtotal * 0.05 : 0;
        const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

        return (
          <div className="modal-overlay po-preview-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPreviewPO(null)}>
            <div className="modal-content po-preview-modal-content" style={{ maxWidth: '840px', background: 'var(--bg-card)', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #po-print-area, #po-print-area * {
                    visibility: visible;
                  }
                  #po-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    color: #000 !important;
                    background: #fff !important;
                  }
                  .po-preview-modal-actions {
                    display: none !important;
                  }
                  .po-preview-modal-overlay {
                    background: none !important;
                    position: static !important;
                  }
                  .po-preview-modal-content {
                    background: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    max-height: none !important;
                    overflow: visible !important;
                  }
                }
              `}} />

              <div className="po-preview-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Purchase Order Preview</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="glass-btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
                  <button className="glass-btn" onClick={() => setPreviewPO(null)}>Close</button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="po-print-area" style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
                <div style={{
                  background: '#fff',
                  color: '#000',
                  fontFamily: '"Courier New", Courier, monospace, Arial, sans-serif',
                  border: '2px solid #000',
                  width: '100%',
                  maxWidth: '780px',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                  fontSize: '11px',
                  lineHeight: '1.3'
                }}>
                  
                  {/* Title */}
                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', padding: '6px 0', borderBottom: '2px solid #000', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Purchase Order
                  </div>

                  {/* Header Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', width: '100%' }}>
                    
                    {/* Left Column (Addresses) */}
                    <div style={{ borderRight: '2px solid #000' }}>
                      
                      {/* Invoice To */}
                      <div style={{ padding: '6px', minHeight: '90px' }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#666', marginBottom: '2px' }}>Invoice To</div>
                        <strong>{companyConfig.invoiceToName}</strong>
                        <div style={{ whiteSpace: 'pre-wrap', margin: '2px 0' }}>{companyConfig.invoiceToAddress}</div>
                        <div>GSTIN/UIN: <strong>{companyConfig.invoiceToGSTIN}</strong></div>
                        <div>State Name: <strong>{companyConfig.invoiceToStateName}</strong>, Code: <strong>{companyConfig.invoiceToStateCode}</strong></div>
                        {companyConfig.invoiceToCIN && <div>CIN: <strong>{companyConfig.invoiceToCIN}</strong></div>}
                        <div>E-Mail: {companyConfig.invoiceToEmail}</div>
                      </div>

                      {/* Consignee (Ship To) */}
                      <div style={{ padding: '6px', borderTop: '2px solid #000', minHeight: '95px' }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#666', marginBottom: '2px' }}>Consignee (Ship to)</div>
                        <strong>{companyConfig.shipToName}</strong>
                        <div style={{ whiteSpace: 'pre-wrap', margin: '2px 0' }}>{companyConfig.shipToAddress}</div>
                        <div>GSTIN/UIN: <strong>{companyConfig.shipToGSTIN}</strong></div>
                        <div>State Name: <strong>{companyConfig.shipToStateName}</strong>, Code: <strong>{companyConfig.shipToStateCode}</strong></div>
                        <div>E-Mail: {companyConfig.shipToEmail}</div>
                      </div>

                      {/* Supplier (Bill From) */}
                      <div style={{ padding: '6px', borderTop: '2px solid #000', minHeight: '90px' }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#666', marginBottom: '2px' }}>Supplier (Bill from)</div>
                        <strong>{vendor.name}</strong>
                        <div style={{ whiteSpace: 'pre-wrap', margin: '2px 0' }}>{vendor.address}</div>
                        <div>GSTIN/UIN: <strong>{vendor.gstin}</strong></div>
                        <div>State Name: <strong>{vendor.stateName}</strong>, Code: <strong>{vendor.stateCode}</strong></div>
                      </div>

                    </div>

                    {/* Right Column (PO Details) */}
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000' }}>
                        <div style={{ padding: '6px', borderRight: '2px solid #000', minHeight: '45px' }}>
                          <div style={{ fontSize: '9px', color: '#666' }}>Voucher No.</div>
                          <strong>{previewPO.poNumber}</strong>
                        </div>
                        <div style={{ padding: '6px', minHeight: '45px' }}>
                          <div style={{ fontSize: '9px', color: '#666' }}>Dated</div>
                          <strong>{previewPO.startDate ? new Date(previewPO.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : ''}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000' }}>
                        <div style={{ padding: '6px', borderRight: '2px solid #000', minHeight: '45px' }}>
                          <div style={{ fontSize: '9px', color: '#666' }}>Mode/Terms of Payment</div>
                          <div><strong>25% Advance</strong></div>
                        </div>
                        <div style={{ padding: '6px', minHeight: '45px' }}>
                          <div style={{ fontSize: '9px', color: '#666' }}>Other References</div>
                          <div>{previewPO.id}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000' }}>
                        <div style={{ padding: '6px', borderRight: '2px solid #000', minHeight: '45px' }}>
                          <div style={{ fontSize: '9px', color: '#666' }}>Reference No. & Date</div>
                          <div>{previewPO.poNumber}</div>
                        </div>
                        <div style={{ padding: '6px', minHeight: '45px' }}>
                          <div style={{ fontSize: '9px', color: '#666' }}>Destination</div>
                          <div>As per consignee</div>
                        </div>
                      </div>

                      <div style={{ padding: '6px', minHeight: '140px' }}>
                        <div style={{ fontSize: '9px', color: '#666', marginBottom: '4px' }}>Terms of Delivery</div>
                        <div style={{ fontSize: '10px' }}>
                          1. Delivery must be executed on or before <strong>{previewPO.endDate}</strong>.<br />
                          2. Send dispatch details immediately to logistics team.
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Goods Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '2px solid #000', borderBottom: '2px solid #000', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000' }}>
                        <th style={{ borderRight: '2px solid #000', padding: '4px', width: '5%', textAlign: 'center' }}>SI No.</th>
                        <th style={{ borderRight: '2px solid #000', padding: '4px', width: '50%' }}>Description of Goods</th>
                        <th style={{ borderRight: '2px solid #000', padding: '4px', width: '12%', textAlign: 'center' }}>HSN/SAC</th>
                        <th style={{ borderRight: '2px solid #000', padding: '4px', width: '11%', textAlign: 'right' }}>Quantity</th>
                        <th style={{ borderRight: '2px solid #000', padding: '4px', width: '10%', textAlign: 'right' }}>Rate</th>
                        <th style={{ borderRight: '2px solid #000', padding: '4px', width: '4%', textAlign: 'center' }}>per</th>
                        <th style={{ padding: '4px', width: '13%', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Items Rows */}
                      {items.map((item, index) => {
                        const itemProduct = products.find(p => p.id === item.productId) || {
                          name: 'Item',
                          sku: 'N/A',
                          hsn: '21069099'
                        };
                        const itemSubtotal = item.orderedQuantity * item.unitPrice;
                        return (
                          <tr key={item.id || index} style={{ verticalAlign: 'top' }}>
                            <td style={{ borderRight: '2px solid #000', padding: '6px 4px', textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ borderRight: '2px solid #000', padding: '6px 4px' }}>
                              <strong>{itemProduct.sku}</strong>
                              <div style={{ color: '#555', paddingLeft: '8px' }}>{itemProduct.name} ({item.itemType})</div>
                            </td>
                            <td style={{ borderRight: '2px solid #000', padding: '6px 4px', textAlign: 'center' }}>{itemProduct.hsn || '21069099'}</td>
                            <td style={{ borderRight: '2px solid #000', padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{item.orderedQuantity.toLocaleString('en-IN', {minimumFractionDigits: 2})} nos</td>
                            <td style={{ borderRight: '2px solid #000', padding: '6px 4px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                            <td style={{ borderRight: '2px solid #000', padding: '6px 4px', textAlign: 'center' }}>nos</td>
                            <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{itemSubtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          </tr>
                        );
                      })}

                      {/* GST Calculation Rows */}
                      {isSameState ? (
                        <>
                          <tr style={{ verticalAlign: 'top' }}>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px', fontStyle: 'italic', paddingLeft: '16px' }}>
                              Output CGST 2.5%
                            </td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px', textAlign: 'right' }}>2.5 %</td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'bold' }}>{cgstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          </tr>
                          <tr style={{ verticalAlign: 'top' }}>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px', fontStyle: 'italic', paddingLeft: '16px' }}>
                              Output SGST 2.5%
                            </td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px', textAlign: 'right' }}>2.5 %</td>
                            <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                            <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'bold' }}>{sgstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          </tr>
                        </>
                      ) : (
                        <tr style={{ verticalAlign: 'top' }}>
                          <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                          <td style={{ borderRight: '2px solid #000', padding: '2px 4px', fontStyle: 'italic', paddingLeft: '16px' }}>
                            Output IGST 5%
                          </td>
                          <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                          <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                          <td style={{ borderRight: '2px solid #000', padding: '2px 4px', textAlign: 'right' }}>5 %</td>
                          <td style={{ borderRight: '2px solid #000', padding: '2px 4px' }}></td>
                          <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 'bold' }}>{igstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                        </tr>
                      )}

                      {/* Spacer height to simulate tall Tally list */}
                      <tr style={{ height: '80px' }}>
                        <td style={{ borderRight: '2px solid #000' }}></td>
                        <td style={{ borderRight: '2px solid #000' }}></td>
                        <td style={{ borderRight: '2px solid #000' }}></td>
                        <td style={{ borderRight: '2px solid #000' }}></td>
                        <td style={{ borderRight: '2px solid #000' }}></td>
                        <td style={{ borderRight: '2px solid #000' }}></td>
                        <td></td>
                      </tr>

                      {/* Summary Row */}
                      <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                        <td style={{ borderRight: '2px solid #000', padding: '4px', textAlign: 'center' }}></td>
                        <td style={{ borderRight: '2px solid #000', padding: '4px', textAlign: 'right' }}>Total</td>
                        <td style={{ borderRight: '2px solid #000', padding: '4px' }}></td>
                        <td style={{ borderRight: '2px solid #000', padding: '4px', textAlign: 'right' }}>{totalQty.toLocaleString('en-IN', {minimumFractionDigits: 2})} nos</td>
                        <td style={{ borderRight: '2px solid #000', padding: '4px' }}></td>
                        <td style={{ borderRight: '2px solid #000', padding: '4px' }}></td>
                        <td style={{ padding: '4px', textAlign: 'right' }}>₹ {totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Words Description */}
                  <div style={{ padding: '6px', borderBottom: '2px solid #000' }}>
                    <div>Amount Chargeable (in words)</div>
                    <strong style={{ fontSize: '10px' }}>{numberToWords(totalAmount)}</strong>
                  </div>

                  {/* Footer declaration and signatory */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', width: '100%' }}>
                    <div style={{ padding: '6px', borderRight: '2px solid #000' }}>
                      <div>Company's PAN : <strong>{companyConfig.companyPAN}</strong></div>
                      <div style={{ marginTop: '6px', fontSize: '9px', textDecoration: 'underline', fontWeight: 'bold' }}>Declaration</div>
                      <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '2px' }}>{companyConfig.declaration}</div>
                    </div>
                    <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '80px', textAlign: 'right' }}>
                      <div style={{ fontSize: '9px' }}>for <strong>{companyConfig.authorisedFor}</strong></div>
                      <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Authorised Signatory</div>
                    </div>
                  </div>

                </div>

                <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '6px', color: '#666', letterSpacing: '0.5px' }}>
                  This is a Computer Generated Document
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </>
  );
}

// Helper utility to convert numbers into Indian numbering system English words
function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const g = ['', 'Thousand', 'Lakh', 'Crore'];
  
  const formatThreeDigits = (n) => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let rupeeVal = Math.floor(num);
  let words = '';
  
  if (rupeeVal === 0) {
    words = 'Zero ';
  } else {
    let parts = [];
    parts.push(rupeeVal % 1000);
    rupeeVal = Math.floor(rupeeVal / 1000);
    
    if (rupeeVal > 0) {
      parts.push(rupeeVal % 100);
      rupeeVal = Math.floor(rupeeVal / 100);
    } else {
      parts.push(0);
    }
    
    if (rupeeVal > 0) {
      parts.push(rupeeVal % 100);
      rupeeVal = Math.floor(rupeeVal / 100);
    } else {
      parts.push(0);
    }
    
    if (rupeeVal > 0) {
      parts.push(rupeeVal);
    }
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part > 0) {
        words += formatThreeDigits(part) + ' ' + (g[i] ? g[i] + ' ' : '');
      }
    }
  }
  
  return `INR ${words.trim()} Only`;
}
