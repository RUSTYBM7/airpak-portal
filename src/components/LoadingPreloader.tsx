import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface LoadingPreloaderProps {
  isLoading: boolean;
  message?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function LoadingPreloader({
  isLoading,
  message = 'Loading...',
  onDismiss,
  autoHide = true,
  duration = 1500
}: LoadingPreloaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && autoHide && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isLoading, autoHide, onDismiss, duration]);

  if (!isLoading) return null;

  return (
    <>
      <style>{`
        .ap-preloader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #0a0a12 0%, #1a0808 50%, #0a0a12 100%);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: preloaderFadeIn 0.3s ease;
        }

        @keyframes preloaderFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .preloader-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        .preloader-logo {
          height: 56px;
          width: auto;
        }

        .preloader-brand-name {
          font-family: 'Sarabun', 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.2px;
        }

        .preloader-atom {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
        }

        .preloader-nucleus {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #CD2727;
          box-shadow: 0 0 20px rgba(205, 39, 39, 0.8), 0 0 40px rgba(205, 39, 39, 0.4);
        }

        .preloader-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1.5px solid rgba(205, 39, 39, 0.25);
          transform: translate(-50%, -50%);
        }

        .preloader-orbit-1 {
          width: 80px;
          height: 80px;
          animation: spinOrbit1 3s linear infinite;
        }

        .preloader-orbit-2 {
          width: 60px;
          height: 60px;
          animation: spinOrbit2 4s linear infinite reverse;
        }

        .preloader-orbit-3 {
          width: 90px;
          height: 40px;
          animation: spinOrbit3 2.5s linear infinite;
        }

        .preloader-electron {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 80, 80, 0.9);
          box-shadow: 0 0 6px rgba(255, 80, 80, 0.6);
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }

        .preloader-electron-2 { top: auto; bottom: 0; }
        .preloader-electron-3 { top: 50%; left: auto; right: 0; transform: translateY(-50%); }

        @keyframes spinOrbit1 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes spinOrbit2 {
          from { transform: translate(-50%, -50%) rotateX(60deg) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotateX(60deg) rotate(360deg); }
        }

        @keyframes spinOrbit3 {
          from { transform: translate(-50%, -50%) rotateX(30deg) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotateX(30deg) rotate(360deg); }
        }

        .preloader-status {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.2px;
          margin-top: 16px;
        }

        .preloader-dots::after {
          content: '';
          display: inline-block;
          animation: dotAnimation 1.4s steps(4, end) infinite;
        }

        @keyframes dotAnimation {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }

        .preloader-bar-container {
          width: 200px;
          height: 3px;
          background: rgba(205, 39, 39, 0.15);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 20px;
        }

        .preloader-bar {
          height: 100%;
          background: linear-gradient(90deg, #CD2727, #ff4444);
          border-radius: 3px;
          animation: orbBar 1.8s ease-in-out infinite;
          width: 0;
        }

        @keyframes orbBar {
          0% { width: 0; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .preloader-dots-anim {
          display: flex;
          gap: 6px;
          margin-top: 16px;
        }

        .preloader-dot-anim {
          width: 7px;
          height: 7px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          animation: preDot 1.2s ease-in-out infinite;
        }

        .preloader-dot-anim:nth-child(2) { animation-delay: 0.2s; }
        .preloader-dot-anim:nth-child(3) { animation-delay: 0.4s; }

        @keyframes preDot {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        .preloader-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
        }

        .preloader-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
      `}</style>

      <div className="ap-preloader-overlay">
        {onDismiss && (
          <button className="preloader-close" onClick={onDismiss} aria-label="Dismiss">
            <X size={18} />
          </button>
        )}

        <div className="preloader-brand">
          <svg className="preloader-logo" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#CD2727"/>
            <path d="M12 20h16M20 12v16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="20" cy="20" r="6" fill="none" stroke="white" strokeWidth="2"/>
            <text x="50" y="26" fill="#CD2727" fontFamily="Sarabun, sans-serif" fontSize="18" fontWeight="800">Airpak Express</text>
          </svg>
        </div>

        <div className="preloader-atom">
          <div className="preloader-nucleus"></div>
          <div className="preloader-orbit preloader-orbit-1">
            <div className="preloader-electron"></div>
          </div>
          <div className="preloader-orbit preloader-orbit-2">
            <div className="preloader-electron preloader-electron-2"></div>
          </div>
          <div className="preloader-orbit preloader-orbit-3">
            <div className="preloader-electron preloader-electron-3"></div>
          </div>
        </div>

        <div className="preloader-status">
          {message}<span className="preloader-dots"></span>
        </div>

        <div className="preloader-bar-container">
          <div className="preloader-bar"></div>
        </div>

        <div className="preloader-dots-anim">
          <div className="preloader-dot-anim"></div>
          <div className="preloader-dot-anim"></div>
          <div className="preloader-dot-anim"></div>
        </div>
      </div>
    </>
  );
}

// Hook for managing loading state across the app
export function usePageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const startLoading = useCallback((message?: string) => {
    setLoadingMessage(message || 'Loading...');
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return { isLoading, loadingMessage, startLoading, stopLoading, setLoadingMessage };
}