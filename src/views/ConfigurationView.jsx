import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  Settings, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Save, 
  Layers, 
  X,
  Zap
} from 'lucide-react';

const ITEM_TYPE_OPTIONS = ['Jar & Lid', 'Canister', 'Bottle & Pump', 'Finished Goods', 'Custom Component'];
const VENDOR_OPTIONS = ['Indian Harness', 'KPL', 'Bliss Wellness', '3S', 'Custom Vendor'];

export default function ConfigurationView() {
  const { 
    products, 
    batches, 
    purchaseOrders, 
    invoices, 
    inventory, 
    carryForwards, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    companyConfig, 
    setCompanyConfig, 
    vendorsConfig, 
    setVendorsConfig,
    clearDatabase, 
    importDatabase,
    hasSupabase,
    safetyThresholds,
    setSafetyThresholds,
    easyEcomConfig,
    setEasyEcomConfig
  } = usePortal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);

  const [tempThresholds, setTempThresholds] = useState({});

  // Sync safetyThresholds from context to local temp state
  React.useEffect(() => {
    if (safetyThresholds) {
      setTempThresholds(safetyThresholds);
    }
  }, [safetyThresholds]);

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    setSafetyThresholds(tempThresholds);
    alert('Inventory safety thresholds updated successfully!');
  };

  // EasyEcom Integration Form State
  const [easyEcomEnabled, setEasyEcomEnabled] = useState(false);
  const [easyEcomXApiKey, setEasyEcomXApiKey] = useState('');
  const [easyEcomJwtToken, setEasyEcomJwtToken] = useState('');
  const [easyEcomProxyUrl, setEasyEcomProxyUrl] = useState('');

  React.useEffect(() => {
    if (easyEcomConfig) {
      setEasyEcomEnabled(easyEcomConfig.isEnabled || false);
      setEasyEcomXApiKey(easyEcomConfig.xApiKey || '');
      setEasyEcomJwtToken(easyEcomConfig.jwtToken || '');
      setEasyEcomProxyUrl(easyEcomConfig.proxyUrl || 'https://cors-anywhere.herokuapp.com/');
    }
  }, [easyEcomConfig]);

  const handleSaveEasyEcomConfig = (e) => {
    e.preventDefault();
    setEasyEcomConfig({
      isEnabled: easyEcomEnabled,
      xApiKey: easyEcomXApiKey,
      jwtToken: easyEcomJwtToken,
      proxyUrl: easyEcomProxyUrl
    });
    alert('EasyEcom integration configuration saved successfully!');
  };

  // EasyEcom JWT Fetcher Helper State
  const [helperEmail, setHelperEmail] = useState('');
  const [helperPassword, setHelperPassword] = useState('');
  const [helperLocationKey, setHelperLocationKey] = useState('');
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [showHelperPanel, setShowHelperPanel] = useState(false);

  const handleFetchJWTToken = async (e) => {
    e.preventDefault();
    if (!easyEcomXApiKey) {
      alert("Please fill in your EasyEcom X-API-KEY first before generating a JWT Token.");
      return;
    }
    if (!helperEmail || !helperPassword || !helperLocationKey) {
      alert("Please enter your EasyEcom login email, password, and location key.");
      return;
    }

    setIsFetchingToken(true);
    try {
      const targetUrl = 'https://api.easyecom.io/access/token';
      const requestUrl = easyEcomProxyUrl 
        ? `${easyEcomProxyUrl.endsWith('/') ? easyEcomProxyUrl : easyEcomProxyUrl + '/'}${targetUrl}`
        : targetUrl;

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'x-api-key': easyEcomXApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: helperEmail,
          password: helperPassword,
          location_key: helperLocationKey
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Authentication error: ${response.status} - ${errText || response.statusText}`);
      }

      const resJson = await response.json();
      
      if (resJson.message && !resJson.data) {
        throw new Error(resJson.message);
      }
      
      const tokenObj = resJson.data?.token || {};
      const jwtTokenValue = tokenObj.jwt_token || tokenObj.token || '';
      
      if (!jwtTokenValue) {
        throw new Error("No token returned in EasyEcom response. Check credentials.");
      }

      setEasyEcomJwtToken(jwtTokenValue);
      alert("JWT Token fetched and loaded successfully!");
      setShowHelperPanel(false);
      setHelperPassword('');
    } catch (err) {
      console.error(err);
      alert(`Failed to fetch JWT token: ${err.message || "Unknown error"}`);
    } finally {
      setIsFetchingToken(false);
    }
  };

  // Company Config local state
  const [compInvoiceName, setCompInvoiceName] = useState(companyConfig?.invoiceToName || '');
  const [compInvoiceAddress, setCompInvoiceAddress] = useState(companyConfig?.invoiceToAddress || '');
  const [compInvoiceGST, setCompInvoiceGST] = useState(companyConfig?.invoiceToGSTIN || '');
  const [compInvoiceState, setCompInvoiceState] = useState(companyConfig?.invoiceToStateName || '');
  const [compInvoiceCode, setCompInvoiceCode] = useState(companyConfig?.invoiceToStateCode || '');
  const [compInvoiceCIN, setCompInvoiceCIN] = useState(companyConfig?.invoiceToCIN || '');
  const [compInvoiceEmail, setCompInvoiceEmail] = useState(companyConfig?.invoiceToEmail || '');

  const [compShipName, setCompShipName] = useState(companyConfig?.shipToName || '');
  const [compShipAddress, setCompShipAddress] = useState(companyConfig?.shipToAddress || '');
  const [compShipEmail, setCompShipEmail] = useState(companyConfig?.shipToEmail || '');
  const [compShipGST, setCompShipGST] = useState(companyConfig?.shipToGSTIN || '');
  const [compShipState, setCompShipState] = useState(companyConfig?.shipToStateName || '');
  const [compShipCode, setCompShipCode] = useState(companyConfig?.shipToStateCode || '');

  const [compPAN, setCompPAN] = useState(companyConfig?.companyPAN || '');
  const [compAuthSign, setCompAuthSign] = useState(companyConfig?.authorisedFor || '');
  const [compDecl, setCompDecl] = useState(companyConfig?.declaration || '');

  // Vendor registry local state
  const [selectedVendorKey, setSelectedVendorKey] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorGST, setVendorGST] = useState('');
  const [vendorState, setVendorState] = useState('');
  const [vendorCode, setVendorCode] = useState('');

  // Sync company config to local state
  React.useEffect(() => {
    if (companyConfig) {
      setCompInvoiceName(companyConfig.invoiceToName || '');
      setCompInvoiceAddress(companyConfig.invoiceToAddress || '');
      setCompInvoiceGST(companyConfig.invoiceToGSTIN || '');
      setCompInvoiceState(companyConfig.invoiceToStateName || '');
      setCompInvoiceCode(companyConfig.invoiceToStateCode || '');
      setCompInvoiceCIN(companyConfig.invoiceToCIN || '');
      setCompInvoiceEmail(companyConfig.invoiceToEmail || '');
      setCompShipName(companyConfig.shipToName || '');
      setCompShipAddress(companyConfig.shipToAddress || '');
      setCompShipEmail(companyConfig.shipToEmail || '');
      setCompShipGST(companyConfig.shipToGSTIN || '');
      setCompShipState(companyConfig.shipToStateName || '');
      setCompShipCode(companyConfig.shipToStateCode || '');
      setCompPAN(companyConfig.companyPAN || '');
      setCompAuthSign(companyConfig.authorisedFor || '');
      setCompDecl(companyConfig.declaration || '');
    }
  }, [companyConfig]);

  const handleSaveCompanyConfig = (e) => {
    e.preventDefault();
    setCompanyConfig({
      invoiceToName: compInvoiceName,
      invoiceToAddress: compInvoiceAddress,
      invoiceToGSTIN: compInvoiceGST,
      invoiceToStateName: compInvoiceState,
      invoiceToStateCode: compInvoiceCode,
      invoiceToCIN: compInvoiceCIN,
      invoiceToEmail: compInvoiceEmail,
      shipToName: compShipName,
      shipToAddress: compShipAddress,
      shipToEmail: compShipEmail,
      shipToGSTIN: compShipGST,
      shipToStateName: compShipState,
      shipToStateCode: compShipCode,
      companyPAN: compPAN,
      authorisedFor: compAuthSign,
      declaration: compDecl
    });
    alert('Company profile configuration saved successfully!');
  };

  const handleSaveVendor = (e) => {
    e.preventDefault();
    if (!vendorName) return;

    const updatedVendors = { ...vendorsConfig };
    updatedVendors[vendorName] = {
      name: vendorName,
      address: vendorAddress,
      gstin: vendorGST,
      stateName: vendorState,
      stateCode: vendorCode
    };

    if (selectedVendorKey && selectedVendorKey !== vendorName) {
      delete updatedVendors[selectedVendorKey];
    }

    setVendorsConfig(updatedVendors);
    alert('Supplier registry details saved!');
    resetVendorForm();
  };

  const resetVendorForm = () => {
    setSelectedVendorKey(null);
    setVendorName('');
    setVendorAddress('');
    setVendorGST('');
    setVendorState('');
    setVendorCode('');
  };

  const startEditVendor = (key, v) => {
    setSelectedVendorKey(key);
    setVendorName(v.name || key);
    setVendorAddress(v.address || '');
    setVendorGST(v.gstin || '');
    setVendorState(v.stateName || '');
    setVendorCode(v.stateCode || '');
  };

  const handleDeleteVendor = (vendorKey) => {
    if (window.confirm(`Are you sure you want to delete supplier "${vendorKey}"?`)) {
      const updatedVendors = { ...vendorsConfig };
      delete updatedVendors[vendorKey];
      setVendorsConfig(updatedVendors);
      if (selectedVendorKey === vendorKey) {
        resetVendorForm();
      }
    }
  };

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Capsule');
  const [prodSku, setProdSku] = useState('');
  const [prodHsn, setProdHsn] = useState('');
  const [lifecycleSteps, setLifecycleSteps] = useState([]);

  // Lifecycle Step Input State
  const [stepItemType, setStepItemType] = useState('');
  const [stepVendor, setStepVendor] = useState('');
  const [stepUnitPrice, setStepUnitPrice] = useState('');

  // Step Inline Editing State
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [editItemType, setEditItemType] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');

  const startEditingStep = (index, step) => {
    setEditingStepIndex(index);
    setEditItemType(step.itemType);
    setEditVendor(step.vendor);
    setEditUnitPrice(step.defaultUnitPrice);
  };

  const saveEditedStep = (index) => {
    if (!editItemType || !editVendor || editUnitPrice === '') return;
    if (Number(editUnitPrice) <= 0) {
      alert("Default Price must be greater than 0!");
      return;
    }
    
    setLifecycleSteps((prev) => 
      prev.map((step, idx) => 
        idx === index 
          ? { ...step, itemType: editItemType, vendor: editVendor, defaultUnitPrice: Number(editUnitPrice) }
          : step
      )
    );
    setEditingStepIndex(null);
  };

  // Templates
  const applyTemplate = (type) => {
    if (type === 'Capsule') {
      setLifecycleSteps([
        { itemType: 'Jar & Lid', vendor: 'Indian Harness', defaultUnitPrice: 100.00 },
        { itemType: 'Canister', vendor: 'KPL', defaultUnitPrice: 140.00 },
        { itemType: 'Finished Goods', vendor: 'Bliss Wellness', defaultUnitPrice: 360.00 }
      ]);
    } else if (type === 'Collagen') {
      setLifecycleSteps([
        { itemType: 'Canister', vendor: 'KPL', defaultUnitPrice: 160.00 },
        { itemType: 'Finished Goods', vendor: '3S', defaultUnitPrice: 540.00 }
      ]);
    } else if (type === 'Lotion') {
      setLifecycleSteps([
        { itemType: 'Bottle & Pump', vendor: 'Indian Harness', defaultUnitPrice: 120.00 },
        { itemType: 'Finished Goods', vendor: 'Bliss Wellness', defaultUnitPrice: 340.00 }
      ]);
    }
  };

  // Lifecycle Step Actions
  const addLifecycleStep = () => {
    if (!stepItemType || !stepVendor || !stepUnitPrice) return;

    if (Number(stepUnitPrice) <= 0) {
      alert("Default Price must be greater than 0!");
      return;
    }

    setLifecycleSteps((prev) => [
      ...prev,
      {
        itemType: stepItemType,
        vendor: stepVendor,
        defaultUnitPrice: Number(stepUnitPrice)
      }
    ]);

    // Reset step inputs
    setStepItemType('');
    setStepVendor('');
    setStepUnitPrice('');
  };

  const removeLifecycleStep = (index) => {
    setLifecycleSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveStep = (index, direction) => {
    const newSteps = [...lifecycleSteps];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;

    // Swap
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;
    setLifecycleSteps(newSteps);
  };

  // Submit Product Form
  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!prodName || lifecycleSteps.length === 0) return;

    const productPayload = {
      name: prodName,
      sku: prodSku,
      hsn: prodHsn,
      category: prodCategory,
      lifecycle: lifecycleSteps.map((step, idx) => ({
        ...step,
        id: step.id || `step-${Date.now()}-${idx}`
      }))
    };

    if (editingProduct) {
      updateProduct({
        ...productPayload,
        id: editingProduct.id
      });
    } else {
      addProduct(productPayload);
    }

    closeAndReset();
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdSku(product.sku || '');
    setProdHsn(product.hsn || '');
    setLifecycleSteps([...product.lifecycle]);
    setEditingStepIndex(null);
    setIsModalOpen(true);
  };

  const closeAndReset = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Capsule');
    setProdSku('');
    setProdHsn('');
    setLifecycleSteps([]);
    setStepItemType('');
    setStepVendor('');
    setStepUnitPrice('');
    setEditingStepIndex(null);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (product) => {
    const associatedBatches = batches.filter(b => b.productId === product.id);
    const activeBatches = associatedBatches.filter(b => b.status !== 'Completed');

    if (activeBatches.length > 0) {
      alert(`Cannot delete product "${product.name}" because it has ${activeBatches.length} active (draft/in-production) batch(es) referencing it. Please delete those batches first.`);
      return;
    }

    let msg = `Are you sure you want to delete product "${product.name}"?`;
    if (associatedBatches.length > 0) {
      msg = `WARNING: Product "${product.name}" is referenced by ${associatedBatches.length} completed batch(es). Deleting it will leave those batches referencing an unknown product, though history is preserved. Are you sure you want to proceed?`;
    }

    if (window.confirm(msg)) {
      deleteProduct(product.id);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuration & Profile Registry</h1>
          <p className="page-subtitle">Configure products, company shipping/billing profiles, and register supplier details</p>
        </div>
        {activeTab === 'products' && (
          <button className="glass-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button 
          className="glass-btn" 
          style={{ 
            background: activeTab === 'products' ? 'var(--grad-primary)' : 'transparent', 
            color: activeTab === 'products' ? '#fff' : 'var(--text-muted)',
            borderColor: activeTab === 'products' ? 'var(--color-cyan)' : 'transparent',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveTab('products')}
        >
          Product Catalog
        </button>
        <button 
          className="glass-btn" 
          style={{ 
            background: activeTab === 'company' ? 'var(--grad-primary)' : 'transparent', 
            color: activeTab === 'company' ? '#fff' : 'var(--text-muted)',
            borderColor: activeTab === 'company' ? 'var(--color-cyan)' : 'transparent',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveTab('company')}
        >
          Company Profile (GST & PAN)
        </button>
        <button 
          className="glass-btn" 
          style={{ 
            background: activeTab === 'suppliers' ? 'var(--grad-primary)' : 'transparent', 
            color: activeTab === 'suppliers' ? '#fff' : 'var(--text-muted)',
            borderColor: activeTab === 'suppliers' ? 'var(--color-cyan)' : 'transparent',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveTab('suppliers')}
        >
          Supplier Registry
        </button>
        <button 
          className="glass-btn" 
          style={{ 
            background: activeTab === 'thresholds' ? 'var(--grad-primary)' : 'transparent', 
            color: activeTab === 'thresholds' ? '#fff' : 'var(--text-muted)',
            borderColor: activeTab === 'thresholds' ? 'var(--color-cyan)' : 'transparent',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveTab('thresholds')}
        >
          Safety Thresholds
        </button>
        <button 
          className="glass-btn" 
          style={{ 
            background: activeTab === 'easyecom' ? 'var(--grad-primary)' : 'transparent', 
            color: activeTab === 'easyecom' ? '#fff' : 'var(--text-muted)',
            borderColor: activeTab === 'easyecom' ? 'var(--color-cyan)' : 'transparent',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveTab('easyecom')}
        >
          EasyEcom Sync
        </button>
      </div>

      {/* Product Catalog Tab */}
      {activeTab === 'products' && (
        <>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>Active Product Catalog</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {products.map(prod => (
                <div key={prod.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                        {prod.category} ID: {prod.id} {prod.sku && `| SKU: ${prod.sku}`} {prod.hsn && `| HSN: ${prod.hsn}`}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '2px' }}>{prod.name}</h4>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="glass-btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => startEditProduct(prod)}>
                        <Edit size={14} /> Edit Flow
                      </button>
                      <button className="glass-btn" style={{ padding: '0.4rem 0.5rem', color: 'var(--text-dark)' }} onClick={() => handleDeleteProduct(prod)} title="Delete Product">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Display Lifecycle steps */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px' }}>
                    {prod.lifecycle.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', padding: '0.25rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{step.itemType}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{step.vendor} (₹{step.defaultUnitPrice}/u)</span>
                        </div>
                        {idx < prod.lifecycle.length - 1 && (
                          <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Management & Backups Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', borderLeft: '4px solid var(--color-rose)' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {hasSupabase ? "Production Database Actions" : "Local Workspace Actions"}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {hasSupabase 
                ? "Export live production database tables to JSON, upload backups to restore tables, or reset production tables."
                : "Export local workspace cache to JSON, upload backups to restore settings, or clear mock logs to reset data."}
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="glass-btn" 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                    products,
                    batches,
                    purchaseOrders,
                    invoices,
                    inventory,
                    carryForwards
                  }));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `YHL_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
              >
                📥 Download Backup (JSON)
              </button>

              <button 
                type="button" 
                className="glass-btn" 
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = '.json';
                  fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const data = JSON.parse(event.target.result);
                        if (importDatabase(data)) {
                          alert('Database restored successfully!');
                        } else {
                          alert('Failed to restore. Invalid backup structure.');
                        }
                      } catch (err) {
                        alert('Error parsing backup file.');
                      }
                    };
                    reader.readAsText(file);
                  };
                  fileInput.click();
                }}
              >
                📤 Upload & Restore Backup
              </button>

              <button 
                type="button" 
                className="glass-btn-danger" 
                style={{ marginLeft: 'auto' }}
                onClick={() => {
                  if (window.confirm(hasSupabase 
                    ? 'WARNING: Are you sure you want to clean slate the live database? This will clear all Batches, POs, Invoices, and reset stock levels to 0 in Supabase. This cannot be undone.'
                    : 'WARNING: Are you sure you want to clear the entire database? This will clear all Batches, POs, Invoices, and reset stock levels to 0. This cannot be undone.')) {
                    clearDatabase();
                    alert(hasSupabase ? 'Production database cleared!' : 'Database cleared! Start with a clean slate.');
                  }
                }}
              >
                {hasSupabase ? "⚠️ Reset Production Database (Clean Slate)" : "⚠️ Reset Local Database (Clear Mock Data)"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Company Config Tab */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompanyConfig} className="glass-panel" style={{ padding: '1.75rem', animation: 'scale-up 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Company Profile & GST Configuration</h3>
            <button type="submit" className="glass-btn-primary">Save Profile Settings</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
            {/* Invoice To (Billing Details) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-cyan)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                Invoice To (Billing Details)
              </h4>
              <div className="form-group">
                <label className="glass-label">Company Name</label>
                <input type="text" className="glass-input" value={compInvoiceName} onChange={e => setCompInvoiceName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="glass-label">Billing Address</label>
                <textarea className="glass-input" rows={3} value={compInvoiceAddress} onChange={e => setCompInvoiceAddress(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">GSTIN / UIN</label>
                  <input type="text" className="glass-input" value={compInvoiceGST} onChange={e => setCompInvoiceGST(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="glass-label">CIN</label>
                  <input type="text" className="glass-input" value={compInvoiceCIN} onChange={e => setCompInvoiceCIN(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">State Name</label>
                  <input type="text" className="glass-input" value={compInvoiceState} onChange={e => setCompInvoiceState(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="glass-label">State Code</label>
                  <input type="text" className="glass-input" value={compInvoiceCode} onChange={e => setCompInvoiceCode(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="glass-label">Billing Email</label>
                <input type="email" className="glass-input" value={compInvoiceEmail} onChange={e => setCompInvoiceEmail(e.target.value)} required />
              </div>
            </div>

            {/* Consignee (Shipping Details) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-cyan)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                Consignee (Ship to Details)
              </h4>
              <div className="form-group">
                <label className="glass-label">Consignee Name</label>
                <input type="text" className="glass-input" value={compShipName} onChange={e => setCompShipName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="glass-label">Shipping Address</label>
                <textarea className="glass-input" rows={3} value={compShipAddress} onChange={e => setCompShipAddress(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">GSTIN / UIN</label>
                  <input type="text" className="glass-input" value={compShipGST} onChange={e => setCompShipGST(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="glass-label">Company PAN</label>
                  <input type="text" className="glass-input" value={compPAN} onChange={e => setCompPAN(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">State Name</label>
                  <input type="text" className="glass-input" value={compShipState} onChange={e => setCompShipState(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="glass-label">State Code</label>
                  <input type="text" className="glass-input" value={compShipCode} onChange={e => setCompShipCode(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="glass-label">Shipping Email</label>
                <input type="email" className="glass-input" value={compShipEmail} onChange={e => setCompShipEmail(e.target.value)} required />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="glass-label">Authorized Signatory (for Company)</label>
              <input type="text" className="glass-input" value={compAuthSign} onChange={e => setCompAuthSign(e.target.value)} placeholder="e.g. Happylab Solutions Private Limited" required />
            </div>
            <div className="form-group">
              <label className="glass-label">Purchase Order Declaration Text</label>
              <input type="text" className="glass-input" value={compDecl} onChange={e => setCompDecl(e.target.value)} required />
            </div>
          </div>
        </form>
      )}

      {/* Supplier Registry Tab */}
      {activeTab === 'suppliers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', animation: 'scale-up 0.2s ease-out' }}>
          {/* Supplier List */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Supplier Registry ({Object.keys(vendorsConfig).length})</span>
              <button className="glass-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }} onClick={resetVendorForm}>+ Add New</button>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
              {Object.keys(vendorsConfig).map(key => {
                const v = vendorsConfig[key];
                return (
                  <div key={key} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: selectedVendorKey === key ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-card)', borderColor: selectedVendorKey === key ? 'var(--color-cyan)' : 'var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{v.name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.address}</span>
                      <span style={{ fontSize: '0.75rem' }}>
                        GSTIN: <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{v.gstin}</span> | State: {v.stateName} ({v.stateCode})
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="glass-btn" style={{ padding: '0.35rem 0.5rem' }} onClick={() => startEditVendor(key, v)} title="Edit Supplier">
                        <Edit size={12} />
                      </button>
                      <button className="glass-btn" style={{ padding: '0.35rem 0.5rem', color: 'var(--text-dark)' }} onClick={() => handleDeleteVendor(key)} title="Delete Supplier">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supplier Form */}
          <form onSubmit={handleSaveVendor} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {selectedVendorKey ? `Edit Supplier: ${selectedVendorKey}` : 'Register New Supplier'}
            </h3>

            <div className="form-group">
              <label className="glass-label">Supplier / Vendor Name</label>
              <input type="text" className="glass-input" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. Bliss Life Sciences" required />
            </div>

            <div className="form-group">
              <label className="glass-label">Billing Address</label>
              <textarea className="glass-input" rows={4} value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} placeholder="Full corporate office / factory address..." required />
            </div>

            <div className="form-group">
              <label className="glass-label">GSTIN / UIN</label>
              <input type="text" className="glass-input" value={vendorGST} onChange={e => setVendorGST(e.target.value)} placeholder="e.g. 23AAPFB8482L1ZV" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="glass-label">State Name</label>
                <input type="text" className="glass-input" value={vendorState} onChange={e => setVendorState(e.target.value)} placeholder="e.g. Madhya Pradesh" required />
              </div>
              <div className="form-group">
                <label className="glass-label">State Code</label>
                <input type="text" className="glass-input" value={vendorCode} onChange={e => setVendorCode(e.target.value)} placeholder="e.g. 23" required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              {selectedVendorKey && (
                <button type="button" className="glass-btn" onClick={resetVendorForm}>Cancel</button>
              )}
              <button type="submit" className="glass-btn-primary">
                {selectedVendorKey ? 'Save Supplier' : 'Register Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Safety Thresholds Tab */}
      {activeTab === 'thresholds' && (
        <div className="glass-panel" style={{ padding: '1.5rem', animation: 'scale-up 0.2s ease-out' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Inventory Safety Thresholds</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Set safety stock thresholds for raw materials and finished products. The system will flag warnings when inventory falls below these values.
          </p>

          <form onSubmit={handleSaveThresholds} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Item Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, width: '200px' }}>Safety Threshold (Units)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(safetyThresholds).map((item) => {
                    const isRaw = ['Jar & Lid', 'Canister', 'Bottle & Pump'].includes(item);
                    return (
                      <tr key={item} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>{item}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                          {isRaw ? 'Packaging & Raw Material' : 'Finished Product'}
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <input 
                            type="number"
                            className="glass-input"
                            style={{ padding: '0.35rem 0.5rem', height: '32px', fontSize: '0.85rem' }}
                            value={tempThresholds[item] !== undefined ? tempThresholds[item] : safetyThresholds[item]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setTempThresholds(prev => ({ ...prev, [item]: val }));
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="glass-btn-primary">
                <Save size={16} /> Save Thresholds
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EasyEcom Sync Tab */}
      {activeTab === 'easyecom' && (
        <form onSubmit={handleSaveEasyEcomConfig} className="glass-panel" style={{ padding: '1.75rem', animation: 'scale-up 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>EasyEcom API Integration</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Synchronize finished goods inventory levels from your EasyEcom dashboard. Subpart items (jars/lids) are managed locally.
              </p>
            </div>
            <button type="submit" className="glass-btn-primary">Save EasyEcom Settings</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <input 
                  type="checkbox" 
                  id="easyEcomEnabled"
                  checked={easyEcomEnabled} 
                  onChange={e => setEasyEcomEnabled(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="easyEcomEnabled" style={{ fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                  Enable EasyEcom Inventory Sync
                </label>
              </div>

              <div className="form-group">
                <label className="glass-label">EasyEcom X-API-KEY</label>
                <input 
                  type="password" 
                  className="glass-input" 
                  placeholder="Enter X-API-KEY from Account Settings" 
                  value={easyEcomXApiKey} 
                  onChange={e => setEasyEcomXApiKey(e.target.value)} 
                  required={easyEcomEnabled}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                  Found under Account Settings &gt; Change credentials on EasyEcom. Type 'sandbox' for test mode.
                </span>
              </div>

              <div className="form-group">
                <label className="glass-label">EasyEcom JWT Token</label>
                <textarea 
                  className="glass-input" 
                  rows={4}
                  placeholder="Paste JWT Authorization Token..." 
                  value={easyEcomJwtToken} 
                  onChange={e => setEasyEcomJwtToken(e.target.value)} 
                  required={easyEcomEnabled}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                  Refer to the Authorization section in EasyEcom API docs to generate. Type 'sandbox' for test mode.
                </span>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="glass-btn"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-cyan)' }}
                  onClick={() => setShowHelperPanel(!showHelperPanel)}
                >
                  {showHelperPanel ? 'Hide Token Generator Helper' : '🔑 Get JWT Token Automatically'}
                </button>

                {showHelperPanel && (
                  <div className="glass-panel" style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>🔐 Generate Token Locally</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                      Enter your EasyEcom credentials below to retrieve the 90-day JWT token directly. Your password is processed purely in your browser and is never stored or sent to the chat.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Email ID</label>
                        <input 
                          type="email" 
                          className="glass-input" 
                          style={{ height: '30px', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          placeholder="registered_email@domain.com"
                          value={helperEmail}
                          onChange={e => setHelperEmail(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Password</label>
                        <input 
                          type="password" 
                          className="glass-input" 
                          style={{ height: '30px', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          placeholder="••••••••"
                          value={helperPassword}
                          onChange={e => setHelperPassword(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Location Key (Seller ID)</label>
                        <input 
                          type="text" 
                          className="glass-input" 
                          style={{ height: '30px', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          placeholder="e.g. ht3485485444"
                          value={helperLocationKey}
                          onChange={e => setHelperLocationKey(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <button 
                        type="button" 
                        className="glass-btn-primary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        disabled={isFetchingToken}
                        onClick={handleFetchJWTToken}
                      >
                        {isFetchingToken ? 'Fetching Token...' : 'Generate & Load Token'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.75rem' }}>
              <div className="form-group">
                <label className="glass-label">CORS Proxy URL (For Browser Sync)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. https://cors-anywhere.herokuapp.com/" 
                  value={easyEcomProxyUrl} 
                  onChange={e => setEasyEcomProxyUrl(e.target.value)} 
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', lineHeight: '1.2' }}>
                  Since direct browser calls to `api.easyecom.io` are restricted by CORS policies, requests are routed through a CORS proxy. Use the default public proxy or enter your own micro-proxy URL.
                </span>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(0, 242, 254, 0.02)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-cyan)' }}>Current SKUs Configuration</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {products.map(prod => (
                    <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.2rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{prod.name}</span>
                      <strong style={{ color: 'var(--text-main)' }}>{prod.sku || 'No SKU Set'}</strong>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                  Note: The app queries EasyEcom for these specific SKU codes. Make sure the SKUs match your EasyEcom finished product list exactly.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Product Creator/Editor Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="drawer-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingProduct ? `Edit ${editingProduct.name} Lifecycle` : 'Add New Product & Define Lifecycle'}
              </h2>
              <button className="drawer-close" onClick={closeAndReset}>×</button>
            </div>

            <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Product Basics */}
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">Product Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={prodName} 
                    onChange={(e) => setProdName(e.target.value)} 
                    placeholder="e.g. Magnesium Lotion Plus" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="glass-label">Category</label>
                  <select 
                    className="glass-input" 
                    value={prodCategory} 
                    onChange={(e) => setProdCategory(e.target.value)}
                  >
                    <option value="Capsule">Capsule</option>
                    <option value="Collagen">Collagen</option>
                    <option value="Lotion">Lotion</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                </div>
              </div>

              {/* SKU & HSN */}
              <div className="form-row">
                <div className="form-group">
                  <label className="glass-label">Product SKU / Code</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={prodSku} 
                    onChange={(e) => setProdSku(e.target.value)} 
                    placeholder="e.g. CPOMEGA1" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="glass-label">HSN / SAC Code</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={prodHsn} 
                    onChange={(e) => setProdHsn(e.target.value)} 
                    placeholder="e.g. 21069099" 
                    required 
                  />
                </div>
              </div>

              {/* Template shortcuts */}
              {!editingProduct && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="glass-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Zap size={14} color="var(--color-cyan)" /> Apply Production Template Shortcut
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="glass-btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => applyTemplate('Capsule')}>Capsule Template</button>
                    <button type="button" className="glass-btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => applyTemplate('Collagen')}>Collagen Template</button>
                    <button type="button" className="glass-btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }} onClick={() => applyTemplate('Lotion')}>Lotion Template</button>
                  </div>
                </div>
              )}

              {/* Lifecycle Builder Steps */}
              <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label className="glass-label" style={{ fontWeight: 600, color: 'var(--text-main)' }}>Production Step Flow ({lifecycleSteps.length})</label>
                
                {/* List of current steps */}
                {lifecycleSteps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dark)', fontSize: '0.8rem', background: 'var(--bg-input)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    No steps added yet. Add steps below or apply a template shortcut.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {lifecycleSteps.map((step, idx) => {
                      if (editingStepIndex === idx) {
                        return (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1.2fr 1fr 0.8fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '0.8rem' }}>
                            <span style={{ background: 'var(--color-cyan)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                              {idx + 1}
                            </span>
                            
                            {/* Item Type Select */}
                            <select 
                              className="glass-input" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                              value={editItemType}
                              onChange={e => setEditItemType(e.target.value)}
                            >
                              {(ITEM_TYPE_OPTIONS.includes(editItemType) ? ITEM_TYPE_OPTIONS : [...ITEM_TYPE_OPTIONS, editItemType]).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>

                            {/* Vendor Select */}
                            <select 
                              className="glass-input" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                              value={editVendor}
                              onChange={e => setEditVendor(e.target.value)}
                            >
                              {(VENDOR_OPTIONS.includes(editVendor) ? VENDOR_OPTIONS : [...VENDOR_OPTIONS, editVendor]).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>

                            {/* Price Input */}
                            <input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              className="glass-input" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                              value={editUnitPrice}
                              onChange={e => setEditUnitPrice(e.target.value)}
                            />

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <button 
                                type="button" 
                                className="glass-btn-primary" 
                                style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, width: '30px', height: '30px' }}
                                onClick={() => saveEditedStep(idx)}
                                title="Save changes"
                              >
                                <Save size={14} />
                              </button>
                              <button 
                                type="button" 
                                className="glass-btn" 
                                style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, width: '30px', height: '30px' }}
                                onClick={() => setEditingStepIndex(null)}
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ background: 'rgba(0,242,254,0.1)', color: 'var(--color-cyan)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                              {idx + 1}
                            </span>
                            <div>
                              <span style={{ fontWeight: 600 }}>{step.itemType}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({step.vendor})</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <strong style={{ marginRight: '0.5rem' }}>₹{step.defaultUnitPrice.toFixed(2)}/u</strong>
                            
                            <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }} onClick={() => moveStep(idx, -1)} disabled={idx === 0}><ArrowUp size={14} /></button>
                            <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }} onClick={() => moveStep(idx, 1)} disabled={idx === lifecycleSteps.length - 1}><ArrowDown size={14} /></button>
                            
                            <button 
                              type="button" 
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', padding: '0.1rem' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-cyan)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dark)'}
                              onClick={() => startEditingStep(idx, step)}
                              title="Edit Step inline"
                            >
                              <Edit size={14} />
                            </button>

                            <button 
                              type="button" 
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', padding: '0.1rem' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-rose)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dark)'}
                              onClick={() => removeLifecycleStep(idx)}
                              title="Delete Step"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add new step builder */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 32px', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label className="glass-label" style={{ fontSize: '0.7rem' }}>Item Type</label>
                    <select 
                      className="glass-input" 
                      style={{ padding: '0.5rem' }} 
                      value={stepItemType} 
                      onChange={e => setStepItemType(e.target.value)}
                    >
                      <option value="">Choose item...</option>
                      <option value="Jar & Lid">Jar & Lid</option>
                      <option value="Canister">Canister</option>
                      <option value="Bottle & Pump">Bottle & Pump</option>
                      <option value="Finished Goods">Finished Goods</option>
                      <option value="Custom Component">Custom Component</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="glass-label" style={{ fontSize: '0.7rem' }}>Supplier/Vendor</label>
                    <select 
                      className="glass-input" 
                      style={{ padding: '0.5rem' }} 
                      value={stepVendor} 
                      onChange={e => setStepVendor(e.target.value)}
                    >
                      <option value="">Choose supplier...</option>
                      <option value="Indian Harness">Indian Harness</option>
                      <option value="KPL">KPL</option>
                      <option value="Bliss Wellness">Bliss Wellness</option>
                      <option value="3S">3S</option>
                      <option value="Custom Vendor">Custom Vendor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="glass-label" style={{ fontSize: '0.7rem' }}>Default Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0.01"
                      className="glass-input" 
                      style={{ padding: '0.5rem' }} 
                      placeholder="0.00" 
                      value={stepUnitPrice}
                      onChange={e => setStepUnitPrice(e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="glass-btn-primary" 
                    style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={addLifecycleStep}
                    disabled={!stepItemType || !stepVendor || !stepUnitPrice}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="glass-btn" onClick={closeAndReset}>Cancel</button>
                <button type="submit" className="glass-btn-primary" disabled={!prodName || lifecycleSteps.length === 0}>
                  {editingProduct ? 'Save Lifecycle' : 'Save Product & Flow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
