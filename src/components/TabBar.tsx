'use client';

type Props = {
  activeTab: 'learn' | 'practice';
  onSwitch: (tab: 'learn' | 'practice') => void;
};

export default function TabBar({ activeTab, onSwitch }: Props) {
  return (
    <div className="relative flex border-b border-white/10 mb-4">
      {/* Sliding indicator */}
      <div
        className="absolute bottom-0 h-[2px] bg-indigo-400 transition-all duration-300 ease-out"
        style={{
          width: '50%',
          transform: activeTab === 'learn' ? 'translateX(0%)' : 'translateX(100%)',
        }}
      />
      <button
        onClick={() => onSwitch('learn')}
        className={`flex-1 py-3 text-center text-sm font-bold transition-all duration-300 ${
          activeTab === 'learn'
            ? 'text-indigo-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        학습
      </button>
      <button
        onClick={() => onSwitch('practice')}
        className={`flex-1 py-3 text-center text-sm font-bold transition-all duration-300 ${
          activeTab === 'practice'
            ? 'text-indigo-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        자유연습
      </button>
    </div>
  );
}
