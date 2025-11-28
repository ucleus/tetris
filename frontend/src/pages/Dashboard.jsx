import { useMemo, useState } from 'react';
import { BoltIcon, ExclamationTriangleIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';
import DashboardSidebar from '../components/DashboardSidebar';

function MetricCard({ title, value, subtitle, trend }) {
  const trendColor = trend?.startsWith('+') ? 'text-emerald-600' : 'text-amber-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold">{value}</p>
        {trend && <span className={`text-xs ${trendColor}`}>{trend}</span>}
      </div>
      <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function ActivityItem({ label, status, timestamp }) {
  const badgeColor = status === 'Delayed' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-gray-500">{timestamp}</p>
      </div>
      <span className={`badge ${badgeColor}`}>{status}</span>
    </div>
  );
}

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const metrics = useMemo(
    () => [
      { title: 'MRR', value: '$182,400', subtitle: 'Last 30 days • Stripe', trend: '+12.4%' },
      { title: 'Orders fulfilled', value: '312', subtitle: 'Clinic & hospital shipments', trend: '+8.1%' },
      { title: 'Avg. SLA', value: '2.4 days', subtitle: 'Logistics window', trend: '-0.3 days' },
      { title: 'Risk & disputes', value: '0.9%', subtitle: 'Chargebacks + QA flags', trend: '-18 bps' },
    ],
    []
  );

  const insightTiles = useMemo(
    () => [
      {
        icon: <GlobeAmericasIcon className="h-5 w-5 text-primary" />,
        title: 'Top regions',
        body: 'TX, FL, and CA clinics drove 64% of revenue this sprint with growing basket sizes.',
      },
      {
        icon: <BoltIcon className="h-5 w-5 text-amber-500" />,
        title: 'Operational alerts',
        body: 'Two sterilization vendors are at capacity next week; reroute refurb SKUs to Dallas hub.',
      },
      {
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-rose-500" />,
        title: 'QA checks',
        body: 'Probe-tip recall batch cleared. Continue spot-audits for tymp calibrations > 90 days.',
      },
    ],
    []
  );

  const activity = useMemo(
    () => [
      { label: 'Stripe payout initiated ($42,800)', status: 'Completed', timestamp: 'Today • 09:20' },
      { label: 'Dallas hub rerouted 18 orders', status: 'In flight', timestamp: 'Today • 07:15' },
      { label: 'Logistics SLA breach prevented', status: 'Completed', timestamp: 'Yesterday • 17:04' },
      { label: 'Audiometer refurb lot QA', status: 'Delayed', timestamp: 'Yesterday • 14:48' },
    ],
    []
  );

  const chartData = [72, 55, 48, 63, 84, 91, 77];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 space-y-6">
          <header className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">Backend Dashboard</p>
              <h1 className="text-2xl font-bold">Analytics & Ops Control</h1>
              <p className="text-sm text-gray-500">{activeTab === 'overview' ? 'Realtime commerce + logistics insights' : 'Contextual analytics per feature tab.'}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">Healthy</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-200">Updated 2m ago</span>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Fulfillment velocity</h2>
                  <p className="text-sm text-gray-500">Orders shipped within SLA window</p>
                </div>
                <span className="badge bg-primary/10 text-primary dark:bg-primary/20">7 day view</span>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-2">
                {chartData.map((value, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-primary/20 to-primary"
                      style={{ height: `${value}%`, minHeight: '48px' }}
                    />
                    <span className="text-xs text-gray-500">D{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Ops feed</h2>
                <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">Today</span>
              </div>
              <div className="space-y-3">
                {activity.map((item) => (
                  <ActivityItem key={item.label} {...item} />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {insightTiles.map((tile) => (
              <div key={tile.title} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-800">{tile.icon}</div>
                <div>
                  <h3 className="text-base font-semibold">{tile.title}</h3>
                  <p className="text-sm text-gray-500">{tile.body}</p>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
