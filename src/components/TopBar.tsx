import type { SpaceTab } from '../types/t5';

interface TopBarProps {
  activeTab: SpaceTab;
  onTabChange: (tab: SpaceTab) => void;
}

const NAV_ITEMS: Array<{ id: SpaceTab; label: string }> = [
  { id: 'playground', label: 'Playground' },
  { id: 'tokenizer', label: 'Tokenizer' },
  { id: 'model-card', label: 'Model Card' },
  { id: 'space-files', label: 'Space Files' },
];

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-6">
        <button
          type="button"
          onClick={() => onTabChange('playground')}
          className="font-display cursor-pointer text-lg font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          google-t5/t5-small
        </button>

        <nav aria-label="Space sections" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`cursor-pointer py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'border-blue-600 text-zinc-900'
                    : 'border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('space-files')}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Deploy Space
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile sections"
        className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-zinc-100 px-6 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`cursor-pointer py-1 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 ${
                isActive ? 'border-blue-600 text-zinc-900' : 'border-transparent text-zinc-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
