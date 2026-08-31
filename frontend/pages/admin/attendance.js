import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await api.get('/attendance', { params: { from, to } });
    setRecords(data.records);
  };

  const exportCsv = async () => {
    const { data } = await api.get('/admin/export', {
      params: { from, to },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${from || 'all'}_${to || 'all'}.csv`;
    a.click();
  };

  return (
    <Layout title="Attendance Logs">
      <div className="card mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm text-gray-500 block mb-1">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-500 block mb-1">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={load}>Filter</button>
        <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Employee</th>
              <th className="py-2 pr-4">Code</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Check-in</th>
              <th className="py-2 pr-4">Check-out</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id} className="border-b border-gray-100 dark:border-gray-900">
                <td className="py-2 pr-4">{r.date}</td>
                <td className="py-2 pr-4">{r.employee?.name}</td>
                <td className="py-2 pr-4">{r.employee?.employeeCode}</td>
                <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                <td className="py-2 pr-4">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}</td>
                <td className="py-2 pr-4">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '—'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-gray-400">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
