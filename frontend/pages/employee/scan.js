import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import api, { getDeviceId } from '../../lib/api';
import toast from 'react-hot-toast';

export default function Scan() {
  const router = useRouter();
  const [action, setAction] = useState('check-in');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported on this device'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const handleDecoded = async (qrToken) => {
    if (!scanning) return; // avoid double-fire
    setScanning(false);
    await stopScanner();

    try {
      const loc = await getLocation();
      const { data } = await api.post('/attendance/scan', {
        qrToken,
        action,
        lat: loc.lat,
        lng: loc.lng,
        deviceId: getDeviceId(),
      });
      setResult({ ok: true, message: data.message, record: data.record });
      toast.success(data.message);
      setTimeout(() => {
        router.push('/employee');
      }, 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Scan failed';
      setResult({ ok: false, message: msg });
      toast.error(msg);
    }
  };

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
    const { Html5Qrcode } = await import('html5-qrcode');
    const qr = new Html5Qrcode('qr-reader');
    html5QrRef.current = qr;
    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 280, aspectRatio: 1.0 },
        (decodedText) => handleDecoded(decodedText),
        () => {} // ignore per-frame scan failures
      );
    } catch (err) {
      toast.error('Unable to access camera: ' + err);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop();
        await html5QrRef.current.clear();
      }
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <Layout title="Scan Attendance">
      <div className="card max-w-lg mx-auto">
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 py-2 rounded-xl font-medium ${action === 'check-in' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            onClick={() => setAction('check-in')}
          >
            Check-in
          </button>
          <button
            className={`flex-1 py-2 rounded-xl font-medium ${action === 'check-out' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            onClick={() => setAction('check-out')}
          >
            Check-out
          </button>
        </div>

        <div id="qr-reader" className="rounded-xl overflow-hidden bg-black min-h-[280px]" />

        <div className="mt-4 flex gap-3">
          {!scanning ? (
            <button className="btn-primary w-full" onClick={startScanner}>
              Start Camera & Scan
            </button>
          ) : (
            <button className="btn-secondary w-full" onClick={() => { setScanning(false); stopScanner(); }}>
              Cancel
            </button>
          )}
        </div>

        {result && (
          <div
            className={`mt-4 p-6 rounded-xl text-center ${
              result.ok
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <div className="text-4xl mb-2">{result.ok ? '✅' : '❌'}</div>
            <div className="text-lg font-semibold">{result.message}</div>
            {result.ok && (
              <div className="text-sm text-green-600 mt-2">Taking you to your dashboard...</div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Note: point your camera at your own "My QR Code" page (open on another device) or an office
          kiosk QR display. Location access is required to confirm you're on-site.
        </p>
      </div>
    </Layout>
  );
}

