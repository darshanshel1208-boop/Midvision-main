"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Helix3D from '@/components/Helix3D';
import '../landing.css';
import { Mail, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const data = await api.login(formData);
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard/patient');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page relative min-h-screen">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Helix3D />
      </div>

      {/* Glassmorphism Login Overlay */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 pointer-events-none">
        
        <div className="w-full max-w-md bg-white/20 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col items-center pointer-events-auto">
          
          <div className="mb-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">MediVision AI</h1>
            <p className="text-slate-500 text-sm mt-1 text-center font-medium">AI-Powered Medical Report Analysis & Disease Detection</p>
          </div>

          <div className="w-full mt-2">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-1">Welcome Back!</h2>
            <p className="text-slate-500 text-sm text-center mb-6">Login to access your account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  name="username"
                  placeholder="Email / Mobile" 
                  className="w-full pl-11 pr-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500 font-medium text-slate-800"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  className="w-full pl-11 pr-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500 font-medium text-slate-800"
                />
              </div>
              
              <div className="flex justify-end w-full">
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot Password?</a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-600/20 mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500 font-medium">New here?</span>
                <Link href="/register" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Register now</Link>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
