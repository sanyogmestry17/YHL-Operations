import React, { useState, useEffect } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Layers, 
  DollarSign,
  Filter,
  CheckCircle2
} from 'lucide-react';

const AVAILABLE_HEADERS = {
  pos: [
    { key: 'id', label: 'PO ID' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'batchId', label: 'Batch ID' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'itemType', label: 'Item Type' },
    { key: 'orderedQuantity', label: 'Ordered Qty' },
    { key: 'balanceQuantity', label: 'Balance Qty' },
    { key: 'unitPrice', label: 'Unit Price' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'status', label: 'Status' }
  ],
  invoices: [
    { key: 'id', label: 'Invoice ID' },
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'poId', label: 'PO ID' },
    { key: 'batchId', label: 'Batch ID' },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'quantityDelivered', label: 'Qty Delivered' },
    { key: 'unitPrice', label: 'Unit Price' },
    { key: 'invoiceAmount', label: 'Total Amount' },
    { key: 'notes', label: 'Notes' }
  ],
  batches: [
    { key: 'id', label: 'Batch ID' },
    { key: 'name', label: 'Batch Name' },
    { key: 'productId', label: 'Product ID' },
    { key: 'targetQuantity', label: 'Target Qty' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'status', label: 'Status' }
  ],
  inventory: [
    { key: 'item', label: 'Item Name' },
    { key: 'qty', label: 'Current Stock Level' }
  ],
  consolidated: [
    { key: 'poId', label: 'PO ID' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'batchId', label: 'Batch ID' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'itemType', label: 'Item Type' },
    { key: 'poOrderedQty', label: 'PO Ordered Qty' },
    { key: 'poBalanceQty', label: 'PO Balance Qty' },
    { key: 'poUnitPrice', label: 'PO Unit Price' },
    { key: 'poTotalAmount', label: 'PO Total Amount' },
    { key: 'poStartDate', label: 'PO Start Date' },
    { key: 'poEndDate', label: 'PO End Date' },
    { key: 'poStatus', label: 'PO Status' },
    { key: 'invoiceId', label: 'Invoice ID' },
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'invoiceDate', label: 'Invoice Date' },
    { key: 'invoiceQtyDelivered', label: 'Invoice Qty Delivered' },
    { key: 'invoiceAmount', label: 'Invoice Amount' },
    { key: 'invoiceNotes', label: 'Invoice Notes' }
  ]
};

export default function ExportView() {
  const { purchaseOrders, invoices, batches, inventory, getLocalDateStr } = usePortal();

  // Export Settings State
  const [reportType, setReportType] = useState('pos'); // pos / invoices / batches / inventory / consolidated
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [selectedHeaders, setSelectedHeaders] = useState([]);

  // Sync selected headers when reportType changes
  useEffect(() => {
    if (AVAILABLE_HEADERS[reportType]) {
      setSelectedHeaders(AVAILABLE_HEADERS[reportType].map(h => h.key));
    }
  }, [reportType]);

  // Date Filter helper
  const isWithinDateRange = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate && date > new Date(endDate)) return false;
    return true;
  };

  // Value filter helper
  const isWithinValueRange = (val) => {
    const num = Number(val);
    if (minVal && num < Number(minVal)) return false;
    if (maxVal && num > Number(maxVal)) return false;
    return true;
  };

  // Pre-configured ranges
  const applyPresetRange = (rangeType) => {
    const today = new Date();
    const end = getLocalDateStr();
    let start = '';

    if (rangeType === 'today') {
      start = end;
    } else if (rangeType === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (rangeType === 'month') {
      start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (rangeType === 'all') {
      start = '';
      setEndDate('');
      setStartDate('');
      return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // Calculate filtered records for export preview
  const getFilteredData = () => {
    if (reportType === 'pos') {
      return purchaseOrders.filter(po => {
        const matchesDate = !startDate && !endDate ? true : isWithinDateRange(po.startDate);
        const matchesVal = isWithinValueRange(po.totalAmount);
        return matchesDate && matchesVal;
      });
    } else if (reportType === 'invoices') {
      return invoices.filter(inv => {
        const matchesDate = !startDate && !endDate ? true : isWithinDateRange(inv.invoiceDate);
        const matchesVal = isWithinValueRange(inv.invoiceAmount);
        return matchesDate && matchesVal;
      });
    } else if (reportType === 'batches') {
      return batches.filter(b => {
        const matchesDate = !startDate && !endDate ? true : isWithinDateRange(b.startDate);
        return matchesDate;
      });
    } else if (reportType === 'inventory') {
      return Object.entries(inventory).map(([item, qty]) => ({ item, qty }));
    } else if (reportType === 'consolidated') {
      const records = [];
      purchaseOrders.forEach(po => {
        const poInvoices = invoices.filter(inv => inv.poId === po.id);
        // We filter consolidated records by PO date and PO total budget values
        const matchesDate = !startDate && !endDate ? true : isWithinDateRange(po.startDate);
        const matchesVal = isWithinValueRange(po.totalAmount);
        
        if (matchesDate && matchesVal) {
          if (poInvoices.length === 0) {
            records.push({
              poId: po.id,
              poNumber: po.poNumber,
              batchId: po.batchId,
              vendor: po.vendor,
              itemType: po.itemType,
              poOrderedQty: po.orderedQuantity,
              poBalanceQty: po.balanceQuantity,
              poUnitPrice: po.unitPrice,
              poTotalAmount: po.totalAmount,
              poStartDate: po.startDate,
              poEndDate: po.endDate,
              poStatus: po.status,
              invoiceId: '',
              invoiceNumber: 'N/A (No Invoice)',
              invoiceDate: '',
              invoiceQtyDelivered: 0,
              invoiceAmount: 0,
              invoiceNotes: ''
            });
          } else {
            poInvoices.forEach(inv => {
              records.push({
                poId: po.id,
                poNumber: po.poNumber,
                batchId: po.batchId,
                vendor: po.vendor,
                itemType: po.itemType,
                poOrderedQty: po.orderedQuantity,
                poBalanceQty: po.balanceQuantity,
                poUnitPrice: po.unitPrice,
                poTotalAmount: po.totalAmount,
                poStartDate: po.startDate,
                poEndDate: po.endDate,
                poStatus: po.status,
                invoiceId: inv.id,
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                invoiceQtyDelivered: inv.quantityDelivered,
                invoiceAmount: inv.invoiceAmount,
                invoiceNotes: inv.notes || ''
              });
            });
          }
        }
      });
      return records;
    }
    return [];
  };

  const previewRecords = getFilteredData();

  // Export to CSV Function
  const exportToCSV = () => {
    if (startDate && endDate && endDate < startDate) {
      alert("End Date cannot be earlier than the Start Date!");
      return;
    }
    if (selectedHeaders.length === 0) {
      alert("Please select at least one header column to export!");
      return;
    }

    const activeHeaders = AVAILABLE_HEADERS[reportType].filter(h => selectedHeaders.includes(h.key));
    const headersRow = activeHeaders.map(h => h.label);

    const rows = previewRecords.map(record => {
      return activeHeaders.map(h => {
        const val = record[h.key];
        if (val === undefined || val === null) return '';
        const valStr = String(val);
        if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
          return `"${valStr.replace(/"/g, '""')}"`;
        }
        return valStr;
      });
    });

    const filename = `YHL_${reportType}_Report_${getLocalDateStr()}.csv`;

    const csvContent = [
      headersRow.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Create File Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports Export Suite</h1>
          <p className="page-subtitle">Compile custom operational reports and download them to Excel-compatible spreadsheets</p>
        </div>
      </div>

      <div className="grid-cols-3" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Side: Filter Form Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={18} color="var(--color-cyan)" /> Report Filters
          </h3>

          {/* Report Type */}
          <div className="form-group">
            <label className="glass-label">Report Domain</label>
            <select 
              className="glass-input" 
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setMinVal(''); setMaxVal(''); }}
            >
              <option value="pos">Purchase Orders (POs)</option>
              <option value="invoices">Invoices Registry</option>
              <option value="consolidated">PO & Invoices (Consolidated)</option>
              <option value="batches">Production Batches</option>
              <option value="inventory">Inventory Summary</option>
            </select>
          </div>

          {reportType !== 'inventory' && (
            <>
              {/* Date Filters */}
              <div className="form-group">
                <label className="glass-label">Date Preset Range</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button type="button" className="glass-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => applyPresetRange('today')}>Today</button>
                  <button type="button" className="glass-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => applyPresetRange('7days')}>7 Days</button>
                  <button type="button" className="glass-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => applyPresetRange('month')}>This Month</button>
                  <button type="button" className="glass-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => applyPresetRange('all')}>Clear Range</button>
                </div>
              </div>

               <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">Start Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    max={endDate || undefined}
                  />
                </div>
                <div className="form-group">
                  <label className="glass-label">End Date</label>
                  <input 
                    type="date" 
                    className="glass-input" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={startDate || undefined}
                  />
                </div>
              </div>

              {/* Value Ranges */}
              {(reportType === 'pos' || reportType === 'invoices' || reportType === 'consolidated') && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="glass-label">Min Amount (₹)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      placeholder="0"
                      value={minVal} 
                      onChange={(e) => setMinVal(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="glass-label">Max Amount (₹)</label>
                    <input 
                      type="number" 
                      className="glass-input" 
                      placeholder="No limit"
                      value={maxVal} 
                      onChange={(e) => setMaxVal(e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Header Selector */}
          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <label className="glass-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
              <span>Select Export Columns</span>
              <button 
                type="button" 
                className="glass-btn" 
                style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem', height: '22px' }}
                onClick={() => {
                  const allKeys = AVAILABLE_HEADERS[reportType].map(h => h.key);
                  if (selectedHeaders.length === allKeys.length) {
                    setSelectedHeaders([]);
                  } else {
                    setSelectedHeaders(allKeys);
                  }
                }}
              >
                {selectedHeaders.length === (AVAILABLE_HEADERS[reportType] || []).length ? 'Select None' : 'Select All'}
              </button>
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '0.4rem', 
              maxHeight: '180px', 
              overflowY: 'auto', 
              background: 'var(--bg-input)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '0.5rem',
              marginTop: '0.5rem'
            }}>
              {(AVAILABLE_HEADERS[reportType] || []).map(header => (
                <label 
                  key={header.key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.75rem', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    margin: 0
                  }}
                >
                  <input 
                    type="checkbox" 
                    style={{ width: 'auto' }}
                    checked={selectedHeaders.includes(header.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedHeaders(prev => [...prev, header.key]);
                      } else {
                        setSelectedHeaders(prev => prev.filter(k => k !== header.key));
                      }
                    }}
                  />
                  <span>{header.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            type="button" 
            className="glass-btn-primary" 
            style={{ marginTop: '0.5rem', justifyContent: 'center' }}
            onClick={exportToCSV}
            disabled={previewRecords.length === 0 || selectedHeaders.length === 0}
          >
            <Download size={16} /> Download Report (Excel/CSV)
          </button>
        </div>

        {/* Right Side: Data Preview Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileSpreadsheet size={18} color="var(--color-cyan)" /> Live Export Preview
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Matching Records: <strong style={{ color: 'var(--color-cyan)' }}>{previewRecords.length}</strong>
            </span>
          </div>

          <div className="glass-table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  {(AVAILABLE_HEADERS[reportType] || [])
                    .filter(h => selectedHeaders.includes(h.key))
                    .map(h => (
                      <th key={h.key}>{h.label}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {previewRecords.length === 0 ? (
                  <tr>
                    <td colSpan={selectedHeaders.length || 1} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No records matched the current filters. Modify filters to preview data.
                    </td>
                  </tr>
                ) : (
                  previewRecords.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {(AVAILABLE_HEADERS[reportType] || [])
                        .filter(h => selectedHeaders.includes(h.key))
                        .map(h => {
                          const val = row[h.key];
                          if (['totalAmount', 'invoiceAmount', 'poTotalAmount', 'poUnitPrice', 'unitPrice'].includes(h.key)) {
                            return <td key={h.key} style={{ fontWeight: 500 }}>₹{Number(val || 0).toLocaleString('en-IN')}</td>;
                          }
                          if (['status', 'poStatus'].includes(h.key)) {
                            return (
                              <td key={h.key}>
                                <span className={`badge ${['Fully Served', 'Completed', 'Ready', 'Sent'].includes(val) ? 'badge-served' : 'badge-draft'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                  {val}
                                </span>
                              </td>
                            );
                          }
                          return <td key={h.key}>{String(val !== undefined && val !== null ? val : '')}</td>;
                        })}
                    </tr>
                  ))
                )}
                {previewRecords.length > 10 && (
                  <tr>
                    <td colSpan={selectedHeaders.length || 1} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dark)', padding: '0.75rem' }}>
                      And {previewRecords.length - 10} more rows (Download report to view full records)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
