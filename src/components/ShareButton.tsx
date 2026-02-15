'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

type Props = {
  text: string;
  url: string;
};

export default function ShareButton({ text, url }: Props) {
  const [copied, setCopied] = useState(false);

  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  const handleShare = async () => {
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // user cancelled
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  };

  return (
    <button
      onClick={handleShare}
      className="py-3.5 px-5 bg-white/5 backdrop-blur rounded-xl text-gray-300 text-[15px] font-bold hover:bg-white/10 hover:scale-[1.03] active:scale-[0.98] transition flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <Check size={18} /> 복사 완료!
        </>
      ) : (
        <>
          결과 공유하기 <Share2 size={18} />
        </>
      )}
    </button>
  );
}
