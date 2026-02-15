'use client';

export type Tab = 'learn' | 'practice' | 'game';

type Props = {
  activeTab: Tab;
  onSwitch: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'learn', label: '트레이닝' },
  { id: 'practice', label: '프리롤' },
  { id: 'game', label: '대전' },
];

export default function TabBar({ activeTab, onSwitch }: Props) {
  const activeIndex = TABS.findIndex(t => t.id === activeTab);
  const tabWidth = 100 / TABS.length;

  return (
    <div className="relative flex border-b border-white/10 mb-4">
      {/* Sliding indicator */}
      <div
        className="absolute bottom-0 h-[2px] bg-indigo-400 transition-all duration-300 ease-out"
        style={{
          width: `${tabWidth}%`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSwitch(tab.id)}
          className={`flex-1 py-3 text-center text-sm font-bold transition-all duration-300 ${
            activeTab === tab.id
              ? 'text-indigo-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
