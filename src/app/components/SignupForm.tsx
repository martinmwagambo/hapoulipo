'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Store, User, Star } from 'lucide-react';
import { generateAmbassadorCode, getRoleDashboard } from '@/lib/mockData';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/mockData';

interface SignupFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  city?: string;
  ambassador_code_input?: string;
}

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'client',
    label: 'Client',
    description: 'Browse & buy from nearby vendors',
    icon: <User size={20} />,
  },
  {
    value: 'vendor',
    label: 'Vendor',
    description: 'Sell your products on HapoUlipo',
    icon: <Store size={20} />,
  },
  {
    value: 'ambassador',
    label: 'Ambassador',
    description: 'Refer vendors & earn commissions',
    icon: <Star size={20} />,
  },
];

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [referralCodeStatus, setReferralCodeStatus] = useState<'idle' | 'valid' | 'invalid'>(
    'idle'
  );
  const { showToast } = useToast();
  const { signUp } = useAuth();
  const router = useRouter();
  const mountedRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      role: 'client',
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      password: '',
      city: '',
      ambassador_code_input: '',
    },
  });

  const selectedRole = watch('role');
  const ambassadorCodeInput = watch('ambassador_code_input');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    if (selectedRole === 'ambassador') setGeneratedCode(generateAmbassadorCode());
    setReferralCodeStatus('idle');
  }, [selectedRole]);

  useEffect(() => {
    if (!mountedRef.current) return;
    if (!ambassadorCodeInput?.trim()) {
      setReferralCodeStatus('idle');
      return;
    }
    // We'll validate on submit; show idle for now
    setReferralCodeStatus('idle');
  }, [ambassadorCodeInput]);

  const onSubmit = async (data: SignupFormData) => {
    const signupRole = selectedRole ?? data.role;

    setIsLoading(true);
    try {
      await signUp(data.email, data.password, {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role: signupRole,
        city: data.city,
        ambassador_code: signupRole === 'ambassador' ? generatedCode : undefined,
        referred_by:
          signupRole === 'client' || signupRole === 'vendor'
            ? data.ambassador_code_input?.trim().toUpperCase() || undefined
            : undefined,
      });
      showToast(`Account created! Welcome to HapoUlipo, ${data.first_name}!`, 'success');
      setTimeout(() => {
        router.push(getRoleDashboard(signupRole));
      }, 500);
    } catch (err: any) {
      showToast(err?.message || 'Signup failed. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-card-foreground mb-1">Create your account</h2>
        <p className="text-sm text-muted-foreground">Join thousands of Kenyans on HapoUlipo</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Role Selector */}
        <div>
          <label className="label-text">I am a</label>
          <Controller
            name="role"
            control={control}
            rules={{ required: 'Please select your role' }}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2 mt-1">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={`role-${option.value}`}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-150 ${
                      field.value === option.value
                        ? 'border-primary bg-accent/40 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30'
                    }`}
                  >
                    <span
                      className={
                        field.value === option.value ? 'text-primary' : 'text-muted-foreground'
                      }
                    >
                      {option.icon}
                    </span>
                    <span className="text-xs font-bold">{option.label}</span>
                    <span className="text-xs leading-tight hidden sm:block">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.role && <p className="error-text">{errors.role.message}</p>}
        </div>

        {/* Ambassador code display */}
        {selectedRole === 'ambassador' && generatedCode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Star size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Your Ambassador Code</p>
              <p className="text-base font-extrabold text-amber-700 tracking-widest font-tabular">
                {generatedCode}
              </p>
              <p className="text-xs text-amber-600">Share this code to earn referral commissions</p>
            </div>
          </div>
        )}

        {/* Ambassador Referral Code input */}
        {(selectedRole === 'client' || selectedRole === 'vendor') && (
          <div>
            <label htmlFor="ambassador_code_input" className="label-text">
              Ambassador Code <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <p className="helper-text">Have a referral code from an ambassador? Enter it here.</p>
            <input
              id="ambassador_code_input"
              type="text"
              placeholder="e.g. HAPGRC847"
              className="input-field uppercase tracking-widest mt-1.5"
              {...register('ambassador_code_input')}
            />
          </div>
        )}

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="label-text">
              First name
            </label>
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              placeholder="Amina"
              className={`input-field ${errors.first_name ? 'input-error' : ''}`}
              {...register('first_name', { required: 'First name is required' })}
            />
            {errors.first_name && <p className="error-text">{errors.first_name.message}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="label-text">
              Last name
            </label>
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              placeholder="Wanjiku"
              className={`input-field ${errors.last_name ? 'input-error' : ''}`}
              {...register('last_name', { required: 'Last name is required' })}
            />
            {errors.last_name && <p className="error-text">{errors.last_name.message}</p>}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="label-text">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+254712345678"
            className={`input-field ${errors.phone ? 'input-error' : ''}`}
            {...register('phone', { required: 'Phone number is required' })}
          />
          {errors.phone && <p className="error-text">{errors.phone.message}</p>}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="label-text">
            City / Town <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="city"
            type="text"
            placeholder="Nairobi"
            className="input-field"
            {...register('city')}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className="label-text">
            Email address
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="label-text">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              className={`input-field pr-11 ${errors.password ? 'input-error' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
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
              Creating account...
            </span>
          ) : (
            <>
              <UserPlus size={18} /> Create Account
            </>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="whitespace-nowrap text-xs text-muted-foreground">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md border border-border bg-background py-3 text-base text-card-foreground transition-colors hover:bg-muted"
      >
        <span className="text-lg font-bold text-primary" aria-hidden="true">
          G
        </span>
        Sign up with Google
      </button>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}
