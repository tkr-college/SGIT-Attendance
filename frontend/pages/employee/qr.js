import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function MyQr() {
  const [qr, setQr] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const intervalRef = useRef(null);

  const fetchQr = async () => {
    try {
      const { data } = await api.get('/employee/qr');
      setQr(data.qrDataUrl);
      setExpiresIn(data.expiresInMinutes);
      setSecondsLeft(data.expiresInMinutes * 60);
    } catch (err) {
      toast.error('Failed to load QR code');
    }
  };

  useEffect(() => {
    fetchQr();
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return s;
        if (s <= 1) {
          fetchQr(); // auto-rotate once it expires
          return null;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <Layout title="My QR Code">
      <div className="card max-w-md mx-auto text-center">
        <p className="text-sm text-gray-500 mb-4">
          This QR code is unique to you, signed by the server, and rotates automatically. A screenshot
          becomes useless once it expires.
        </p>
        {qr ? (
          <img src={qr} alt="Your attendance QR code" className="mx-auto rounded-xl border border-gray-200 dark:border-gray-800" />
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">Loading...</div>
        )}
        <div className="mt-4 text-sm text-gray-500">
          {secondsLeft !== null && secondsLeft > 0
            ? `Refreshes in ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
            : 'Refreshing...'}
        </div>
        <button className="btn-secondary mt-4" onClick={fetchQr}>
          Refresh now
        </button>
      </div>
    </Layout>
  );
}
