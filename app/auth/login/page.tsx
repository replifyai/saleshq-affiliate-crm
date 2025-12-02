'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { AdminProfile } from '@/types';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface LoginResponse {
  success: boolean;
  adminProfile?: AdminProfile;
  error?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.adminProfile) {
        // Update context with admin profile
        login(response.adminProfile);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#231F20] relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD100] rounded-full blur-[120px] opacity-30 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#ffda34] rounded-full blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFFAE6] rounded-full blur-[80px] opacity-10" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#FFD100] rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#231F20]" />
              </div>
              <span className="text-2xl font-bold text-[#FFD100]">SalesHQ</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-4">
              Affiliate CRM
              <span className="block text-[#FFD100]">Dashboard</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md">
              Manage your creators, track coupons, and monitor sales performance all in one place.
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="space-y-4 mt-8">
            {[
              'Real-time analytics & reporting',
              'Creator management tools',
              'Automated commission tracking',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#FFD100] rounded-full" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD100] via-[#ffda34] to-[#FFFAE6]" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#FFD100] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#231F20]" />
            </div>
            <span className="text-xl font-bold text-[#231F20]">SalesHQ CRM</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#231F20] mb-2">Welcome back</h2>
            <p className="text-gray-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#231F20]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#231F20] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#231F20]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#231F20] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#FFD100] hover:bg-[#ffda34] text-[#231F20] font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#FFD100]/30 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#231F20]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400">
              Secure admin access only
            </p>
          </div>

          {/* Decorative bottom gradient - mobile */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD100] via-[#ffda34] to-[#FFFAE6]" />
        </div>
      </div>
    </div>
  );
}
