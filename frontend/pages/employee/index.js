import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import api, { getStoredUser } from '../../lib/api';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const [today, setToday] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await api.get('/employee/my-attendance');
      const todayStr = new Date().toISOString().slice(0, 10);
      setToday(data.records.find((r) => r.date === todayStr) || null);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Layout title="Employee Dashboard">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-4">Today's Status</h2>
          {today ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-28">Status:</span>
                <StatusBadge status={today.status} />
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28">Check-in:</span>
                <span>{today.checkInTime ? new Date(today.checkInTime).toLocaleTimeString() : '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28">Check-out:</span>
                <span>{today.checkOutTime ? new Date(today.checkOutTime).toLocaleTimeString() : '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">You haven't checked in today yet.</p>
          )}
          <div className="mt-6 flex gap-3">
            <Link href="/employee/scan" className="btn-primary">
              Scan Attendance
            </Link>
            <Link href="/employee/qr" className="btn-secondary">
              View My QR
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Employee Info</h2>
          <p className="text-sm text-gray-500">Name: {user?.name}</p>
          <p className="text-sm text-gray-500">Code: {user?.employeeCode}</p>
          <p className="text-sm text-gray-500">Email: {user?.email}</p>
        </div>
      </div>
    </Layout>
  );
}
