'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { AdminProfile } from '@/types';
import { Lock, Mail, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Clean & Simple */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FDF8E1] via-[#FCF4D1] to-[#F9EBB2] relative overflow-hidden rounded-r-[30px] flex-col items-center justify-center">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#EAC312]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EAC312]/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={140}
            height={56}
            className="object-contain mb-8"
            priority
          />
          
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Affiliate Dashboard
          </h1>
          
          <p className="text-gray-500 max-w-sm">
            Manage creators, track performance, and grow your affiliate network.
          </p>
          
          {/* Simple decorative line */}
          <div className="mt-10 flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#EAC312]/30 rounded-full" />
            <div className="w-3 h-3 bg-[#EAC312] rounded-full" />
            <div className="w-8 h-0.5 bg-[#EAC312]/30 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Image
              src="/Logo.png"
              alt="Logo"
              width={100}
              height={40}
              className="object-contain"
              priority
            />
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
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#231F20] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EAC312] focus:border-[#EAC312] transition-all"
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
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#231F20] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EAC312] focus:border-[#EAC312] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#EAC312] hover:bg-[#D4B10F] text-[#231F20] font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#EAC312]/30 disabled:opacity-50 disabled:cursor-not-allowed group"
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
          <div className="lg:hidden fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#EAC312] via-[#F0D03A] to-[#FDF6D8]" />
        </div>
      </div>
    </div>
  );
}
