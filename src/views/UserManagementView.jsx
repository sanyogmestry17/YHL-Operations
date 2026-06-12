import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  KeyRound, 
  X 
} from 'lucide-react';

export default function UserManagementView() {
  const { users, currentUser, addUser, deleteUser, isQuickLoginEnabled, setIsQuickLoginEnabled } = usePortal();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Operations'); // Default role to create

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) return;

    // Email uniqueness check
    const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (duplicate) {
      alert(`User with email "${email}" already exists!`);
      return;
    }

    addUser({ name, email, password, role });
    
    // Close & Reset
    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Operations');
    alert('New user account added successfully!');
  };

  const handleDeleteClick = (userId, userName) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account while logged in!");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
      deleteUser(userId);
      alert('User deleted.');
    }
  };

  // Counts
  const totalCount = users.length;
  const adminCount = users.filter(u => u.role === 'Super Admin').length;
  const opsCount = users.filter(u => u.role === 'Operations').length;
  const accountsCount = users.filter(u => u.role === 'Accounts').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="var(--color-cyan)" /> User Accounts Registry
          </h1>
          <p className="page-subtitle">Manage corporate user accounts, access keys, and system permissions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-glass-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.5rem 0.85rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            userSelect: 'none',
            height: '38px',
            boxSizing: 'border-box'
          }}>
            <input 
              type="checkbox" 
              checked={isQuickLoginEnabled} 
              onChange={(e) => setIsQuickLoginEnabled(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--color-cyan)' }}
            />
            <span style={{ fontWeight: 500 }}>Enable Quick Login Presets</span>
          </label>
          <button className="glass-btn-primary" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={16} /> Create User
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cols-4">
        <div className="glass-card kpi-card">
          <div className="kpi-title">Registered Users</div>
          <div className="kpi-val-container">
            <div className="kpi-value">{totalCount}</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-blue)' }}>
              <Users size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Active portal accounts</p>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-title">Super Admins</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: 'var(--color-rose)' }}>{adminCount}</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-rose)' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Full write & configuration access</p>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-title">Operations Team</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: 'var(--color-cyan)' }}>{opsCount}</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-cyan)' }}>
              <Users size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Production batches & raw logs</p>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-title">Accounts Team</div>
          <div className="kpi-val-container">
            <div className="kpi-value" style={{ color: 'var(--color-emerald)' }}>{accountsCount}</div>
            <div className="kpi-icon-wrapper" style={{ color: 'var(--color-emerald)' }}>
              <KeyRound size={20} />
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.75rem' }}>Invoice auditing & PO approvals</p>
        </div>
      </div>

      {/* Users Accounts Ledger Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>Active User Profiles</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Access Role</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Password (Keys)</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                let roleColor = 'var(--color-cyan)';
                let roleBg = 'rgba(59, 130, 246, 0.1)';
                if (u.role === 'Super Admin') {
                  roleColor = 'var(--color-rose)';
                  roleBg = 'rgba(239, 68, 68, 0.1)';
                } else if (u.role === 'Accounts') {
                  roleColor = 'var(--color-emerald)';
                  roleBg = 'rgba(16, 185, 129, 0.1)';
                }

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', background: isSelf ? 'rgba(59,130,246,0.02)' : 'transparent' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.name}
                        {isSelf && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--color-blue)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: roleColor, 
                          background: roleBg,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--text-dark)' }}>
                      {u.password}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button 
                        className="glass-btn-danger" 
                        style={{ 
                          padding: '0.35rem 0.5rem', 
                          fontSize: '0.75rem',
                          opacity: isSelf ? 0.35 : 1,
                          cursor: isSelf ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleDeleteClick(u.id, u.name)}
                        disabled={isSelf}
                        title={isSelf ? 'Cannot delete logged in user' : 'Delete user profile'}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="drawer-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add New User Account</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="glass-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Enter full name..."
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="glass-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  <input 
                    type="email" 
                    className="glass-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@yourhappylife.com"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="glass-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Specify password..."
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="glass-label">Portal Security Role</label>
                <select 
                  className="glass-input" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="Operations">Operations (Production batches, raw inputs)</option>
                  <option value="Accounts">Accounts (Invoices registry, PO audits)</option>
                  <option value="Super Admin">Super Admin (All access, User configurations)</option>
                </select>
              </div>

              <button type="submit" className="glass-btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                Register Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
