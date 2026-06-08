/**
 * AirPak Express - Admin Sign In Page
 * Black background + white elements + red accents (#E31837)
 * Same design as user ChatGPTAuthPage from shipnow-portal-fixed
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../../contexts/AuthContext';

// 2x Larger responsive logo component
const AirPakLogo: React.FC<{ variant?: 'landing' | 'sub' }> = ({ variant = 'landing' }) => {
  const sizeClasses = variant === 'landing'
    ? 'w-56 sm:w-72 md:w-80'
    : 'w-44 sm:w-56 md:w-64';
  return (
    <div className="flex justify-center mb-8 sm:mb-10">
      <img
        src="/images/airpak-logo-new.png"
        alt="AirPak Logo"
        className={`${sizeClasses} h-auto object-contain transition-all duration-300`}
        style={{ maxHeight: '120px' }}
      />
    </div>
  );
};

// Back button component
const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-gray-400 hover:text-white mb-4 sm:mb-6 text-xs sm:text-sm flex items-center gap-1 transition-colors"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    Back
  </button>
);

// Primary action button
const PrimaryButton: React.FC<{ onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; loading?: boolean; children: React.ReactNode }> = ({ onClick, type = 'button', disabled, loading, children }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full min-h-[52px] sm:min-h-[56px] rounded-xl flex items-center justify-center gap-2 text-white text-sm sm:text-base font-semibold bg-[#E31837] hover:bg-[#C8102E] transition-all disabled:opacity-50 active:scale-[0.98]"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : children}
    </button>
  );
};

interface LoginPageProps {
  prefillKey?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ prefillKey }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const TEST_SITE_KEY = '1x00000000000000000000AA';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error, rateLimited } = await signIn(email, password);
      if (rateLimited) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      if (error) throw error;
      setMessage({ type: 'success', text: 'Welcome back!' });
      setTimeout(() => navigate('/admin/portal'), 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Invalid credentials' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <div className="bg-black rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10">
          <BackButton onClick={() => navigate('/')} />

          <AirPakLogo variant="sub" />

          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white text-center mb-1">Admin Sign In</h1>
          <p className="text-xs text-gray-400 text-center mb-6 sm:mb-8">Access your admin dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                placeholder="Admin email address"
                autoComplete="email"
                className={`w-full h-12 sm:h-14 px-4 bg-[#1a1a1a] border ${errors.email ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-700 focus:border-[#E31837]'} rounded-xl focus:ring-2 focus:ring-[#E31837]/20 outline-none text-sm sm:text-base text-white placeholder-gray-500 transition-all`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
            </div>

            <div className="w-full">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }}
                placeholder="Password"
                autoComplete="current-password"
                className={`w-full h-12 sm:h-14 px-4 bg-[#1a1a1a] border ${errors.password ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-700 focus:border-[#E31837]'} rounded-xl focus:ring-2 focus:ring-[#E31837]/20 outline-none text-sm sm:text-base text-white placeholder-gray-500 transition-all`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
            </div>

            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => navigate('/admin/forgot-password')}
                className="text-xs sm:text-sm text-[#E31837] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="flex justify-center py-2 sm:py-3">
              <Turnstile siteKey={TEST_SITE_KEY} onSuccess={setTurnstileToken} />
            </div>

            {message && (
              <div className={`p-3 sm:p-4 rounded-xl flex items-center gap-2 text-xs sm:text-sm ${
                message.type === 'success'
                  ? 'bg-[#E31837]/20 text-[#E31837] border border-[#E31837]/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {message.text}
              </div>
            )}

            <PrimaryButton type="submit" disabled={isSubmitting} loading={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </PrimaryButton>
          </form>

          <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-800">
            <p className="text-center text-xs text-gray-500">
              Not an admin?{' '}
              <button onClick={() => navigate('/auth')} className="text-[#E31837] hover:underline font-medium">
                User Login
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;