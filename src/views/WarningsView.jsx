import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Package, 
  ShieldAlert,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

export default function WarningsView({ setActiveTab }) {
  const { warnings } = usePortal();
  const [filterType, setFilterType] = useState('all'); // all, low_stock, expired_po, due_near

  // Filter warnings
  const filteredWarnings = warnings.filter(w => {
    if (filterType === 'all') return true;
    return w.type === filterType;
  });

  const highCount = warnings.filter(w => w.severity === 'high').length;
  const mediumCount = warnings.filter(w => w.severity === 'medium').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.75rem' }}>
        <button 
          className="glass-btn" 
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
        >
          <ArrowLeft size={14} /> Back to Overview
        </button>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={28} color="var(--color-rose)" /> System Warnings Ledger
          </h1>
          <p className="page-subtitle">Real-time alerts for low stock levels, expired purchase orders, and near deadlines</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cols-3">
        <div className="glass-card kpi-card" style={{ borderColor: warnings.length > 0 ? 'var(--color-rose)' : 'var(--border-color)' }}>
          <div className="kpi-title">Total Active Alerts</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: warnings.length > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
              {warnings.length}
            </div>
            <div className="kpi-icon-wrapper" style={{ color: warnings.length > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Requiring immediate or prompt attention</p>
        </div>

        <div className="glass-card kpi-card" style={{ borderColor: highCount > 0 ? 'var(--color-rose)' : 'var(--border-color)' }}>
          <div className="kpi-title">High Severity Alerts</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: highCount > 0 ? 'var(--color-rose)' : 'var(--text-main)' }}>
              {highCount}
            </div>
            <div className="kpi-icon-wrapper" style={{ color: highCount > 0 ? 'var(--color-rose)' : 'var(--text-dark)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Critical items (overdue POs, very low stock)</p>
        </div>

        <div className="glass-card kpi-card" style={{ borderColor: 'var(--border-color)' }}>
          <div className="kpi-title">Medium / Low Alerts</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: 'var(--color-amber)' }}>
              {mediumCount}
            </div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-amber)' }}>
              <Clock size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Upcoming deadlines or approaching thresholds</p>
        </div>
      </div>

      {/* Main Ledger Content */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        
        {/* Filter Buttons Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <button 
            className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Warnings ({warnings.length})
          </button>
          <button 
            className={`tab-btn ${filterType === 'low_stock' ? 'active' : ''}`}
            onClick={() => setFilterType('low_stock')}
          >
            Low Stock ({warnings.filter(w => w.type === 'low_stock').length})
          </button>
          <button 
            className={`tab-btn ${filterType === 'expired_po' ? 'active' : ''}`}
            onClick={() => setFilterType('expired_po').length}
            onClick={() => setFilterType('expired_po')}
          >
            Expired POs ({warnings.filter(w => w.type === 'expired_po').length})
          </button>
          <button 
            className={`tab-btn ${filterType === 'due_near' ? 'active' : ''}`}
            onClick={() => setFilterType('due_near')}
          >
            Near Deadlines ({warnings.filter(w => w.type === 'due_near').length})
          </button>
        </div>

        {/* Warnings List */}
        {filteredWarnings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>No Active Warnings</h3>
            <p style={{ fontSize: '0.85rem' }}>All stock levels are healthy and there are no overdue delivery schedules.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredWarnings.map((warn) => {
              const IconComponent = warn.type === 'low_stock' ? Package : warn.type === 'expired_po' ? AlertTriangle : Clock;
              const severityColor = warn.severity === 'high' ? 'var(--color-rose)' : 'var(--color-amber)';
              const severityBg = warn.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)';

              return (
                <div 
                  key={warn.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '1.25rem', 
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr auto', 
                    alignItems: 'center', 
                    gap: '1.25rem',
                    borderLeft: `4px solid ${severityColor}`,
                    background: 'var(--bg-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Warning Icon wrapper */}
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '10px', 
                    background: severityBg, 
                    color: severityColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={22} />
                  </div>

                  {/* Warning details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>
                        {warn.title}
                      </h4>
                      <span 
                        style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          color: severityColor, 
                          background: severityBg,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {warn.severity} priority
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {warn.subtitle}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: '1.4' }}>
                      {warn.description}
                    </p>
                  </div>

                  {/* Call to action button */}
                  <div style={{ flexShrink: 0 }}>
                    <button 
                      className="glass-btn-primary" 
                      onClick={() => setActiveTab(warn.actionTab)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.5rem 0.75rem', 
                        gap: '0.35rem',
                        background: warn.severity === 'high' ? 'var(--grad-danger)' : 'var(--grad-primary)'
                      }}
                    >
                      {warn.actionText} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
