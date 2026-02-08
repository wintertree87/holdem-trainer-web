'use client';

type Props = {
  activeTab: 'learn' | 'practice';
  onSwitch: (tab: 'learn' | 'practice') => void;
};

export default function TabBar({ activeTab, onSwitch }: Props) {
  return (
    <div className="flex border-b border-white/10 mb-4">
      <button
        onClick={() => onSwitch('learn')}
        className={`flex-1 py-3 text-center text-sm font-bold transition ${
          activeTab === 'learn'
            ? 'text-indigo-400 border-b-2 border-indigo-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        학습
      </button>
      <button
        onClick={() => onSwitch('practice')}
        className={`flex-1 py-3 text-center text-sm font-bold transition ${
          activeTab === 'practice'
            ? 'text-indigo-400 border-b-2 border-indigo-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        자유연습
      </button>
    </div>
  );
}
