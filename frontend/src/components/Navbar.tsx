'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LogOut, LayoutDashboard, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all h-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-md group-hover:bg-sky-400 transition-colors">
            <span className="text-white font-bold text-lg leading-none">B</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Black Vave</span>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === 'SUPERADMIN' && (
                <Link href="/admin" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-colors border border-amber-200/50">
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {user.email}
              </div>

              <button 
                onClick={logout}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-5 py-2 rounded-full transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
