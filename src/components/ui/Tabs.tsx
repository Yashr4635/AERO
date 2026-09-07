import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, className = '', onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        className="flex border-b border-border-subtle gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(e) => {
              const currentIndex = tabs.findIndex((t) => t.id === activeTab);
              if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                handleTabChange(tabs[currentIndex + 1].id);
              } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                handleTabChange(tabs[currentIndex - 1].id);
              }
            }}
            className={`
              px-4 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer
              border-b-2 -mb-px transition-colors duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
              ${activeTab === tab.id
                ? 'border-[#35C7FF] text-[#35C7FF]'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
              }
            `}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 text-[11px] rounded-full bg-bg-surface text-text-secondary">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="pt-4"
      >
        {activeContent}
      </div>
    </div>
  );
}
