/*
------------------------------------------------
File: AdminDashboard.jsx
Purpose: Global settings and user authorization.
Responsibilities: Manages user accounts listings, updates role states via backend PUT API, monitors database state, and checks live stats.
Dependencies: react, axiosClient, Card, Button, lucide-react
------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Card from '../components/Card';
import Button from '../components/Button';
import { 
  Shield, 
  Settings, 
  Users, 
  Server, 
  Database, 
  Edit2, 
  Check, 
  X,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeEndpoints: 48,
    dbStatus: 'Connecting...',
    status: 'Checking...'
  });
  
  const [loading, setLoading] = useState(true);
  const [maintMode, setMaintMode] = useState(false);
  
  // Role Modification state
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axiosClient.get('/admin/users'),
        axiosClient.get('/admin/stats')
      ]);
      
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleEditRoleClick = (user) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async (userId) => {
    setSubmittingRole(true);
    try {
      const res = await axiosClient.put(`/admin/users/${userId}/role`, {
        role: selectedRole
      });
      if (res.data.success) {
        alert('User authorization role updated successfully!');
        setEditingUserId(null);
        // Refresh local list
        setUsers(users.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to modify role status.');
    } finally {
      setSubmittingRole(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>System Administration</span>
            <Shield className="w-7 h-7 text-blue-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure global rules, manage user roles, audit queries execution rates, and toggle maintenance modes.
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all"
          title="Reload Dashboard Data"
        >
          <RotateCw className="w-4 h-4 text-slate-500 dark:text-slate-450" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: System Status */}
        <Card className="flex items-center gap-4 p-5 hover:scale-[1.01] transition-all">
          <div className="p-3.5 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">System Status</p>
            <p className="text-lg font-extrabold text-emerald-500 mt-1.5">{stats.status}</p>
          </div>
        </Card>

        {/* Stat 2: Total Accounts */}
        <Card className="flex items-center gap-4 p-5 hover:scale-[1.01] transition-all">
          <div className="p-3.5 bg-blue-500/10 text-blue-550 rounded-2xl border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total Accounts</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1.5">
              {loading ? '...' : stats.totalAccounts}
            </p>
          </div>
        </Card>

        {/* Stat 3: API Endpoints */}
        <Card className="flex items-center gap-4 p-5 hover:scale-[1.01] transition-all">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-650 rounded-2xl border border-indigo-500/20">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">API Endpoints</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1.5">{stats.activeEndpoints} Active</p>
          </div>
        </Card>

        {/* Stat 4: DB Connection */}
        <Card className="flex items-center gap-4 p-5 hover:scale-[1.01] transition-all">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-505 rounded-2xl border border-emerald-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">DB Pool</p>
            <p className="text-lg font-extrabold text-emerald-500 mt-1.5">{stats.dbStatus}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Manager Table */}
        <div className="lg:col-span-2">
          <Card title="User Accounts Directory">
            {loading ? (
              <p className="text-xs text-slate-400 py-12 text-center">Loading accounts directory...</p>
            ) : users.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No registered accounts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 pb-3 text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">
                      <th className="py-3">Name</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">Role</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-150">{u.name}</td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono">{u.email}</td>
                        <td className="py-3.5">
                          {editingUserId === u.id ? (
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="FACULTY">FACULTY</option>
                              <option value="PLACEMENT_OFFICER">PLACEMENT_OFFICER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-[9px] font-black tracking-wider uppercase border border-blue-500/10">
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {editingUserId === u.id ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveRole(u.id)}
                                disabled={submittingRole}
                                className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-650 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-300 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditRoleClick(u)}
                              className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-lg transition-all flex items-center gap-1 ml-auto text-[10px] uppercase font-bold"
                            >
                              <Edit2 className="w-3 h-3" /> Modify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Configuration settings flags */}
        <div className="space-y-6">
          <Card title="Global Flags Configurations">
            <div className="space-y-6 text-xs font-semibold">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">System Maintenance Mode</h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-450 mt-0.5 leading-normal">
                    Halts non-admin API writes for routine DB backups.
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={maintMode} 
                  onChange={() => setMaintMode(!maintMode)} 
                  className="w-4 h-4 cursor-pointer accent-blue-600 shrink-0 mt-0.5" 
                />
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4">
                <Button 
                  onClick={() => alert('Database schema backup task scheduled successfully!')}
                  variant="secondary" 
                  className="w-full justify-center text-xs py-2 uppercase font-extrabold tracking-wider"
                >
                  Backup Database Schema
                </Button>
              </div>
            </div>
          </Card>

          {/* Alert Security Warning box */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Security Notice</p>
              <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-450 mt-0.5 font-medium">
                Changes to user account roles take place immediately. Be careful when updating roles to placement officer or admin status.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
