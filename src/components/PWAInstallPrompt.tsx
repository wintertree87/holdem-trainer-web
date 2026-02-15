'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Install prompt logic
  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Already dismissed
    if (localStorage.getItem('pwa-dismissed')) return;

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !('MSStream' in window);
    setIsIOS(ios);

    if (ios) {
      const t = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(t);
    }

    // Android/Chrome: listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-[468px] mx-auto bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 shadow-xl z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">📱</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200">
            홈 화면에 추가하세요
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {isIOS
              ? '하단 공유 버튼(□↑) → "홈 화면에 추가"'
              : '앱처럼 바로 실행할 수 있어요'}
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shrink-0"
          >
            설치
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none shrink-0 -mt-0.5"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
