import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, hasSupabase } from '../lib/supabaseClient';

// Database Mappers for Supabase integration
const mapDBBatch = (row) => ({
  id: row.id,
  name: row.name,
  productId: row.product_id,
  targetQuantity: row.target_quantity,
  status: row.status,
  startDate: row.start_date,
  endDate: row.end_date
});

const mapUIBatch = (batch) => ({
  id: batch.id,
  name: batch.name,
  product_id: batch.productId,
  target_quantity: batch.targetQuantity,
  status: batch.status,
  start_date: batch.startDate,
  end_date: batch.endDate
});

const mapDBPO = (row) => ({
  id: row.id,
  batchId: row.batch_id,
  productId: row.product_id,
  poNumber: row.po_number,
  vendor: row.vendor,
  itemType: row.item_type,
  orderedQuantity: row.ordered_quantity,
  balanceQuantity: row.balance_quantity,
  unitPrice: Number(row.unit_price),
  totalAmount: Number(row.total_amount),
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  notes: row.notes || '',
  pdfName: row.pdf_name || null,
  pdfUrl: row.pdf_url || null,
  itemsList: row.items_list || [],
  invoiceIds: row.invoice_ids || []
});

const mapUIPO = (po) => ({
  id: po.id,
  batch_id: po.batchId,
  product_id: po.productId,
  po_number: po.poNumber,
  vendor: po.vendor,
  item_type: po.itemType,
  ordered_quantity: po.orderedQuantity,
  balance_quantity: po.balanceQuantity,
  unit_price: po.unitPrice,
  total_amount: po.totalAmount,
  start_date: po.startDate,
  end_date: po.endDate,
  status: po.status,
  notes: po.notes,
  pdf_name: po.pdfName,
  pdf_url: po.pdfUrl,
  items_list: po.itemsList,
  invoice_ids: po.invoiceIds
});

const mapDBInvoice = (row) => ({
  id: row.id,
  poId: row.po_id,
  batchId: row.batch_id,
  invoiceNumber: row.invoice_number,
  invoiceDate: row.invoice_date,
  quantityDelivered: row.quantity_delivered,
  unitPrice: Number(row.unit_price),
  invoiceAmount: Number(row.invoice_amount),
  logistics: row.logistics || '',
  destination: row.destination || '',
  notes: row.notes || '',
  pdfName: row.pdf_name || null,
  pdfUrl: row.pdf_url || null,
  itemsList: row.items_list || []
});

const mapUIInvoice = (inv) => ({
  id: inv.id,
  po_id: inv.poId,
  batch_id: inv.batchId,
  invoice_number: inv.invoiceNumber,
  invoice_date: inv.invoiceDate,
  quantity_delivered: inv.quantityDelivered,
  unit_price: inv.unitPrice,
  invoice_amount: inv.invoiceAmount,
  logistics: inv.logistics,
  destination: inv.destination,
  notes: inv.notes,
  pdf_name: inv.pdfName,
  pdf_url: inv.pdfUrl,
  items_list: inv.itemsList
});

const PortalContext = createContext();

// Default Company Configuration mapping to Tally PO
const DEFAULT_COMPANY_CONFIG = {
  invoiceToName: 'Happylab Solutions Private Limited',
  invoiceToAddress: '804, B Wing 8th Floor, Ganga Jamuna Building, Above Mizu Restaurant, 14th Khar Road, Khar West 400052',
  invoiceToGSTIN: '27AAFCH3921H1ZO',
  invoiceToStateName: 'Maharashtra',
  invoiceToStateCode: '27',
  invoiceToCIN: 'U15490MH2020PTC344074',
  invoiceToEmail: 'accounts@yourhappylife.com',
  shipToName: 'Happylab Solutions Private Limited',
  shipToAddress: 'Beyond Warehouse- Bhiwandi, C/O SM Industrial Park, Box S 100, Survey No. 111, Hissa No. 1, Survey 83, Village Bhinar, Vadpe Bhiwandi 421302',
  shipToEmail: 'operations@yourhappylife.com',
  shipToGSTIN: '27AAFCH3921H1ZO',
  shipToStateName: 'Maharashtra',
  shipToStateCode: '27',
  companyPAN: 'AAFCH3921H',
  authorisedFor: 'Happylab Solutions Private Limited',
  declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'
};

// Default Vendors Registry details
const DEFAULT_VENDORS_CONFIG = {
  'Indian Harness': {
    name: 'Indian Harness',
    address: '88, Industrial Area, Sector 3, Vasai East, Palghar, Maharashtra - 401208',
    gstin: '07AAIFI4164M1ZW',
    stateName: 'Delhi',
    stateCode: '07'
  },
  'KPL': {
    name: 'KPL Packaging Limited',
    address: 'Plot No 12/B, Phase II, GIDC, Vapi, Gujarat - 396195',
    gstin: '24AAPFK9812B1ZX',
    stateName: 'Gujarat',
    stateCode: '24'
  },
  'Bliss Wellness': {
    name: 'Bliss Wellness Products',
    address: '5th Floor, Corporate Park, Near Powai Lake, Mumbai, Maharashtra - 400076',
    gstin: '27AAPFB1234D1ZF',
    stateName: 'Maharashtra',
    stateCode: '27'
  },
  '3S': {
    name: '3S Manufacturing Solutions',
    address: 'Survey No. 44, Hosur Road, Electronic City Phase 1, Bangalore, Karnataka - 560100',
    gstin: '29AAATS4401M1ZS',
    stateName: 'Karnataka',
    stateCode: '29'
  },
  'Bliss Life Sciences': {
    name: 'Bliss Life Sciences',
    address: 'Desai Corporate, 15 Mangal Compound, Near Mercedes Showroom, Dewas Naka, Indore (MP) - 452010',
    gstin: '23AAPFB8482L1ZV',
    stateName: 'Madhya Pradesh',
    stateCode: '23'
  },
  'M/s Quantum International Private Limited': {
    name: 'M/s Quantum International Private Limited',
    address: 'Plot No. 45, Sector 5, IMT Manesar, Gurugram, Haryana - 122050',
    gstin: '09AAACQ0270B1ZY',
    stateName: 'Uttar Pradesh',
    stateCode: '09'
  },
  'Kamal Packaging Pvt Ltd': {
    name: 'Kamal Packaging Pvt Ltd',
    address: 'Plot No 22, GIDC Industrial Estate, Vapi, Gujarat - 396195',
    gstin: '27AABCK2531J1ZD',
    stateName: 'Maharashtra',
    stateCode: '27'
  },
  '3s Fitness Technologies Private Limited': {
    name: '3s Fitness Technologies Private Limited',
    address: 'Survey No. 12, Industrial Area, Phase 1, Jaipur, Rajasthan - 302001',
    gstin: '08AAACS9633K1ZV',
    stateName: 'Rajasthan',
    stateCode: '08'
  },
  'Kaushalya Enterprises': {
    name: 'Kaushalya Enterprises',
    address: '102, Shivam Industrial Estate, Thane West, Maharashtra - 400604',
    gstin: '27BAWPJ5265R1ZJ',
    stateName: 'Maharashtra',
    stateCode: '27'
  },
  'Dhwani Polyprints Private Limited': {
    name: 'Dhwani Polyprints Private Limited',
    address: 'Survey No. 231, National Highway 8, Vapi, Gujarat - 396191',
    gstin: '24AAACD3775C1Z1',
    stateName: 'Gujarat',
    stateCode: '24'
  },
  'Amantra Packaging': {
    name: 'Amantra Packaging',
    address: 'Sector 37, Pace City II, Gurugram, Haryana - 122001',
    gstin: '06DWXPA6282L1ZT',
    stateName: 'Haryana',
    stateCode: '06'
  },
  'Ancient Nutra Private Limited': {
    name: 'Ancient Nutra Private Limited',
    address: 'Plot 404, GIDC, Sachin, Surat, Gujarat - 394230',
    gstin: '24ABCCA1142R1ZD',
    stateName: 'Gujarat',
    stateCode: '24'
  }
};

// Default Products & Lifecycles in INR
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Omega-3',
    sku: 'CPOMEGA1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-1-1', itemType: 'Jar & Lid', vendor: 'Indian Harness', defaultUnitPrice: 24.49 },
      { id: 'step-1-2', itemType: 'Canister', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 21.42 },
      { id: 'step-1-3', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 271.00 }
    ]
  },
  {
    id: 'prod-2',
    name: 'Pure Skin',
    sku: 'CPSKIN1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-2-1', itemType: 'Jar & Lid', vendor: 'Indian Harness', defaultUnitPrice: 24.49 },
      { id: 'step-2-2', itemType: 'Canister', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 21.42 },
      { id: 'step-2-3', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 233.33 }
    ]
  },
  {
    id: 'prod-3',
    name: 'Mag 5x Pro',
    sku: 'CPMAG1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-3-1', itemType: 'Label for Mag 5Xup', vendor: 'Amantra Packaging', defaultUnitPrice: 7.50 },
      { id: 'step-3-2', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 211.00 }
    ]
  },
  {
    id: 'prod-4',
    name: 'Core Detox',
    sku: 'CPDETOX1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-4-1', itemType: 'Jar & Lid', vendor: 'Indian Harness', defaultUnitPrice: 24.49 },
      { id: 'step-4-2', itemType: 'Canister', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 21.42 },
      { id: 'step-4-3', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 271.00 }
    ]
  },
  {
    id: 'prod-5',
    name: 'Hair Revive',
    sku: 'CPHAIR1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-5-1', itemType: 'Jar & Lid', vendor: 'Indian Harness', defaultUnitPrice: 24.49 },
      { id: 'step-5-2', itemType: 'Canister', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 21.42 },
      { id: 'step-5-3', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 250.00 }
    ]
  },
  {
    id: 'prod-6',
    name: 'Collagen Naked',
    sku: 'CLNAKED1',
    hsn: '21069099',
    category: 'Collagen',
    lifecycle: [
      { id: 'step-6-1', itemType: 'Collagen Canisters unflavoured collagen', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 21.42 },
      { id: 'step-6-2', itemType: 'Finished Goods', vendor: '3s Fitness Technologies Private Limited', defaultUnitPrice: 357.18 }
    ]
  },
  {
    id: 'prod-7',
    name: 'Collagen Reglow',
    sku: 'CLREGLOW1',
    hsn: '21069099',
    category: 'Collagen',
    lifecycle: [
      { id: 'step-7-1', itemType: 'Collagen Canisters Reglow (Passion Fruit)', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 21.42 },
      { id: 'step-7-2', itemType: 'Finished Goods', vendor: '3s Fitness Technologies Private Limited', defaultUnitPrice: 396.24 }
    ]
  },
  {
    id: 'prod-8',
    name: 'Magnesium Lotion',
    sku: 'LTMAG1',
    hsn: '33049990',
    category: 'Lotion',
    lifecycle: [
      { id: 'step-8-1', itemType: 'Beak pump', vendor: 'Indian Harness', defaultUnitPrice: 10.50 },
      { id: 'step-8-2', itemType: 'Hope bottle', vendor: 'Indian Harness', defaultUnitPrice: 11.00 },
      { id: 'step-8-3', itemType: 'Finished Goods', vendor: 'M/s Quantum International Private Limited', defaultUnitPrice: 93.22 }
    ]
  },
  {
    id: 'prod-9',
    name: 'Multi For Him',
    sku: 'CPMAG1', // wait, let's keep SKU CPMULMIM1
    sku: 'CPMULMIM1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-9-1', itemType: 'Canister for Multi For Him', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 18.61 },
      { id: 'step-9-2', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 310.00 }
    ]
  },
  {
    id: 'prod-10',
    name: 'Multi For Her',
    sku: 'CPMULHER1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-10-1', itemType: 'Canister for Multi For Her', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 18.61 },
      { id: 'step-10-2', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 320.00 }
    ]
  },
  {
    id: 'prod-11',
    name: 'IronPulse',
    sku: 'CPIRON1',
    hsn: '21069099',
    category: 'Capsule',
    lifecycle: [
      { id: 'step-11-1', itemType: 'Canister for Triphase Release IronPulse', vendor: 'Kamal Packaging Pvt Ltd', defaultUnitPrice: 18.61 },
      { id: 'step-11-2', itemType: 'Finished Goods', vendor: 'Bliss Life Sciences', defaultUnitPrice: 171.00 }
    ]
  }
];

// Initial Stock
const DEFAULT_INVENTORY = {
  'Jar & Lid': 0,
  'Canister': 0,
  'Bottle & Pump': 0,
  'Beak pump': 0,
  'Hope bottle': 0,
  '100 gm Clear Glass Jar with matte white cap': 0,
  'Collagen Canisters unflavoured collagen': 0,
  'Collagen Canisters Reglow (Passion Fruit)': 0,
  'Canister for Multi For Him': 0,
  'Canister for Multi For Her': 0,
  'Canister for Triphase Release IronPulse': 0,
  'SINGLE COLOR PRINTED BOPP TAPES': 0,
  'Courier Bags': 0,
  'Label for Mag 5Xup': 0,
  'Omega-3': 0,
  'Pure Skin': 0,
  'Mag 5x Pro': 0,
  'Core Detox': 0,
  'Hair Revive': 0,
  'Collagen Naked': 0,
  'Collagen Reglow': 0,
  'Magnesium Lotion': 0,
  'Multi For Him': 0,
  'Multi For Her': 0,
  'IronPulse': 0
};

// Default Authentication Users
const DEFAULT_USERS = [
  { id: 'u-1', email: 'tech@yourhappylife.com', password: 'admin123', name: 'Tech Admin', role: 'Super Admin' },
  { id: 'u-2', email: 'ops@yourhappylife.com', password: 'ops123', name: 'Operations Lead', role: 'Operations' },
  { id: 'u-3', email: 'accounts@yourhappylife.com', password: 'accts123', name: 'Accounts Manager', role: 'Accounts' }
];

// Default Safety Thresholds
const DEFAULT_THRESHOLDS = {
  'Jar & Lid': 500,
  'Canister': 500,
  'Bottle & Pump': 500,
  'Beak pump': 500,
  'Hope bottle': 500,
  '100 gm Clear Glass Jar with matte white cap': 500,
  'Collagen Canisters unflavoured collagen': 500,
  'Collagen Canisters Reglow (Passion Fruit)': 500,
  'Canister for Multi For Him': 500,
  'Canister for Multi For Her': 500,
  'Canister for Triphase Release IronPulse': 500,
  'SINGLE COLOR PRINTED BOPP TAPES': 100,
  'Courier Bags': 500,
  'Label for Mag 5Xup': 500,
  'Omega-3': 150,
  'Pure Skin': 150,
  'Mag 5x Pro': 150,
  'Core Detox': 150,
  'Hair Revive': 150,
  'Collagen Naked': 150,
  'Collagen Reglow': 150,
  'Magnesium Lotion': 150,
  'Multi For Him': 150,
  'Multi For Her': 150,
  'IronPulse': 150
};

// Initial Mock Data
const MOCK_BATCHES = [];

const MOCK_POS = [
  {
    id: 'PO-26-27-YHL01',
    batchId: null,
    productId: 'prod-8',
    poNumber: 'PO/26-27/YHL01',
    vendor: 'Indian Harness',
    itemType: 'Beak pump, Hope bottle',
    orderedQuantity: 4000,
    balanceQuantity: 4000,
    unitPrice: 10.75,
    totalAmount: 43000,
    startDate: '2026-04-02',
    endDate: '2026-05-02',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL01',
    itemsList: [
      {
        id: 'PO-26-27-YHL01-item-1',
        productId: 'prod-8',
        itemType: 'Beak pump',
        orderedQuantity: 2000,
        balanceQuantity: 2000,
        unitPrice: 10.50,
        totalAmount: 21000
      },
      {
        id: 'PO-26-27-YHL01-item-2',
        productId: 'prod-8',
        itemType: 'Hope bottle',
        orderedQuantity: 2000,
        balanceQuantity: 2000,
        unitPrice: 11.00,
        totalAmount: 22000
      }
    ]
  },
  {
    id: 'PO-26-27-YHL02',
    batchId: null,
    productId: 'prod-8',
    poNumber: 'PO/26-27/YHL02',
    vendor: 'M/s Quantum International Private Limited',
    itemType: 'LOMAGSL1',
    orderedQuantity: 1000,
    balanceQuantity: 1000,
    unitPrice: 93.22,
    totalAmount: 93220,
    startDate: '2026-04-09',
    endDate: '2026-05-09',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL02',
    itemsList: [
      {
        id: 'PO-26-27-YHL02-item-1',
        productId: 'prod-8',
        itemType: 'LOMAGSL1',
        orderedQuantity: 1000,
        balanceQuantity: 1000,
        unitPrice: 93.22,
        totalAmount: 93220
      }
    ]
  },
  {
    id: 'PO-26-27-YHL03',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL03',
    vendor: 'Indian Harness',
    itemType: '100 gm Clear Glass Jar with matte white cap',
    orderedQuantity: 30000,
    balanceQuantity: 30000,
    unitPrice: 24.49,
    totalAmount: 734700,
    startDate: '2026-04-09',
    endDate: '2026-05-09',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL03',
    itemsList: [
      {
        id: 'PO-26-27-YHL03-item-1',
        productId: null,
        itemType: '100 gm Clear Glass Jar with matte white cap',
        orderedQuantity: 30000,
        balanceQuantity: 30000,
        unitPrice: 24.49,
        totalAmount: 734700
      }
    ]
  },
  {
    id: 'PO-26-27-YHL04',
    batchId: null,
    productId: 'prod-1',
    poNumber: 'PO/26-27/YHL04',
    vendor: 'Bliss Life Sciences',
    itemType: 'Finished Goods',
    orderedQuantity: 10000,
    balanceQuantity: 10000,
    unitPrice: 271.00,
    totalAmount: 2710000,
    startDate: '2026-04-22',
    endDate: '2026-05-22',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL04',
    itemsList: [
      {
        id: 'PO-26-27-YHL04-item-1',
        productId: 'prod-1',
        itemType: 'Finished Goods',
        orderedQuantity: 10000,
        balanceQuantity: 10000,
        unitPrice: 271.00,
        totalAmount: 2710000
      }
    ]
  },
  {
    id: 'PO-26-27-YHL05',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL05',
    vendor: 'Kamal Packaging Pvt Ltd',
    itemType: 'Collagen Canisters unflavoured collagen, Collagen Canisters Reglow (Passion Fruit)',
    orderedQuantity: 3200,
    balanceQuantity: 3200,
    unitPrice: 21.42,
    totalAmount: 68544,
    startDate: '2026-04-23',
    endDate: '2026-05-23',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL05',
    itemsList: [
      {
        id: 'PO-26-27-YHL05-item-1',
        productId: 'prod-6',
        itemType: 'Collagen Canisters unflavoured collagen',
        orderedQuantity: 1600,
        balanceQuantity: 1600,
        unitPrice: 21.42,
        totalAmount: 34272
      },
      {
        id: 'PO-26-27-YHL05-item-2',
        productId: 'prod-7',
        itemType: 'Collagen Canisters Reglow (Passion Fruit)',
        orderedQuantity: 1600,
        balanceQuantity: 1600,
        unitPrice: 21.42,
        totalAmount: 34272
      }
    ]
  },
  {
    id: 'PO-26-27-YHL06',
    batchId: null,
    productId: 'prod-3',
    poNumber: 'PO/26-27/YHL06',
    vendor: 'Bliss Life Sciences',
    itemType: 'Finished Goods',
    orderedQuantity: 5000,
    balanceQuantity: 5000,
    unitPrice: 211.00,
    totalAmount: 1055000,
    startDate: '2026-04-30',
    endDate: '2026-05-30',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL06',
    itemsList: [
      {
        id: 'PO-26-27-YHL06-item-1',
        productId: 'prod-3',
        itemType: 'Finished Goods',
        orderedQuantity: 5000,
        balanceQuantity: 5000,
        unitPrice: 211.00,
        totalAmount: 1055000
      }
    ]
  },
  {
    id: 'PO-26-27-YHL07',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL07',
    vendor: '3s Fitness Technologies Private Limited',
    itemType: 'POCOUF01, POCORG01',
    orderedQuantity: 20000,
    balanceQuantity: 20000,
    unitPrice: 376.71,
    totalAmount: 7534200,
    startDate: '2026-04-30',
    endDate: '2026-05-30',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL07',
    itemsList: [
      {
        id: 'PO-26-27-YHL07-item-1',
        productId: 'prod-6',
        itemType: 'POCOUF01',
        orderedQuantity: 10000,
        balanceQuantity: 10000,
        unitPrice: 357.18,
        totalAmount: 3571800
      },
      {
        id: 'PO-26-27-YHL07-item-2',
        productId: 'prod-7',
        itemType: 'POCORG01',
        orderedQuantity: 10000,
        balanceQuantity: 10000,
        unitPrice: 396.24,
        totalAmount: 3962400
      }
    ]
  },
  {
    id: 'PO-26-27-YHL08',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL08',
    vendor: 'Kaushalya Enterprises',
    itemType: 'SINGLE COLOR PRINTED BOPP TAPES',
    orderedQuantity: 96,
    balanceQuantity: 96,
    unitPrice: 112.00,
    totalAmount: 10752,
    startDate: '2026-05-06',
    endDate: '2026-06-06',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL08',
    itemsList: [
      {
        id: 'PO-26-27-YHL08-item-1',
        productId: null,
        itemType: 'SINGLE COLOR PRINTED BOPP TAPES',
        orderedQuantity: 96,
        balanceQuantity: 96,
        unitPrice: 112.00,
        totalAmount: 10752
      }
    ]
  },
  {
    id: 'PO-26-27-YHL09',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL09',
    vendor: 'Kaushalya Enterprises',
    itemType: 'SINGLE COLOR PRINTED BOPP TAPES',
    orderedQuantity: 144,
    balanceQuantity: 144,
    unitPrice: 112.00,
    totalAmount: 16128,
    startDate: '2026-05-06',
    endDate: '2026-06-06',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL09',
    itemsList: [
      {
        id: 'PO-26-27-YHL09-item-1',
        productId: null,
        itemType: 'SINGLE COLOR PRINTED BOPP TAPES',
        orderedQuantity: 144,
        balanceQuantity: 144,
        unitPrice: 112.00,
        totalAmount: 16128
      }
    ]
  },
  {
    id: 'PO-26-27-YHL10',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL010',
    vendor: 'Bliss Life Sciences',
    itemType: 'Finished Goods',
    orderedQuantity: 7500,
    balanceQuantity: 7500,
    unitPrice: 267.00,
    totalAmount: 2002500,
    startDate: '2026-05-06',
    endDate: '2026-06-06',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL010',
    itemsList: [
      {
        id: 'PO-26-27-YHL10-item-1',
        productId: 'prod-9',
        itemType: 'Finished Goods',
        orderedQuantity: 2500,
        balanceQuantity: 2500,
        unitPrice: 310.00,
        totalAmount: 775000
      },
      {
        id: 'PO-26-27-YHL10-item-2',
        productId: 'prod-10',
        itemType: 'Finished Goods',
        orderedQuantity: 2500,
        balanceQuantity: 2500,
        unitPrice: 320.00,
        totalAmount: 800000
      },
      {
        id: 'PO-26-27-YHL10-item-3',
        productId: 'prod-11',
        itemType: 'Finished Goods',
        orderedQuantity: 2500,
        balanceQuantity: 2500,
        unitPrice: 171.00,
        totalAmount: 427500
      }
    ]
  },
  {
    id: 'PO-26-27-YHL11',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL011',
    vendor: 'Dhwani Polyprints Private Limited',
    itemType: 'Courier Bags',
    orderedQuantity: 10000,
    balanceQuantity: 10000,
    unitPrice: 5.00,
    totalAmount: 50000,
    startDate: '2026-05-17',
    endDate: '2026-06-17',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL011',
    itemsList: [
      {
        id: 'PO-26-27-YHL11-item-1',
        productId: null,
        itemType: 'Courier Bags',
        orderedQuantity: 10000,
        balanceQuantity: 10000,
        unitPrice: 5.00,
        totalAmount: 50000
      }
    ]
  },
  {
    id: 'PO-26-27-YHL12',
    batchId: null,
    productId: 'prod-3',
    poNumber: 'PO/26-27/YHL012',
    vendor: 'Amantra Packaging',
    itemType: 'Label for Mag 5Xup',
    orderedQuantity: 1500,
    balanceQuantity: 1500,
    unitPrice: 7.50,
    totalAmount: 11250,
    startDate: '2026-05-19',
    endDate: '2026-06-19',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL012',
    itemsList: [
      {
        id: 'PO-26-27-YHL12-item-1',
        productId: 'prod-3',
        itemType: 'Label for Mag 5Xup',
        orderedQuantity: 1500,
        balanceQuantity: 1500,
        unitPrice: 7.50,
        totalAmount: 11250
      }
    ]
  },
  {
    id: 'PO-26-27-YHL13',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL013',
    vendor: 'Bliss Life Sciences',
    itemType: 'Finished Goods',
    orderedQuantity: 22000,
    balanceQuantity: 22000,
    unitPrice: 265.55,
    totalAmount: 5842000,
    startDate: '2026-05-22',
    endDate: '2026-06-22',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL013',
    itemsList: [
      {
        id: 'PO-26-27-YHL13-item-1',
        productId: 'prod-3',
        itemType: 'Finished Goods',
        orderedQuantity: 7000,
        balanceQuantity: 7000,
        unitPrice: 211.00,
        totalAmount: 1477000
      },
      {
        id: 'PO-26-27-YHL13-item-2',
        productId: 'prod-2',
        itemType: 'Finished Goods',
        orderedQuantity: 6000,
        balanceQuantity: 6000,
        unitPrice: 233.33,
        totalAmount: 1400000
      },
      {
        id: 'PO-26-27-YHL13-item-3',
        productId: 'prod-5',
        itemType: 'Finished Goods',
        orderedQuantity: 5000,
        balanceQuantity: 5000,
        unitPrice: 250.00,
        totalAmount: 1250000
      },
      {
        id: 'PO-26-27-YHL13-item-4',
        productId: 'prod-1',
        itemType: 'Finished Goods',
        orderedQuantity: 4000,
        balanceQuantity: 4000,
        unitPrice: 429.00,
        totalAmount: 1716000
      }
    ]
  },
  {
    id: 'PO-26-27-YHL14',
    batchId: null,
    productId: null,
    poNumber: 'PO/26-27/YHL014',
    vendor: 'Kamal Packaging Pvt Ltd',
    itemType: 'Canister for Multi For Him, Canister for Multi For Her, Canister for Triphase Release IronPulse',
    orderedQuantity: 7500,
    balanceQuantity: 7500,
    unitPrice: 18.61,
    totalAmount: 139575,
    startDate: '2026-05-30',
    endDate: '2026-06-30',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL014',
    itemsList: [
      {
        id: 'PO-26-27-YHL14-item-1',
        productId: 'prod-9',
        itemType: 'Canister for Multi For Him',
        orderedQuantity: 2500,
        balanceQuantity: 2500,
        unitPrice: 18.61,
        totalAmount: 46525
      },
      {
        id: 'PO-26-27-YHL14-item-2',
        productId: 'prod-10',
        itemType: 'Canister for Multi For Her',
        orderedQuantity: 2500,
        balanceQuantity: 2500,
        unitPrice: 18.61,
        totalAmount: 46525
      },
      {
        id: 'PO-26-27-YHL14-item-3',
        productId: 'prod-11',
        itemType: 'Canister for Triphase Release IronPulse',
        orderedQuantity: 2500,
        balanceQuantity: 2500,
        unitPrice: 18.61,
        totalAmount: 46525
      }
    ]
  },
  {
    id: 'PO-26-27-YHL15',
    batchId: null,
    productId: 'prod-1',
    poNumber: 'PO/26-27/YHL015',
    vendor: 'Ancient Nutra Private Limited',
    itemType: 'Finished Goods',
    orderedQuantity: 10000,
    balanceQuantity: 10000,
    unitPrice: 364.49,
    totalAmount: 3644900,
    startDate: '2026-06-05',
    endDate: '2026-07-05',
    status: 'Sent',
    invoiceIds: [],
    notes: 'Imported PO/26-27/YHL015',
    itemsList: [
      {
        id: 'PO-26-27-YHL15-item-1',
        productId: 'prod-1',
        itemType: 'Finished Goods',
        orderedQuantity: 10000,
        balanceQuantity: 10000,
        unitPrice: 364.49,
        totalAmount: 3644900
      }
    ]
  }
];

const MOCK_INVOICES = [];

// Carry Forward Pool
// Struct: array of objects: { id, productId, productName, vendor, itemType, quantity, sourcePOId, sourcePONumber }
const INITIAL_CARRY_FORWARD = [];

export const migratePO = (po) => {
  if (!po.itemsList) {
    return {
      ...po,
      itemsList: [{
        id: `${po.id}-item-0`,
        productId: po.productId || null,
        itemType: po.itemType,
        orderedQuantity: po.orderedQuantity,
        balanceQuantity: po.balanceQuantity,
        unitPrice: po.unitPrice,
        totalAmount: po.totalAmount,
        carriedForwardQty: po.carriedForwardQty,
        carryForwardFromPOId: po.carryForwardFromPOId,
        carryForwardDetailStr: po.carryForwardDetailStr
      }]
    };
  }
  return po;
};

// Centralized local-timezone robust date helper
export const getLocalDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_DESTINATIONS = [
  'Bhiwandi Warehouse',
  'Gurgaon Warehouse',
  'Amazon Warehouse',
  'HQ',
  'Instamart',
  'Blinkit',
  'Tira'
];

export const PortalProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const missing = DEFAULT_PRODUCTS.filter(dp => !parsed.some(p => p.id === dp.id));
          if (missing.length > 0) return [...parsed, ...missing];
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load products:", e);
    }
    return DEFAULT_PRODUCTS;
  });

  const [batches, setBatches] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_batches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load batches:", e);
    }
    return MOCK_BATCHES;
  });

  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(migratePO);
      }
    } catch (e) {
      console.error("Failed to load POs:", e);
    }
    return MOCK_POS.map(migratePO);
  });

  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load invoices:", e);
    }
    return MOCK_INVOICES;
  });

  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          Object.keys(DEFAULT_INVENTORY).forEach(k => {
            if (parsed[k] === undefined) parsed[k] = DEFAULT_INVENTORY[k];
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load inventory:", e);
    }
    return DEFAULT_INVENTORY;
  });

  const [carryForwards, setCarryForwards] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_carry_forward');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load carry forwards:", e);
    }
    return INITIAL_CARRY_FORWARD;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('yhl_theme');
    return saved ? saved : 'dark';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load current user:", e);
    }
    return null;
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load users list:", e);
    }
    return DEFAULT_USERS;
  });

  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('yhl_role');
    return saved ? saved : 'Operations';
  });

  const [isQuickLoginEnabled, setIsQuickLoginEnabled] = useState(() => {
    const saved = localStorage.getItem('yhl_quick_login');
    return saved ? saved === 'true' : true;
  });

  const [safetyThresholds, setSafetyThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_safety_thresholds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          Object.keys(DEFAULT_THRESHOLDS).forEach(k => {
            if (parsed[k] === undefined) parsed[k] = DEFAULT_THRESHOLDS[k];
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load safety thresholds:", e);
    }
    return DEFAULT_THRESHOLDS;
  });

  const [companyConfig, setCompanyConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_company_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load company config:", e);
    }
    return DEFAULT_COMPANY_CONFIG;
  });

  const [vendorsConfig, setVendorsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_vendors_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          Object.keys(DEFAULT_VENDORS_CONFIG).forEach(k => {
            if (!parsed[k]) parsed[k] = DEFAULT_VENDORS_CONFIG[k];
          });
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load vendors config:", e);
    }
    return DEFAULT_VENDORS_CONFIG;
  });

  const [deliveryDestinations, setDeliveryDestinations] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_delivery_destinations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const missing = DEFAULT_DESTINATIONS.filter(d => !parsed.includes(d));
          if (missing.length > 0) return [...parsed, ...missing];
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load delivery destinations:", e);
    }
    return DEFAULT_DESTINATIONS;
  });

  const [easyEcomConfig, setEasyEcomConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_easyecom_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load EasyEcom config:", e);
    }
    return {
      isEnabled: false,
      xApiKey: '',
      jwtToken: '',
      proxyUrl: 'https://cors-anywhere.herokuapp.com/'
    };
  });

  const [easyEcomLastSync, setEasyEcomLastSync] = useState(() => {
    return localStorage.getItem('yhl_easyecom_last_sync') || null;
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('yhl_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
    return [
      {
        id: 'notif-seed-1',
        text: 'System Initialized: Operations & Production Portal is ready.',
        timestamp: getLocalDateStr() + ' 09:00',
        read: true
      }
    ];
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('yhl_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('yhl_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('yhl_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('yhl_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('yhl_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('yhl_carry_forward', JSON.stringify(carryForwards));
  }, [carryForwards]);

  useEffect(() => {
    localStorage.setItem('yhl_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('yhl_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('yhl_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('yhl_company_config', JSON.stringify(companyConfig));
  }, [companyConfig]);

  useEffect(() => {
    localStorage.setItem('yhl_vendors_config', JSON.stringify(vendorsConfig));
  }, [vendorsConfig]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('yhl_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('yhl_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('yhl_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('yhl_quick_login', isQuickLoginEnabled ? 'true' : 'false');
  }, [isQuickLoginEnabled]);

  useEffect(() => {
    localStorage.setItem('yhl_safety_thresholds', JSON.stringify(safetyThresholds));
  }, [safetyThresholds]);

  useEffect(() => {
    localStorage.setItem('yhl_delivery_destinations', JSON.stringify(deliveryDestinations));
  }, [deliveryDestinations]);

  useEffect(() => {
    localStorage.setItem('yhl_easyecom_config', JSON.stringify(easyEcomConfig));
  }, [easyEcomConfig]);

  useEffect(() => {
    if (easyEcomLastSync) {
      localStorage.setItem('yhl_easyecom_last_sync', easyEcomLastSync);
    } else {
      localStorage.removeItem('yhl_easyecom_last_sync');
    }
  }, [easyEcomLastSync]);

  // --- Supabase DB Load & Synchronization ---
  const [isDbLoading, setIsDbLoading] = useState(hasSupabase);

  useEffect(() => {
    if (!hasSupabase) return;

    const loadData = async () => {
      try {
        // 1. Fetch config settings
        const { data: configRows } = await supabase.from('config_settings').select('*');
        const configKeys = configRows ? configRows.map(r => r.key) : [];
        
        if (configRows) {
          const prodRow = configRows.find(r => r.key === 'products');
          if (prodRow) {
            const dbProds = prodRow.value || [];
            const missing = DEFAULT_PRODUCTS.filter(dp => !dbProds.some(p => p.id === dp.id));
            if (missing.length > 0) {
              const updated = [...dbProds, ...missing];
              setProducts(updated);
              await supabase.from('config_settings').upsert({ key: 'products', value: updated });
            } else {
              setProducts(dbProds);
            }
          } else {
            await supabase.from('config_settings').insert({ key: 'products', value: products });
          }

          const compRow = configRows.find(r => r.key === 'company_config');
          if (compRow) setCompanyConfig(compRow.value);
          else await supabase.from('config_settings').insert({ key: 'company_config', value: companyConfig });

          const vendRow = configRows.find(r => r.key === 'vendors_config');
          if (vendRow) {
            const dbVends = vendRow.value || {};
            let changed = false;
            Object.keys(DEFAULT_VENDORS_CONFIG).forEach(k => {
              if (!dbVends[k]) {
                dbVends[k] = DEFAULT_VENDORS_CONFIG[k];
                changed = true;
              }
            });
            if (changed) {
              setVendorsConfig(dbVends);
              await supabase.from('config_settings').upsert({ key: 'vendors_config', value: dbVends });
            } else {
              setVendorsConfig(dbVends);
            }
          } else {
            await supabase.from('config_settings').insert({ key: 'vendors_config', value: vendorsConfig });
          }

          const threshRow = configRows.find(r => r.key === 'safety_thresholds');
          if (threshRow) {
            const dbThresh = threshRow.value || {};
            let changed = false;
            Object.keys(DEFAULT_THRESHOLDS).forEach(k => {
              if (dbThresh[k] === undefined) {
                dbThresh[k] = DEFAULT_THRESHOLDS[k];
                changed = true;
              }
            });
            if (changed) {
              setSafetyThresholds(dbThresh);
              await supabase.from('config_settings').upsert({ key: 'safety_thresholds', value: dbThresh });
            } else {
              setSafetyThresholds(dbThresh);
            }
          } else {
            await supabase.from('config_settings').insert({ key: 'safety_thresholds', value: safetyThresholds });
          }

          const destRow = configRows.find(r => r.key === 'delivery_destinations');
          if (destRow) {
            const dbDest = destRow.value || [];
            const missing = DEFAULT_DESTINATIONS.filter(d => !dbDest.includes(d));
            if (missing.length > 0) {
              const updated = [...dbDest, ...missing];
              setDeliveryDestinations(updated);
              await supabase.from('config_settings').upsert({ key: 'delivery_destinations', value: updated });
            } else {
              setDeliveryDestinations(dbDest);
            }
          } else {
            await supabase.from('config_settings').insert({ key: 'delivery_destinations', value: deliveryDestinations });
          }

          const easyEcomRow = configRows.find(r => r.key === 'easyecom_config');
          if (easyEcomRow) {
            setEasyEcomConfig(easyEcomRow.value);
          } else {
            await supabase.from('config_settings').insert({ key: 'easyecom_config', value: easyEcomConfig });
          }
        }

        // 2. Fetch Batches
        const { data: batchesRows } = await supabase.from('batches').select('*');
        if (batchesRows && batchesRows.length > 0) {
          setBatches(batchesRows.map(mapDBBatch));
        } else if (batchesRows && batchesRows.length === 0) {
          try {
            await supabase.from('batches').insert(MOCK_BATCHES.map(mapUIBatch));
          } catch (e) { console.warn("Failed to seed batches:", e); }
          setBatches(MOCK_BATCHES);
        }

        // 3. Fetch POs
        const { data: poRows } = await supabase.from('purchase_orders').select('*');
        if (poRows && poRows.length > 0) {
          setPurchaseOrders(poRows.map(mapDBPO));
        } else if (poRows && poRows.length === 0) {
          try {
            await supabase.from('purchase_orders').insert(MOCK_POS.map(mapUIPO));
          } catch (e) { console.warn("Failed to seed POs:", e); }
          setPurchaseOrders(MOCK_POS.map(migratePO));
        }

        // 4. Fetch Invoices
        const { data: invRows } = await supabase.from('invoices').select('*');
        if (invRows && invRows.length > 0) {
          setInvoices(invRows.map(mapDBInvoice));
        } else if (invRows && invRows.length === 0) {
          try {
            await supabase.from('invoices').insert(MOCK_INVOICES.map(mapUIInvoice));
          } catch (e) { console.warn("Failed to seed invoices:", e); }
          setInvoices(MOCK_INVOICES);
        }

        // 5. Fetch Inventory
        const { data: invRowsDb } = await supabase.from('inventory').select('*');
        if (invRowsDb && invRowsDb.length > 0) {
          const invObj = {};
          invRowsDb.forEach(row => {
            invObj[row.item_name] = row.quantity;
          });
          
          let missingInventory = [];
          Object.keys(DEFAULT_INVENTORY).forEach(k => {
            if (invObj[k] === undefined) {
              invObj[k] = 0;
              missingInventory.push({ item_name: k, quantity: 0 });
            }
          });
          
          setInventory(invObj);
          
          if (missingInventory.length > 0) {
            await supabase.from('inventory').upsert(missingInventory);
          }
        }

        // 6. Fetch Carry Forwards
        const { data: cfRows } = await supabase.from('carry_forwards').select('*');
        if (cfRows && cfRows.length > 0) setCarryForwards(cfRows.map(row => ({
          id: row.id,
          productId: row.product_id,
          itemType: row.item_type,
          quantity: row.quantity,
          sourcePOId: row.source_po_id,
          sourcePONumber: row.source_po_number
        })));

        // 7. Fetch Notifications
        const { data: notifRows } = await supabase.from('notifications').select('*');
        if (notifRows && notifRows.length > 0) setNotifications(notifRows.map(row => ({
          id: row.id,
          text: row.text,
          timestamp: row.date,
          category: row.category,
          read: row.read
        })));

        // 8. Fetch Portal Users
        try {
          const { data: userRows } = await supabase.from('portal_users').select('*');
          if (userRows && userRows.length > 0) {
            setUsers(userRows.map(row => ({
              id: row.id,
              email: row.email,
              password: row.password,
              name: row.name,
              role: row.role
            })));
          } else {
            // Seed defaults into database if empty
            await supabase.from('portal_users').insert(DEFAULT_USERS.map(u => ({
              id: u.id,
              email: u.email,
              password: u.password,
              name: u.name,
              role: u.role
            })));
          }
        } catch (e) {
          console.warn("portal_users table fetch failed, running in fallback mode:", e);
        }

      } catch (err) {
        console.error("Failed to load initial data from Supabase:", err);
      } finally {
        setIsDbLoading(false);
      }
    };
    loadData();
  }, []);

  // Write changes back to Supabase
  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    const syncUsers = async () => {
      try {
        const rows = users.map(u => ({
          id: u.id,
          email: u.email,
          password: u.password,
          name: u.name,
          role: u.role
        }));
        if (rows.length > 0) {
          await supabase.from('portal_users').upsert(rows);
        }
      } catch (e) {
        console.warn("portal_users sync failed:", e);
      }
    };
    syncUsers();
  }, [users, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    supabase.from('config_settings').upsert({ key: 'products', value: products })
      .then(({ error }) => { if (error) console.error("Supabase sync products failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
  }, [products, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    supabase.from('config_settings').upsert({ key: 'company_config', value: companyConfig })
      .then(({ error }) => { if (error) console.error("Supabase sync company_config failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
  }, [companyConfig, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    supabase.from('config_settings').upsert({ key: 'vendors_config', value: vendorsConfig })
      .then(({ error }) => { if (error) console.error("Supabase sync vendors_config failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
  }, [vendorsConfig, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    supabase.from('config_settings').upsert({ key: 'safety_thresholds', value: safetyThresholds })
      .then(({ error }) => { if (error) console.error("Supabase sync safety_thresholds failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
  }, [safetyThresholds, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    supabase.from('config_settings').upsert({ key: 'easyecom_config', value: easyEcomConfig })
      .then(({ error }) => { if (error) console.error("Supabase sync easyecom_config failed. Details:", error); });
  }, [easyEcomConfig, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    if (batches.length > 0) {
      supabase.from('batches').upsert(batches.map(mapUIBatch))
        .then(({ error }) => { if (error) console.error("Supabase sync batches failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
    }
  }, [batches, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    if (purchaseOrders.length > 0) {
      supabase.from('purchase_orders').upsert(purchaseOrders.map(mapUIPO))
        .then(({ error }) => { if (error) console.error("Supabase sync purchase_orders failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
    }
  }, [purchaseOrders, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    if (invoices.length > 0) {
      supabase.from('invoices').upsert(invoices.map(mapUIInvoice))
        .then(({ error }) => { if (error) console.error("Supabase sync invoices failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
    }
  }, [invoices, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    const syncInventory = async () => {
      const rows = Object.entries(inventory).map(([item_name, quantity]) => ({
        item_name,
        quantity
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('inventory').upsert(rows);
        if (error) console.error("Supabase sync inventory failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error);
      }
    };
    syncInventory();
  }, [inventory, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    const syncCFs = async () => {
      await supabase.from('carry_forwards').delete().neq('id', 'placeholder');
      if (carryForwards.length > 0) {
        const { error } = await supabase.from('carry_forwards').insert(carryForwards.map(cf => ({
          id: cf.id,
          product_id: cf.productId,
          item_type: cf.itemType,
          quantity: cf.quantity,
          source_po_id: cf.sourcePOId,
          source_po_number: cf.sourcePONumber
        })));
        if (error) console.error("Supabase sync carry_forwards failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error);
      }
    };
    syncCFs();
  }, [carryForwards, isDbLoading]);

  useEffect(() => {
    if (!hasSupabase || isDbLoading) return;
    if (notifications.length > 0) {
      supabase.from('notifications').upsert(notifications.map(n => ({
        id: n.id,
        text: n.text,
        date: n.timestamp,
        category: n.category || 'alert',
        read: n.read
      })))
      .then(({ error }) => { if (error) console.error("Supabase sync notifications failed. If RLS is enabled, please verify public read/write access policies are created. Details:", error); });
    }
  }, [notifications, isDbLoading]);

  // Product Management
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Batch & PO Creation (Multi-Role Flow with carry forward selection)
  const createBatch = (batchData, cfQuantitiesMap = {}) => {
    const selectedCFIds = Object.keys(cfQuantitiesMap);
    const batchId = `B-${Math.floor(100 + Math.random() * 900)}`;
    
    // Support multi-product checklist
    const productsList = batchData.productsList || [
      { productId: batchData.productId, targetQuantity: Number(batchData.targetQuantity) }
    ];

    const poIds = [];
    const newPOs = [];

    // Gather all line items across all products
    const itemsByVendor = {};

    productsList.forEach((prodItem) => {
      const product = products.find((p) => p.id === prodItem.productId);
      if (!product) return;

      product.lifecycle.forEach((step, idx) => {
        // Filter matching selected carry forwards for this specific product
        const matchingCFs = carryForwards.filter(
          (cf) =>
            selectedCFIds.includes(cf.id) &&
            cf.productId === product.id &&
            cf.vendor === step.vendor &&
            cf.itemType === step.itemType
        );
        const cfQty = matchingCFs.reduce((sum, cf) => sum + (cfQuantitiesMap[cf.id] || cf.quantity), 0);
        const baseQty = Number(prodItem.targetQuantity);
        const orderedQuantity = baseQty + cfQty;

        const cfDetails = matchingCFs
          .map((cf) => `${cfQuantitiesMap[cf.id] || cf.quantity} units from PO ${cf.sourcePONumber}`)
          .join(', ');

        const cfNote = cfQty > 0 ? `Included carried-forward quantity for ${product.name} (${step.itemType}): ${cfDetails}.` : '';
        const itemCost = orderedQuantity * step.defaultUnitPrice;

        const lineItem = {
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}-${newPOs.length}-${idx}`,
          productId: product.id,
          itemType: step.itemType,
          orderedQuantity,
          balanceQuantity: orderedQuantity,
          unitPrice: step.defaultUnitPrice,
          totalAmount: itemCost,
          carriedForwardQty: cfQty > 0 ? cfQty : undefined,
          carryForwardFromPOId: matchingCFs.length > 0 ? matchingCFs[0].sourcePOId : undefined,
          carryForwardDetailStr: cfQty > 0 ? cfDetails : undefined,
          cfNote
        };

        if (!itemsByVendor[step.vendor]) {
          itemsByVendor[step.vendor] = [];
        }
        itemsByVendor[step.vendor].push(lineItem);
      });
    });

    // Consolidate duplicate itemTypes (unless Finished Goods) for each vendor
    Object.keys(itemsByVendor).forEach((vendor) => {
      const items = itemsByVendor[vendor];
      const consolidated = [];
      const grouped = {};

      items.forEach((item) => {
        const key = item.itemType === 'Finished Goods' ? `${item.itemType}-${item.productId}` : item.itemType;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });

      Object.keys(grouped).forEach((key) => {
        const list = grouped[key];
        if (list.length === 1) {
          consolidated.push(list[0]);
        } else {
          const first = list[0];
          const totalOrdered = list.reduce((sum, i) => sum + i.orderedQuantity, 0);
          const totalAmt = list.reduce((sum, i) => sum + i.totalAmount, 0);
          const avgUnitPrice = Number((totalAmt / totalOrdered).toFixed(2));
          
          const totalCFQty = list.reduce((sum, i) => sum + (i.carriedForwardQty || 0), 0);
          const cfDetails = list.map(i => i.carryForwardDetailStr).filter(Boolean).join(', ');
          const cfNotes = list.map(i => i.cfNote).filter(Boolean).join('\n');
          
          consolidated.push({
            id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}-merged-${first.itemType.replace(/\s+/g, '_')}`,
            productId: null,
            itemType: first.itemType,
            orderedQuantity: totalOrdered,
            balanceQuantity: totalOrdered,
            unitPrice: avgUnitPrice,
            totalAmount: totalAmt,
            carriedForwardQty: totalCFQty > 0 ? totalCFQty : undefined,
            carryForwardFromPOId: list.find(i => i.carryForwardFromPOId)?.carryForwardFromPOId,
            carryForwardDetailStr: cfDetails || undefined,
            cfNote: cfNotes || ''
          });
        }
      });

      itemsByVendor[vendor] = consolidated;
    });

    // Group by vendor and create combined POs
    const vendorKeys = Object.keys(itemsByVendor);
    vendorKeys.forEach((vendor) => {
      const poId = `PO-${Math.floor(200 + Math.random() * 800) + newPOs.length}`;
      poIds.push(poId);

      const vendorItems = itemsByVendor[vendor];
      const totalOrderedQty = vendorItems.reduce((sum, item) => sum + item.orderedQuantity, 0);
      const totalAmount = vendorItems.reduce((sum, item) => sum + item.totalAmount, 0);
      
      // Gather notes
      const opNote = batchData.notes ? `Operations Note: ${batchData.notes}` : '';
      const cfNotes = vendorItems.map(item => item.cfNote).filter(Boolean).join('\n');
      const combinedNotes = [cfNotes, opNote].filter(Boolean).join('\n');

      const combinedItemTypes = vendorItems.map(item => item.itemType).filter((v, i, a) => a.indexOf(v) === i).join(', ');

      newPOs.push({
        id: poId,
        batchId,
        productId: vendorItems[0]?.productId || null,
        poNumber: `PO-REQ-${poId.slice(-3)}`,
        vendor,
        itemType: combinedItemTypes,
        orderedQuantity: totalOrderedQty,
        balanceQuantity: totalOrderedQty,
        unitPrice: vendorItems[0]?.unitPrice || 0,
        totalAmount,
        startDate: batchData.startDate,
        endDate: batchData.endDate,
        status: 'Requested',
        invoiceIds: [],
        notes: combinedNotes,
        pdfName: null,
        pdfUrl: null,
        itemsList: vendorItems
      });
    });

    const firstProd = productsList[0] || { productId: '', targetQuantity: 0 };
    const aggregateQty = productsList.reduce((sum, p) => sum + p.targetQuantity, 0);

    // Create the batch object
    const newBatch = {
      id: batchId,
      name: batchData.name || `Batch #${batchId.slice(-3)} - Multi-Product`,
      productId: firstProd.productId,
      targetQuantity: aggregateQty,
      productsList,
      status: 'Draft',
      startDate: batchData.startDate,
      endDate: batchData.endDate,
      poIds,
      notes: batchData.notes || ''
    };

    // Update state
    setBatches((prev) => [newBatch, ...prev]);
    setPurchaseOrders((prev) => [...newPOs, ...prev]);

    // Update or clear carry forwards that were consumed
    setCarryForwards((prev) =>
      prev
        .map((cf) => {
          if (selectedCFIds.includes(cf.id)) {
            const consumed = cfQuantitiesMap[cf.id] || cf.quantity;
            const remaining = cf.quantity - consumed;
            if (remaining > 0) {
              return { ...cf, quantity: remaining };
            } else {
              return null; // completely consumed
            }
          }
          return cf;
        })
        .filter(Boolean)
    );

    // Trigger Notification for PO requests raised
    const notifId = `notif-${Date.now()}`;
    const timestampStr = getLocalDateStr() + ' ' + new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'});
    const prodNames = productsList
      .map((pi) => products.find((p) => p.id === pi.productId)?.name)
      .filter(Boolean)
      .join(', ');

    const newNotif = {
      id: notifId,
      text: `New PO Requests raised by Operations for ${newBatch.name} (${prodNames}). Awaiting Accounts approval and PDF generation.`,
      timestamp: timestampStr,
      read: false,
      batchId
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return batchId;
  };

  const createSinglePO = (poData) => {
    const poId = `PO-${Math.floor(200 + Math.random() * 800)}`;
    const orderedQuantity = Number(poData.orderedQuantity);
    const unitPrice = Number(poData.unitPrice);
    const totalAmount = orderedQuantity * unitPrice;
    const batchId = poData.batchId || null;

    const newPO = {
      id: poId,
      batchId,
      productId: poData.productId || null,
      poNumber: `PO-REQ-${poId.slice(-3)}`,
      vendor: poData.vendor,
      itemType: poData.itemType,
      orderedQuantity,
      balanceQuantity: orderedQuantity,
      unitPrice,
      totalAmount,
      startDate: poData.startDate,
      endDate: poData.endDate,
      status: 'Requested',
      invoiceIds: [],
      notes: poData.notes || '',
      pdfName: null,
      pdfUrl: null,
      itemsList: [{
        id: `${poId}-item-0`,
        productId: poData.productId || null,
        itemType: poData.itemType,
        orderedQuantity,
        balanceQuantity: orderedQuantity,
        unitPrice,
        totalAmount
      }]
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    if (batchId) {
      setBatches((prevBatches) =>
        prevBatches.map((b) => {
          if (b.id === batchId) {
            return {
              ...b,
              poIds: [...(b.poIds || []), poId]
            };
          }
          return b;
        })
      );
    }

    // Trigger Notification for PO request raised
    const notifId = `notif-${Date.now()}`;
    const timestampStr = getLocalDateStr() + ' ' + new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'});
    const newNotif = {
      id: notifId,
      text: batchId 
        ? `New PO Request manually raised for Batch ${batchId} (${newPO.itemType} from ${newPO.vendor}). Awaiting Accounts approval.`
        : `New Standalone PO Request raised by Operations for ${newPO.itemType} (${newPO.vendor}). Awaiting Accounts approval.`,
      timestamp: timestampStr,
      read: false,
      poId
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return poId;
  };

  const deleteBatch = async (batchId) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    // Also delete associated POs & Invoices
    setPurchaseOrders((prev) => prev.filter((po) => po.batchId !== batchId));
    setInvoices((prev) => prev.filter((inv) => inv.batchId !== batchId));

    if (hasSupabase) {
      try {
        await supabase.from('invoices').delete().eq('batch_id', batchId);
        await supabase.from('purchase_orders').delete().eq('batch_id', batchId);
        await supabase.from('batches').delete().eq('id', batchId);
      } catch (e) {
        console.error("Failed to delete batch and its associations from Supabase:", e);
      }
    }
  };

  const deletePO = async (poId) => {
    const associatedInvoices = invoices.filter((inv) => inv.poId === poId);
    
    // Reverse inventory for all associated invoices
    setInventory((prev) => {
      const updated = { ...prev };
      associatedInvoices.forEach((inv) => {
        const invoiceItemsList = inv.itemsList || [];
        invoiceItemsList.forEach((invItem) => {
          let stockItemKey = '';
          if (invItem.itemType === 'Finished Goods') {
            const prod = products.find((p) => p.id === invItem.productId);
            stockItemKey = prod ? prod.name : '';
          } else {
            stockItemKey = invItem.itemType;
          }
          if (stockItemKey && updated[stockItemKey] !== undefined) {
            updated[stockItemKey] = Math.max(0, updated[stockItemKey] - invItem.quantityDelivered);
          }
        });
      });
      return updated;
    });

    setPurchaseOrders((prev) => prev.filter((po) => po.id !== poId));
    setInvoices((prev) => prev.filter((inv) => inv.poId !== poId));

    if (hasSupabase) {
      try {
        await supabase.from('invoices').delete().eq('po_id', poId);
        await supabase.from('purchase_orders').delete().eq('id', poId);
      } catch (e) {
        console.error("Failed to delete PO and its invoices from Supabase:", e);
      }
    }
  };

  const deleteInvoice = async (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const po = purchaseOrders.find((p) => p.id === inv.poId);
    const invoiceItemsList = inv.itemsList || [];

    // 1. Subtract quantities from Inventory
    setInventory((prev) => {
      const updated = { ...prev };
      invoiceItemsList.forEach((invItem) => {
        let stockItemKey = '';
        if (invItem.itemType === 'Finished Goods') {
          const prod = products.find((p) => p.id === invItem.productId);
          stockItemKey = prod ? prod.name : '';
        } else {
          stockItemKey = invItem.itemType;
        }
        if (stockItemKey && updated[stockItemKey] !== undefined) {
          updated[stockItemKey] = Math.max(0, updated[stockItemKey] - invItem.quantityDelivered);
        }
      });
      return updated;
    });

    // 2. Restore PO balance quantities and status
    if (po) {
      setPurchaseOrders((prev) =>
        prev.map((p) => {
          if (p.id === po.id) {
            const restoredItemsList = (p.itemsList || []).map(item => {
              const deliveredItem = invoiceItemsList.find(i => i.productId === item.productId && i.itemType === item.itemType);
              const delQty = deliveredItem ? deliveredItem.quantityDelivered : 0;
              const restoredBal = Math.min(item.orderedQuantity, item.balanceQuantity + delQty);
              return {
                ...item,
                balanceQuantity: restoredBal
              };
            });

            const totalBalance = restoredItemsList.reduce((sum, item) => sum + item.balanceQuantity, 0);
            const totalOrdered = restoredItemsList.reduce((sum, item) => sum + item.orderedQuantity, 0);
            
            let newStatus = 'Partially Served';
            if (totalBalance === totalOrdered) {
              newStatus = 'Sent';
            } else if (totalBalance === 0) {
              newStatus = 'Fully Served';
            }

            const updatedInvoiceIds = (p.invoiceIds || []).filter(id => id !== invoiceId);

            return {
              ...p,
              itemsList: restoredItemsList,
              balanceQuantity: totalBalance,
              status: newStatus,
              invoiceIds: updatedInvoiceIds
            };
          }
          return p;
        })
      );
    }

    // 3. Remove invoice from state
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));

    // 4. Delete from Supabase
    if (hasSupabase) {
      try {
        await supabase.from('invoices').delete().eq('id', invoiceId);
      } catch (e) {
        console.error("Failed to delete invoice from Supabase:", e);
      }
    }
  };


  // PO Actions
  const updatePO = (poId, fields) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          const orderedQuantity = fields.orderedQuantity !== undefined ? Number(fields.orderedQuantity) : po.orderedQuantity;
          const unitPrice = fields.unitPrice !== undefined ? Number(fields.unitPrice) : po.unitPrice;
          
          return {
            ...po,
            ...fields,
            orderedQuantity,
            unitPrice,
            totalAmount: orderedQuantity * unitPrice,
            // Only update balance quantity if ordered quantity changed and no invoices are logged yet
            balanceQuantity: po.invoiceIds.length === 0 ? orderedQuantity : po.balanceQuantity
          };
        }
        return po;
      })
    );
  };

  const deductRawMaterialsForBatch = (batch) => {
    setInventory((prev) => {
      const updated = { ...prev };
      const productsList = batch.productsList || [
        { productId: batch.productId, targetQuantity: batch.targetQuantity }
      ];

      productsList.forEach((prodItem) => {
        const product = products.find((p) => p.id === prodItem.productId);
        if (!product) return;

        product.lifecycle.forEach((step) => {
          if (step.itemType !== 'Finished Goods') {
            const itemKey = step.itemType;
            const quantityToDeduct = Number(prodItem.targetQuantity);
            updated[itemKey] = Math.max(0, (updated[itemKey] || 0) - quantityToDeduct);
          }
        });
      });
      return updated;
    });
  };

  const dispatchPO = (poId) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          return {
            ...po,
            status: 'Sent'
          };
        }
        return po;
      })
    );

    // If batch status is Draft, move it to In Production
    setPurchaseOrders((allPOs) => {
      const po = allPOs.find(p => p.id === poId);
      if (po) {
        setBatches(prevBatches =>
          prevBatches.map(b => {
            if (b.id === po.batchId && b.status === 'Draft') {
              deductRawMaterialsForBatch(b);
              return { ...b, status: 'In Production' };
            }
            return b;
          })
        );
      }
      return allPOs;
    });
  };

  // Log Invoice & Serve PO
  const addInvoice = (poId, invoiceData) => {
    const invoiceId = `INV-${Math.floor(300 + Math.random() * 700)}`;
    const po = purchaseOrders.find((p) => p.id === poId);

    if (!po) return;

    const invoiceItemsList = invoiceData.itemsList || [{
      productId: po.productId || null,
      itemType: po.itemType,
      quantityDelivered: Number(invoiceData.quantityDelivered),
      unitPrice: po.unitPrice,
      totalAmount: Number(invoiceData.quantityDelivered) * po.unitPrice
    }];

    const totalQtyDelivered = invoiceItemsList.reduce((sum, item) => sum + item.quantityDelivered, 0);
    const totalInvoiceAmt = invoiceItemsList.reduce((sum, item) => sum + item.totalAmount, 0);

    const newInvoice = {
      id: invoiceId,
      poId,
      batchId: po.batchId,
      invoiceNumber: invoiceData.invoiceNumber || `INV-${invoiceId.slice(-3)}`,
      invoiceDate: invoiceData.invoiceDate || getLocalDateStr(),
      quantityDelivered: totalQtyDelivered,
      unitPrice: invoiceItemsList[0]?.unitPrice || po.unitPrice, // fallback
      invoiceAmount: totalInvoiceAmt,
      logistics: invoiceData.logistics || '',
      destination: invoiceData.destination || '',
      notes: invoiceData.notes || '',
      pdfName: invoiceData.pdfName || null,
      pdfUrl: invoiceData.pdfUrl || null,
      itemsList: invoiceItemsList
    };

    // Update PO state
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id === poId) {
          const updatedItemsList = (p.itemsList || []).map(item => {
            const deliveredItem = invoiceItemsList.find(i => i.productId === item.productId && i.itemType === item.itemType);
            const delQty = deliveredItem ? deliveredItem.quantityDelivered : 0;
            const newBal = Math.max(0, item.balanceQuantity - delQty);
            return {
              ...item,
              balanceQuantity: newBal
            };
          });

          const totalBalance = updatedItemsList.reduce((sum, item) => sum + item.balanceQuantity, 0);
          const newStatus = totalBalance === 0 ? 'Fully Served' : 'Partially Served';

          return {
            ...p,
            itemsList: updatedItemsList,
            balanceQuantity: totalBalance,
            status: newStatus,
            invoiceIds: [...p.invoiceIds, invoiceId]
          };
        }
        return p;
      })
    );

    // Update Inventory
    setInventory((prev) => {
      const updated = { ...prev };
      invoiceItemsList.forEach(invItem => {
        let stockItemKey = '';
        if (invItem.itemType === 'Finished Goods') {
          const prod = products.find((p) => p.id === invItem.productId);
          stockItemKey = prod ? prod.name : 'Unknown Product';
        } else {
          stockItemKey = invItem.itemType;
        }
        updated[stockItemKey] = (updated[stockItemKey] || 0) + invItem.quantityDelivered;
      });
      return updated;
    });

    // Update Invoice state
    setInvoices((prev) => [newInvoice, ...prev]);

    // Check if all POs for this batch are served. If so, mark batch as Completed
    setTimeout(() => {
      setPurchaseOrders((currentPOs) => {
        const batchPOs = currentPOs.filter((p) => p.batchId === po.batchId);
        const allCompleted = batchPOs.every((p) => p.status === 'Fully Served' || p.status === 'Closed');
        
        if (allCompleted) {
          setBatches((prevBatches) =>
            prevBatches.map((b) => (b.id === po.batchId ? { ...b, status: 'Completed' } : b))
          );
        }
        return currentPOs;
      });
    }, 100);

    return invoiceId;
  };

  // Serve and Close PO with optional Carry Forward
  const closePO = (poId, shouldCarryForward) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          // If carry forward is checked, register the remaining balance in carry forward pool
          if (shouldCarryForward && po.balanceQuantity > 0) {
            if (po.itemsList && po.itemsList.length > 0) {
              const newCFs = [];
              po.itemsList.forEach((item, index) => {
                if (item.balanceQuantity > 0) {
                  const product = products.find(p => p.id === item.productId);
                  const productName = product ? product.name : undefined;
                  newCFs.push({
                    id: `cf-${Date.now()}-${Math.floor(100 + Math.random() * 900)}-${index}`,
                    productId: item.productId,
                    productName,
                    vendor: po.vendor,
                    itemType: item.itemType,
                    quantity: item.balanceQuantity,
                    sourcePOId: po.id,
                    sourcePONumber: po.poNumber
                  });
                }
              });
              if (newCFs.length > 0) {
                setCarryForwards((prevCF) => [...prevCF, ...newCFs]);
              }
            } else {
              const batch = batches.find(b => b.id === po.batchId);
              const productId = po.productId || (batch ? batch.productId : undefined);
              const product = products.find(p => p.id === productId);
              const productName = product ? product.name : undefined;

              const newCF = {
                id: `cf-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
                productId,
                productName,
                vendor: po.vendor,
                itemType: po.itemType,
                quantity: po.balanceQuantity,
                sourcePOId: po.id,
                sourcePONumber: po.poNumber
              };
              setCarryForwards((prevCF) => [...prevCF, newCF]);
            }
          }

          return {
            ...po,
            status: 'Closed' // Mark closed
          };
        }
        return po;
      })
    );

    // Check if batch can be marked completed
    setTimeout(() => {
      setPurchaseOrders((currentPOs) => {
        const targetPO = currentPOs.find((p) => p.id === poId);
        if (!targetPO) return currentPOs;

        const batchPOs = currentPOs.filter((p) => p.batchId === targetPO.batchId);
        const allCompleted = batchPOs.every((p) => p.status === 'Fully Served' || p.status === 'Closed');
        
        if (allCompleted) {
          setBatches((prevBatches) =>
            prevBatches.map((b) => (b.id === targetPO.batchId ? { ...b, status: 'Completed' } : b))
          );
        }
        return currentPOs;
      });
    }, 100);
  };

  // Generate & Upload PO from request (Accounts team action)
  const generatePO = (poId, fields) => {
    let targetPONumber = '';
    let absorbedNotesList = [];

    // 1. Process absorptions
    const absorptions = fields.absorptionsList || (fields.absorbFromPOId ? [{
      absorbFromPOId: fields.absorbFromPOId,
      absorbedQty: fields.absorbedQty,
      absorbProductId: fields.absorbProductId,
      absorbItemType: fields.absorbItemType,
      absorbPONumber: fields.absorbPONumber
    }] : []);

    absorptions.forEach(abs => {
      setPurchaseOrders((prev) =>
        prev.map((po) => {
          if (po.id === abs.absorbFromPOId) {
            const finalAbsorbedQty = Number(abs.absorbedQty !== undefined ? abs.absorbedQty : po.balanceQuantity);
            const remainingBalance = Math.max(0, po.balanceQuantity - finalAbsorbedQty);
            const isFullyServed = remainingBalance === 0;
            absorbedNotesList.push(`Absorbed ${finalAbsorbedQty} units from PO ${po.poNumber} for ${abs.absorbItemType}.`);
            
            const updatedItemsList = po.itemsList ? po.itemsList.map(item => {
              if (item.itemType === abs.absorbItemType && item.productId === abs.absorbProductId) {
                const itemRem = Math.max(0, item.balanceQuantity - finalAbsorbedQty);
                return { ...item, balanceQuantity: itemRem };
              }
              return item;
            }) : undefined;

            return {
              ...po,
              balanceQuantity: remainingBalance,
              status: isFullyServed ? 'Fully Served' : po.status,
              itemsList: updatedItemsList || po.itemsList,
              notes: (po.notes ? po.notes + '\n' : '') + `Absorbed ${finalAbsorbedQty} units into PO ${fields.poNumber || ''}.`
            };
          }
          return po;
        })
      );
    });

    // 2. Update the target PO
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          targetPONumber = fields.poNumber || po.poNumber;
          const accountsNote = fields.notes ? `\nAccounts Note: ${fields.notes}` : '';
          
          let updatedItemsList = fields.itemsList || po.itemsList || [];
          
          // Apply absorptions to target itemsList
          absorptions.forEach(abs => {
            updatedItemsList = updatedItemsList.map(item => {
              if (item.productId === abs.absorbProductId && item.itemType === abs.absorbItemType) {
                // If not already adjusted, we adjust it
                const originalQty = item.orderedQuantity;
                const newQty = Math.max(0, originalQty - Number(abs.absorbedQty));
                return {
                  ...item,
                  orderedQuantity: newQty,
                  balanceQuantity: newQty,
                  totalAmount: newQty * item.unitPrice,
                  carriedForwardQty: Number(abs.absorbedQty),
                  carryForwardFromPOId: abs.absorbFromPOId,
                  carryForwardDetailStr: `${abs.absorbedQty} units from PO ${abs.absorbPONumber}`
                };
              }
              return item;
            });
          });

          const totalOrdered = updatedItemsList.reduce((sum, item) => sum + item.orderedQuantity, 0);
          const totalAmount = updatedItemsList.reduce((sum, item) => sum + item.totalAmount, 0);
          
          const finalNotes = [
            po.notes,
            ...absorbedNotesList,
            accountsNote ? `Accounts Note: ${fields.notes}` : ''
          ].filter(Boolean).join('\n');

          return {
            ...po,
            poNumber: targetPONumber,
            vendor: fields.vendor !== undefined ? fields.vendor : po.vendor,
            startDate: fields.startDate !== undefined ? fields.startDate : po.startDate,
            endDate: fields.endDate !== undefined ? fields.endDate : po.endDate,
            status: 'Ready', // Approved by accounts
            pdfName: fields.pdfName || `PO_${targetPONumber}.pdf`,
            pdfUrl: '#',
            notes: finalNotes,
            itemsList: updatedItemsList,
            orderedQuantity: totalOrdered,
            balanceQuantity: totalOrdered,
            totalAmount: totalAmount,
            itemType: updatedItemsList.map(item => item.itemType).filter((v, i, a) => a.indexOf(v) === i).join(', ')
          };
        }
        return po;
      })
    );

    // Notify Operations
    setTimeout(() => {
      setPurchaseOrders((currentPOs) => {
        const po = currentPOs.find(p => p.id === poId);
        if (po) {
          const notifId = `notif-${Date.now()}`;
          const timestampStr = getLocalDateStr() + ' ' + new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'});
          const newNotif = {
            id: notifId,
            text: `PO approved & ready to send: ${po.poNumber} for ${po.itemType} (${po.vendor}) has been edited and completed by Accounts.`,
            timestamp: timestampStr,
            read: false,
            poId
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
        return currentPOs;
      });
    }, 100);
  };

  // Update PO Notes
  const updatePONotes = (poId, newNotes) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          return { ...po, notes: newNotes };
        }
        return po;
      })
    );
  };

  // Update Invoice Notes
  const updateInvoiceNotes = (invoiceId, newNotes) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return { ...inv, notes: newNotes };
        }
        return inv;
      })
    );
  };

  // Notification Helpers
  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Adjust Stock manually
  const adjustStock = (itemKey, quantityChange) => {
    setInventory((prev) => ({
      ...prev,
      [itemKey]: Math.max(0, (prev[itemKey] || 0) + Number(quantityChange))
    }));
  };

  // Sync inventory from EasyEcom
  const syncInventoryFromEasyEcom = async () => {
    if (!easyEcomConfig.isEnabled || !easyEcomConfig.xApiKey || !easyEcomConfig.jwtToken) {
      throw new Error("EasyEcom integration is not fully configured or enabled.");
    }

    if (easyEcomConfig.xApiKey === 'sandbox' || easyEcomConfig.jwtToken === 'sandbox' || easyEcomConfig.xApiKey === 'test' || easyEcomConfig.jwtToken === 'test') {
      // Simulate EasyEcom response for testing
      setInventory(prev => {
        const updated = { ...prev };
        products.forEach(prod => {
          updated[prod.name] = Math.floor(100 + Math.random() * 400);
        });
        return updated;
      });

      const timestamp = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      }) + " (Sandbox Mode)";
      setEasyEcomLastSync(timestamp);
      return true;
    }

    const targetUrl = 'https://api.easyecom.io/v2/inventory/details';
    const requestUrl = easyEcomConfig.proxyUrl 
      ? `${easyEcomConfig.proxyUrl.endsWith('/') ? easyEcomConfig.proxyUrl : easyEcomConfig.proxyUrl + '/'}${targetUrl}`
      : targetUrl;

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'x-api-key': easyEcomConfig.xApiKey,
        'Authorization': `Bearer ${easyEcomConfig.jwtToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`EasyEcom API error: ${response.status} - ${errText || response.statusText}`);
    }

    const resJson = await response.json();
    const data = resJson.data || resJson.inventory || (Array.isArray(resJson) ? resJson : []);
    if (!Array.isArray(data)) {
      throw new Error("Invalid response format from EasyEcom (expected an array under 'data').");
    }

    const skuStockMap = {};
    data.forEach(item => {
      if (item && typeof item === 'object') {
        const skuCode = (item.sku || item.sku_code || item.item_code || '').trim().toUpperCase();
        const qty = Number(
          item.available_stock !== undefined ? item.available_stock : 
          (item.quantity !== undefined ? item.quantity : 
          (item.available_quantity !== undefined ? item.available_quantity : 
          (item.qty !== undefined ? item.qty : 0)))
        );
        if (skuCode) {
          skuStockMap[skuCode] = qty;
        }
      }
    });

    setInventory(prev => {
      const updated = { ...prev };
      products.forEach(prod => {
        if (prod.sku) {
          const finishedGoodsSku = prod.sku.trim().toUpperCase();
          if (skuStockMap[finishedGoodsSku] !== undefined) {
            updated[prod.name] = skuStockMap[finishedGoodsSku];
          }
        }
      });
      return updated;
    });

    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
    setEasyEcomLastSync(timestamp);
    return true;
  };

  // Dynamically compute real-time alerts and warnings
  const warnings = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getLocalDate = (dateStr) => {
      if (!dateStr) return new Date();
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // 1. Low Stock Warnings
    const rawMaterialsKeys = [
      'Jar & Lid', 'Canister', 'Bottle & Pump',
      'Beak pump', 'Hope bottle', '100 gm Clear Glass Jar with matte white cap',
      'Collagen Canisters unflavoured collagen', 'Collagen Canisters Reglow (Passion Fruit)',
      'Canister for Multi For Him', 'Canister for Multi For Her', 'Canister for Triphase Release IronPulse',
      'SINGLE COLOR PRINTED BOPP TAPES', 'Courier Bags', 'Label for Mag 5Xup'
    ];
    Object.entries(inventory).forEach(([item, qty]) => {
      const isRaw = rawMaterialsKeys.includes(item);
      const threshold = safetyThresholds[item] !== undefined ? safetyThresholds[item] : (isRaw ? 500 : 150);
      if (qty < threshold) {
        list.push({
          id: `warn-low-stock-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          type: 'low_stock',
          title: `Low Stock Alert: ${item}`,
          subtitle: `Current: ${qty} units (Threshold: ${threshold})`,
          description: `The stock level for "${item}" is currently ${qty} units, which is below the safety threshold of ${threshold} units. Replenish this item to avoid production interruptions.`,
          severity: qty < (threshold / 2) ? 'high' : 'medium',
          referenceId: item,
          actionText: 'Adjust Stock / Order',
          actionTab: 'inventory'
        });
      }
    });

    // 2. Expired PO Warnings
    purchaseOrders.forEach(po => {
      if (['Fully Served', 'Closed', 'Draft', 'Requested'].includes(po.status)) return;
      if (!po.endDate) return;
      const poDate = getLocalDate(po.endDate);
      if (poDate < today) {
        const diffTime = today - poDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        list.push({
          id: `warn-expired-po-${po.id}`,
          type: 'expired_po',
          title: `Purchase Order Expired: ${po.poNumber}`,
          subtitle: `${po.vendor} • Overdue by ${diffDays} day${diffDays === 1 ? '' : 's'}`,
          description: `Purchase Order ${po.poNumber} for "${po.itemType}" from supplier "${po.vendor}" was scheduled for delivery on ${po.endDate}. It is currently ${diffDays} day${diffDays === 1 ? '' : 's'} overdue and has not been fully served or closed.`,
          severity: 'high',
          referenceId: po.id,
          actionText: 'Manage Purchase Orders',
          actionTab: 'pos'
        });
      }
    });

    // 3. Due Date Near Warnings (POs & Active Batches within 3 days)
    purchaseOrders.forEach(po => {
      if (['Fully Served', 'Closed', 'Draft', 'Requested'].includes(po.status)) return;
      if (!po.endDate) return;
      const poDate = getLocalDate(po.endDate);
      const diffTime = poDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 3) {
        list.push({
          id: `warn-near-po-${po.id}`,
          type: 'due_near',
          title: `PO Due Date Approaching: ${po.poNumber}`,
          subtitle: `${po.vendor} • Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
          description: `Delivery for Purchase Order ${po.poNumber} (${po.itemType}) from "${po.vendor}" is expected on ${po.endDate} (in ${diffDays} day${diffDays === 1 ? '' : 's'}). Monitor shipment status.`,
          severity: 'medium',
          referenceId: po.id,
          actionText: 'Manage Purchase Orders',
          actionTab: 'pos'
        });
      }
    });

    batches.forEach(b => {
      if (b.status === 'Completed') return;
      if (!b.endDate) return;
      const bDate = getLocalDate(b.endDate);
      const diffTime = bDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 3) {
        list.push({
          id: `warn-near-batch-${b.id}`,
          type: 'due_near',
          title: `Batch Production Deadline Near: ${b.name}`,
          subtitle: `Deadline: ${b.endDate} (in ${diffDays} day${diffDays === 1 ? '' : 's'})`,
          description: `Active production run "${b.name}" has its completion date set to ${b.endDate}, which is in ${diffDays} day${diffDays === 1 ? '' : 's'}. Verify that all active POs are serving this run.`,
          severity: 'medium',
          referenceId: b.id,
          actionText: 'Production Batches',
          actionTab: 'batches'
        });
      }
    });

    return list;
  }, [inventory, purchaseOrders, batches, safetyThresholds]);

  // Authentication & User Management Helper Functions
  const login = (email, password) => {
    const matched = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (matched) {
      setCurrentUser(matched);
      // Automatically switch simulated role to the user's role
      setRole(matched.role);
      return { success: true };
    }
    return { success: false, message: 'Invalid email or password.' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = async (userData) => {
    const newId = `u-${Date.now()}`;
    const newUser = { id: newId, ...userData };
    setUsers((prev) => [...prev, newUser]);
  };

  const deleteUser = async (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (hasSupabase) {
      try {
        await supabase.from('portal_users').delete().eq('id', userId);
      } catch (e) {
        console.warn("Failed to delete user from Supabase:", e);
      }
    }
  };

  // Clear Database (Clean Slate)
  const clearDatabase = async () => {
    setBatches([]);
    setPurchaseOrders([]);
    setInvoices([]);
    setCarryForwards([]);
    setNotifications([]);
    
    // Reset configs and states to new defaults
    setProducts(DEFAULT_PRODUCTS);
    setVendorsConfig(DEFAULT_VENDORS_CONFIG);
    setSafetyThresholds(DEFAULT_THRESHOLDS);
    setDeliveryDestinations(DEFAULT_DESTINATIONS);
    const defaultEasyEcom = {
      isEnabled: false,
      xApiKey: '',
      jwtToken: '',
      proxyUrl: 'https://cors-anywhere.herokuapp.com/'
    };
    setEasyEcomConfig(defaultEasyEcom);
    setEasyEcomLastSync(null);
    
    const clearedInventory = {};
    Object.keys(DEFAULT_INVENTORY).forEach((key) => {
      clearedInventory[key] = 0;
    });
    setInventory(clearedInventory);

    // Save to local storage
    localStorage.setItem('yhl_products', JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem('yhl_vendors_config', JSON.stringify(DEFAULT_VENDORS_CONFIG));
    localStorage.setItem('yhl_safety_thresholds', JSON.stringify(DEFAULT_THRESHOLDS));
    localStorage.setItem('yhl_delivery_destinations', JSON.stringify(DEFAULT_DESTINATIONS));
    localStorage.setItem('yhl_easyecom_config', JSON.stringify(defaultEasyEcom));
    localStorage.removeItem('yhl_easyecom_last_sync');
    localStorage.setItem('yhl_inventory', JSON.stringify(clearedInventory));

    if (hasSupabase) {
      try {
        await supabase.from('batches').delete().neq('id', 'placeholder');
        await supabase.from('purchase_orders').delete().neq('id', 'placeholder');
        await supabase.from('invoices').delete().neq('id', 'placeholder');
        await supabase.from('carry_forwards').delete().neq('id', 'placeholder');
        await supabase.from('notifications').delete().neq('id', 'placeholder');
        
        // Reset configs in Supabase config_settings
        await supabase.from('config_settings').upsert({ key: 'products', value: DEFAULT_PRODUCTS });
        await supabase.from('config_settings').upsert({ key: 'vendors_config', value: DEFAULT_VENDORS_CONFIG });
        await supabase.from('config_settings').upsert({ key: 'safety_thresholds', value: DEFAULT_THRESHOLDS });
        await supabase.from('config_settings').upsert({ key: 'delivery_destinations', value: DEFAULT_DESTINATIONS });
        await supabase.from('config_settings').upsert({ key: 'easyecom_config', value: defaultEasyEcom });
        
        const rows = Object.keys(clearedInventory).map(item_name => ({
          item_name,
          quantity: 0
        }));
        if (rows.length > 0) {
          await supabase.from('inventory').upsert(rows);
        }
      } catch (e) {
        console.warn("Failed to clear remote database:", e);
      }
    }
  };

  // Import Database JSON
  const importDatabase = (data) => {
    try {
      if (data.products) setProducts(data.products);
      if (data.batches) setBatches(data.batches);
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.invoices) setInvoices(data.invoices);
      if (data.inventory) setInventory(data.inventory);
      if (data.carryForwards) setCarryForwards(data.carryForwards);
      if (data.notifications) setNotifications(data.notifications);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const addDeliveryDestination = async (newDest) => {
    if (!newDest || deliveryDestinations.includes(newDest)) return;
    const updated = [...deliveryDestinations, newDest];
    setDeliveryDestinations(updated);
    if (hasSupabase) {
      try {
        await supabase.from('config_settings').upsert({ key: 'delivery_destinations', value: updated });
      } catch (e) {
        console.warn("Failed to update delivery destinations in Supabase:", e);
      }
    }
  };

  return (
    <PortalContext.Provider
      value={{
        products,
        batches,
        purchaseOrders,
        invoices,
        inventory,
        carryForwards,
        theme,
        toggleTheme,
        role,
        setRole,
        notifications,
        setNotifications,
        generatePO,
        updatePONotes,
        updateInvoiceNotes,
        markAllNotificationsRead,
        clearNotifications,
        addProduct,
        updateProduct,
        deleteProduct,
        createBatch,
        deleteBatch,
        deletePO,
        deleteInvoice,
        createSinglePO,
        updatePO,
        dispatchPO,
        addInvoice,
        closePO,
        adjustStock,
        clearDatabase,
        importDatabase,
        getLocalDateStr,
        companyConfig,
        setCompanyConfig,
        vendorsConfig,
        setVendorsConfig,
        warnings,
        currentUser,
        users,
        login,
        logout,
        addUser,
        deleteUser,
        hasSupabase,
        isQuickLoginEnabled,
        setIsQuickLoginEnabled,
        safetyThresholds,
        setSafetyThresholds,
        deliveryDestinations,
        addDeliveryDestination,
        easyEcomConfig,
        setEasyEcomConfig,
        easyEcomLastSync,
        setEasyEcomLastSync,
        syncInventoryFromEasyEcom
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) throw new Error('usePortal must be used within a PortalProvider');
  return context;
};
