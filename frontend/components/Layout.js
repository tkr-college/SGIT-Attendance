import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { clearSession, getStoredUser } from '../lib/api';

const employeeLinks = [
  { href: '/employee', label: 'Dashboard' },
  { href: '/employee/qr', label: 'My QR Code' },
  { href: '/employee/scan', label: 'Scan Attendance' },
  { href: '/employee/history', label: 'Attendance History' },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/attendance', label: 'Attendance Logs' },
];

export default function Layout({ children, title }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
    setDark(localStorage.getItem('theme') === 'dark');
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const logout = () => {
    clearSession();
    router.replace('/login');
  };

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-5 font-bold text-lg text-brand-600">QR Attendance</div>
        <nav className="flex-1 px-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                router.pathname === link.href
                  ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-sm">
          <div className="font-medium">{user.name}</div>
          <div className="text-gray-500 text-xs mb-3">{user.role}</div>
          <button onClick={logout} className="btn-secondary w-full text-sm">
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="btn-secondary text-sm">
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="md:hidden">
              <button onClick={logout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
