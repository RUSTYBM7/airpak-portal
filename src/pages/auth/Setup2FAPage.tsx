/**
 * AirPak Express - Admin 2FA Setup Page
 * QR Code generation for Zoho OneAuth setup
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

const Setup2FAPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [secretKey, setSecretKey] = useState<string>('');
  const [rawSecret, setRawSecret] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setUserEmail(user.email || '');
    generate2FA();
  }, []);

  const generate2FA = async () => {
    setIsLoading(true);
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
            action: 'generate',
            user_email: user?.email || 'admin@example.com',
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      setSecretKey(data.secret);
      setRawSecret(data.raw_secret);
      setManualKey(data.secret.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || data.secret);
      setIsLoading(false);
    } catch (err) {
      console.error('2FA generation error:', err);
      setError('Failed to generate 2FA. Please try again.');
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rawSecret);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success('Secret key copied!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && verificationCode[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyAndEnable = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // First verify the code works with the secret
      const verifyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-oneauth-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'verify',
            code: code,
            user_email: userEmail || 'admin@example.com',
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        // Code is valid, now enable 2FA
        const enableResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zoho-oneauth-verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              action: 'enable',
              enable_email: userEmail || 'admin@example.com',
              secret: rawSecret,
            }),
          }
        );

        const enableData = await enableResponse.json();

        if (enableData.success) {
          setIsSetupComplete(true);
          toast.success('2FA enabled successfully!');
        } else {
          setError(enableData.error || 'Failed to enable 2FA');
        }
      } else {
        setError(verifyData.error || 'Invalid verification code');
        setVerificationCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const isCodeComplete = verificationCode.every(digit => digit !== '');

  if (isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-800/50 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">2FA Enabled!</h2>
            <p className="text-slate-400 mb-6">
              Your account is now protected with two-factor authentication.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* AirPak Logo with Glass Effect */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Glass background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 transform scale-110" />
            {/* Glowing ring */}
            <div className="absolute inset-[-4px] bg-gradient-to-r from-red-500/50 via-red-600/50 to-red-500/50 rounded-3xl blur-lg opacity-50" />
            {/* Logo Image - 3x size */}
            <img
              src="/airpak-logo-auth.png"
              alt="AirPak Express"
              className="relative h-28 w-auto object-contain drop-shadow-2xl p-3"
              style={{ filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.4))' }}
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Setup Two-Factor Authentication</h1>
          <p className="text-slate-400 text-sm">Secure your account with Zoho OneAuth</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/50">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Generating secure key...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h3 className="text-blue-200 font-medium mb-2 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  How to setup
                </h3>
                <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Open your Zoho OneAuth app on your phone</li>
                  <li>Tap the + button to add a new account</li>
                  <li>Scan the QR code below</li>
                  <li>Or enter the secret key manually</li>
                  <li>Enter the 6-digit code to verify and complete</li>
                </ol>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              )}

              {/* QR Code placeholder */}
              <div className="text-center mb-6">
                <div className="bg-white p-4 rounded-xl inline-block mb-3">
                  <div className="w-40 h-40 bg-slate-100 rounded-lg flex flex-col items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-800" />
                    <span className="text-xs text-slate-500 mt-1">QR Code</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Scan with Zoho OneAuth app</p>
              </div>

              {/* Manual Key */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Secret Key (for manual entry):
                </label>
                <div className="relative">
                  <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl font-mono text-sm text-slate-300 break-all select-all">
                    {manualKey || rawSecret || 'Generating...'}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Verification */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                  Enter the 6-digit code from your app
                </label>

                <div className="flex justify-center gap-2 mb-6">
                  {verificationCode.map((digit, index) => (
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
                  onClick={verifyAndEnable}
                  disabled={!isCodeComplete || isVerifying}
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
                      Verify & Enable 2FA
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup2FAPage;