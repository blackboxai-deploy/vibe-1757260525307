'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [showRegister, setShowRegister] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // This will be handled by useEffect redirect, but show loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center justify-between">
        {/* Left side - Hero content */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 pr-12">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Modern Business
              <span className="text-blue-600"> SaaS Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your business operations with our comprehensive platform. 
              Manage data, users, and exports with powerful Excel integration.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-blue-600 mb-1">100%</div>
                <div className="text-sm text-gray-600">Data Security</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-green-600 mb-1">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-purple-600 mb-1">Excel</div>
                <div className="text-sm text-gray-600">Integration</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-orange-600 mb-1">Admin</div>
                <div className="text-sm text-gray-600">Control</div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowRegister(true)}
              >
                Get Started Free
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => setShowRegister(false)}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="w-full max-w-md">
            {/* Mobile hero content */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Business <span className="text-blue-600">SaaS App</span>
              </h1>
              <p className="text-gray-600 mb-6">
                Complete business management with Excel integration
              </p>
            </div>

            {showRegister ? (
              <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}