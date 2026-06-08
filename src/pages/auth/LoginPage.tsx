/**
 * AirPak Express - Admin Portal Login Page
 * Real Zoho OneAuth TOTP verification
 * Demo fallback support
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<'email' | 'checking' | 'code' | 'not_enabled'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setCurrentEmail(email);

    // Check for demo credentials first
    const demoEmails = ['admin@airpak-express.site', 'demo@airpak.com', 'test@airpak.com'];
    if (demoEmails.includes(email.toLowerCase())) {
      // Demo mode - skip 2FA verification
      const demoUser = {
        id: `demo-${Date.now()}`,
        email: email,
        full_name: 'Administrator',
        role: 'super_admin' as const,
        created_at: new Date().toISOString(),
        two_factor_enabled: true,
      };

      localStorage.setItem('airpak_user', JSON.stringify(demoUser));
      localStorage.setItem('airpak_2fa_verified', 'true');
      localStorage.setItem('airpak_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('airpak_demo_2fa_verified', 'true');

      toast.success('Demo login successful!');
      navigate('/dashboard');
      return;
    }

    // For other emails, check 2FA status via edge function
    setStep('checking');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-oneauth-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'check',
            user_email: email.toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.enabled) {
        setStep('code');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        // If 2FA not enabled, allow direct login with Supabase auth
        try {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'demo-password' // This would need to be handled differently
          });

          if (authError) {
            setError('Please enable 2FA or use demo credentials.');
            setStep('email');
            return;
          }

          toast.success('Login successful!');
          navigate('/dashboard');
        } catch {
          setStep('not_enabled');
        }
      }
    } catch (err) {
      console.error('Check 2FA error:', err);
      // On error, show 2FA not enabled screen
      setStep('not_enabled');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-oneauth-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'verify',
            code: fullCode,
            user_email: currentEmail.toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const loggedInUser = {
          id: currentEmail,
          email: currentEmail,
          full_name: 'Administrator',
          role: 'super_admin',
          created_at: new Date().toISOString(),
          two_factor_enabled: true,
        };

        localStorage.setItem('airpak_user', JSON.stringify(loggedInUser));
        localStorage.setItem('airpak_2fa_verified', 'true');

        toast.success('Authentication successful!');
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setEmail('');
    setCode(['', '', '', '', '', '']);
    setError(null);
    setCurrentEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
      </div>

      <div className="relative w-full max-w-md">
        {/* AirPak Logo with Glass Effect */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className="relative">
            {/* Glass background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 transform scale-110" />
            {/* Glowing ring */}
            <div className="absolute inset-[-4px] bg-gradient-to-r from-red-500/50 via-red-600/50 to-red-500/50 rounded-3xl blur-lg opacity-50" />
            {/* Logo Image - 3x size */}
            <img
              src="/airpak-logo-auth.png"
              alt="AirPak Express"
              className="relative h-28 md:h-36 w-auto object-contain drop-shadow-2xl p-3"
              style={{ filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.4))' }}
            />
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm md:text-base">Admin Portal</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/50">
          {step === 'email' || step === 'checking' ? (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  {step === 'checking' ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-400">Checking 2FA status...</span>
                    </div>
                  ) : (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your admin email"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      autoFocus
                      required
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={step === 'checking'}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {step === 'checking' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5" />
                      Continue
                    </>
                  )}
                </button>
              </form>
            </>
          ) : step === 'code' ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Two-Factor Authentication</h2>
                <p className="text-slate-400 text-sm">Enter code from your Zoho OneAuth app</p>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl mb-6">
                <p className="text-slate-400 text-xs text-center">
                  {currentEmail}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              )}

              <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 text-center text-xl font-bold bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={code.some(c => c === '') || isVerifying}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify
                  </>
                )}
              </button>

              <button
                onClick={handleBack}
                className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Use different email
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">2FA Not Enabled</h2>
                <p className="text-slate-400 text-sm">You need to set up Two-Factor Authentication first.</p>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl mb-6">
                <p className="text-slate-300 text-sm text-center">
                  Email: <span className="text-white font-medium">{currentEmail}</span>
                </p>
                <p className="text-slate-400 text-xs text-center mt-2">
                  Please contact your administrator to enable 2FA for your account.
                </p>
              </div>

              <button
                onClick={handleBack}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Try Different Email
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-500 text-sm">
            © 2026 AirPak Express. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs">
            Protected by Zoho OneAuth
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;