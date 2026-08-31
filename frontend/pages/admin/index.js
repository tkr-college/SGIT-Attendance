import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';

function StatCard({ label, value, tone }) {
  const toneClass = {
    default: 'text-brand-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }[tone || 'default'];
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    load();
  }, [date]);

  const load = async () => {
    const { data } = await api.get('/admin/dashboard', { params: { date } });
    setStats(data);
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-500">Date:</label>
        <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? '—'} />
        <StatCard label="Present" value={stats?.present ?? '—'} tone="green" />
        <StatCard label="Late" value={stats?.late ?? '—'} tone="yellow" />
        <StatCard label="Absent" value={stats?.absent ?? '—'} tone="red" />
      </div>

      <div className="mt-6 card">
        <p className="text-sm text-gray-500">Pending checkouts today</p>
        <p className="text-2xl font-bold">{stats?.pendingCheckouts ?? '—'}</p>
      </div>
    </Layout>
  );
}
