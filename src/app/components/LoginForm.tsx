'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { getRoleDashboard } from '@/lib/mockData';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { signIn, profile } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      showToast('Welcome back!', 'success');
      // Profile will be loaded by AuthContext; wait briefly then redirect
      setTimeout(async () => {
        // Get profile from localStorage (synced by AuthContext)
        try {
          const raw = localStorage.getItem('hapo_auth_user');
          if (raw) {
            const p = JSON.parse(raw);
            router.push(getRoleDashboard(p.role));
          } else {
            router.push('/client-home');
          }
        } catch {
          router.push('/client-home');
        }
      }, 600);
    } catch (err: any) {
      setError('email', { message: err?.message || 'Invalid credentials. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-card-foreground mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your HapoUlipo account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="label-text">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.co.ke"
            className={`input-field ${errors.email ? 'input-error' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="label-text">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`input-field pr-11 ${errors.password ? 'input-error' : ''}`}
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 rounded accent-primary"
            {...register('remember')}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Keep me signed in
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3 text-base"
          style={{ minHeight: '48px' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <LogIn size={18} /> Sign In
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-md border border-border bg-background py-3 text-base text-card-foreground transition-colors hover:bg-muted"
      >
        <span className="text-lg font-bold text-primary" aria-hidden="true">
          G
        </span>
        Sign in with Google
      </button>

      <p className="text-center text-sm text-muted-foreground mt-5">
        New to HapoUlipo?{' '}
        <button onClick={onSwitchToSignup} className="text-primary font-semibold hover:underline">
          Create an account
        </button>
      </p>
    </div>
  );
}
