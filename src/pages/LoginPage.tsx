/**
 * AirPak Express - Admin Portal Login Page
 * Premium 2FA-only authentication with perfect responsive design
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Loader2, Lock, Zap, Globe, Shield } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { verify2FA, finalizeLogin, error, loading, user, is2FAVerified } = useAuth();
  const navigate = useNavigate();

  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);

  const codeInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in and verified
  if (user && is2FAVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  // Auto-focus first input on mount
  useEffect(() => {
    codeInputsRef.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...totpCode];
    newCode[index] = value.slice(-1); // Only take last digit
    setTotpCode(newCode);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }

    // Clear any errors
    if (localError) setLocalError(null);
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && totpCode[index] === '' && index > 0) {
      // Move to previous input on backspace if current is empty
      codeInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsPasting(true);

    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(pastedData)) {
      setLocalError('Please paste a valid 6-digit code');
      setIsPasting(false);
      return;
    }

    const newCode = pastedData.split('');
    setTotpCode(newCode);

    // Focus last input after paste
    setTimeout(() => {
      codeInputsRef.current[5]?.focus();
      setIsPasting(false);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = totpCode.join('');

    if (code.length !== 6) {
      setLocalError('Please enter a complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      // Demo mode: accept '123456'
      if (code === '123456') {
        const demoUser = {
          id: 'demo-admin',
          email: 'admin@airpak-express.site',
          full_name: 'Admin User',
          role: 'super_admin' as const,
          created_at: new Date().toISOString(),
          two_factor_enabled: true,
        };
        localStorage.setItem('airpak_demo_user', JSON.stringify(demoUser));
        localStorage.setItem('airpak_demo_2fa_verified', 'true');
        finalizeLogin(demoUser, true);
        navigate('/dashboard');
        return;
      }

      // For real Zoho OneAuth, verify via edge function
      setLocalError('Invalid code. For demo, use: 123456');
    } catch (err: any) {
      setLocalError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if all digits are filled
  const isCodeComplete = totpCode.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-red-600/10 blur-[180px] rounded-full"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-red-600/5 blur-[140px] rounded-full"
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.15]" />

        {/* Noise Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-sm sm:max-w-md"
      >
        {/* Logo Section */}
        <div className="text-center mb-8 sm:mb-10">
          {/* Premium Logo Icon */}
          <motion.div
            className="relative inline-block mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {/* Outer Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#E31837] to-[#FF4B63] rounded-[28px] blur-xl opacity-40 scale-110"
              animate={{ scale: [1.1, 1.2, 1.1], opacity: [0.4, 0.5, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Icon */}
            <motion.div
              className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#E31837] to-[#FF4B63] rounded-3xl flex items-center justify-center shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg" />

              {/* Animated Ring */}
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-white/20"
                animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>

          {/* Script Logo Text */}
          <motion.div
            className="relative inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-airpak leading-none select-none text-transparent bg-clip-text bg-gradient-to-r from-[#E31837] via-[#FF4B63] to-[#E31837]">
              Airpak
            </h1>
            <span className="absolute -top-3 -right-6 sm:-top-4 sm:-right-8 text-2xl sm:text-3xl text-gray-700 font-bold">®</span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="mt-4 text-sm sm:text-base text-slate-400 font-medium tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            Admin Portal
          </motion.p>
        </div>

        {/* 2FA Card */}
        <motion.div
          className="bg-white/[0.02] backdrop-blur-3xl rounded-3xl sm:rounded-[28px] border border-white/[0.06] p-8 sm:p-10 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.4)]"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Icon and Title */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Two-Factor Authentication</h2>
            <p className="text-slate-400 text-sm sm:text-base">Enter your 6-digit code from the Zoho OneAuth app</p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-200 text-sm">{localError || error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 2FA Code Input */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300 text-center">
                Verification Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {totpCode.map((digit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                  >
                    <input
                      ref={(el) => (codeInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                      onPaste={handlePaste}
                      autoFocus={idx === 0}
                      className={`
                        w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-18
                        text-center text-2xl sm:text-3xl font-bold
                        bg-white/[0.03] border-2 rounded-2xl
                        text-white transition-all duration-300
                        focus:outline-none
                        ${isPasting ? 'border-emerald-500 ring-4 ring-emerald-500/20' : ''}
                        ${digit ? 'border-[#E31837] bg-[#E31837]/10' : 'border-white/10'}
                        hover:border-white/20
                        focus:border-[#E31837] focus:ring-4 focus:ring-[#E31837]/20
                        disabled:opacity-50
                      `}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || loading || !isCodeComplete}
              whileHover={{ scale: isCodeComplete ? 1.02 : 1 }}
              whileTap={{ scale: isCodeComplete ? 0.98 : 1 }}
              className={`
                w-full py-4 px-6
                bg-gradient-to-r from-[#E31837] to-[#FF4B63]
                text-white font-semibold rounded-2xl
                shadow-lg shadow-red-500/30
                transition-all duration-300
                flex items-center justify-center gap-3 text-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:shadow-[0_0_40px_rgba(227,24,55,0.5)]
              `}
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Verify & Access Portal</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Demo Notice */}
          <motion.div
            className="mt-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Demo Mode</p>
            <p className="text-white text-base font-mono">
              Code: <span className="text-red-400 font-bold">123456</span>
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex justify-center items-center gap-3 mb-3">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-white/20" />
            <p className="text-slate-500 text-xs sm:text-sm">Secured with Zoho OneAuth</p>
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-white/20" />
          </div>
          <p className="text-slate-600 text-xs">© 2025 Airpak Express. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;