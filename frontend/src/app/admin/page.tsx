'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { customFetch } from '@/utils/customFetch';
import { UserPlus, ShieldAlert, CheckCircle2, Users, Check, X, Trash2 } from 'lucide-react';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  subscription_active: boolean;
}

export default function AdminPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUBSCRIBER');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [pendingRoles, setPendingRoles] = useState<Record<number, string>>({});

  const handleRoleChange = (userId: number, newRole: string) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: newRole }));
  };
  
  // Protect admin route client-side too
  useEffect(() => {
    if (user && user.role !== 'SUPERADMIN') {
      router.push('/');
    } else if (user && user.role === 'SUPERADMIN') {
      fetchUsers();
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await customFetch('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Could not fetch users", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleApprove = async (userId: number) => {
    const roleToAssign = pendingRoles[userId] || 'SUBSCRIBER';
    try {
      const res = await customFetch(`http://localhost:8000/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: roleToAssign })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error("Failed to approve user", err);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await customFetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  if (!user || user.role !== 'SUPERADMIN') return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg('');
    setIsError(false);

    try {
      const res = await customFetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          password,
          role,
          is_active: true,
          subscription_active: role === 'SUBSCRIBER' ? false : true // Sub needs manual activation or payment
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to create user');
      }

      setStatusMsg(`User ${email} created successfully!`);
      setEmail('');
      setPassword('');
      setRole('SUBSCRIBER');
      fetchUsers();
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 flex items-center gap-3">
          <ShieldAlert className="text-amber-400 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-white">Superadmin Control Panel</h1>
            <p className="text-slate-400 text-sm">Provision new accounts and manage access.</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-sky-500" />
            Create New Account
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-6 max-w-lg">
            {statusMsg && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {isError ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                {statusMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
              >
                <option value="SUBSCRIBER">Subscriber (Paid Client)</option>
                <option value="EMPLOYEE">Employee (Free Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? 'Creating...' : 'Provision User'}
            </button>
          </form>
        </div>

        {/* User Management Section */}
        <div className="p-8 border-t border-slate-200 bg-slate-50">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Manage Users & Approvals
          </h2>

          {isLoadingUsers ? (
            <p className="text-slate-500 text-sm">Loading users...</p>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{u.email}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {!u.is_active && (
                          <div className="inline-flex items-center gap-2">
                            <select 
                              className="text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 outline-none text-slate-700 font-medium bg-white" 
                              value={pendingRoles[u.id] || 'SUBSCRIBER'} 
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="SUBSCRIBER">Subscriber</option>
                              <option value="EMPLOYEE">Employee</option>
                            </select>
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              title="Approve User"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {u.role !== 'SUPERADMIN' && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title={u.is_active ? "Delete User" : "Reject & Delete User"}
                          >
                            {!u.is_active ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
