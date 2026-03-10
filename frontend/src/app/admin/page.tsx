'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUBSCRIBER');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Protect admin route client-side too
  useEffect(() => {
    if (user && user.role !== 'SUPERADMIN') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPERADMIN') return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg('');
    setIsError(false);

    try {
      const res = await fetch('http://localhost:8000/api/admin/users', {
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
                <option value="SUPERADMIN">Super Admin</option>
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
      </div>
    </div>
  );
}
