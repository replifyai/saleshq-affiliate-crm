'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminProfile } from '@/types';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SalesHQ Affiliate CRM</CardTitle>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Sign in to your admin account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

