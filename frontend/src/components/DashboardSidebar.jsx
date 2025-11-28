import { useMemo } from 'react';
import {
  Bars3Icon,
  ChartBarSquareIcon,
  CursorArrowRaysIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export default function DashboardSidebar({ collapsed, onToggle, activeTab, onSelectTab }) {
  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: ChartBarSquareIcon, badge: 'Live' },
      { id: 'orders', label: 'Orders', icon: ShoppingBagIcon, badge: '12' },
      { id: 'inventory', label: 'Inventory', icon: RectangleStackIcon },
      { id: 'customers', label: 'Customers', icon: UserGroupIcon },
      { id: 'marketing', label: 'Marketing', icon: CursorArrowRaysIcon },
      { id: 'ops', label: 'Ops & QA', icon: WrenchScrewdriverIcon },
    ],
    []
  );

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-950 ${collapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white font-black">AS</div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold">Audical Admin</p>
              <p className="text-xs text-gray-500">Analytics & Ops</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="rounded-md border border-gray-200 bg-gray-50 p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span className="flex-1 text-left">{tab.label}</span>}
              {!collapsed && tab.badge && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-gray-100 px-4 py-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? 'v1.3' : 'Compliance ready • v1.3'}
      </div>
    </aside>
  );
}
