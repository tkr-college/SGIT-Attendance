import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getStoredUser } from '../lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) router.replace('/login');
    else router.replace(user.role === 'admin' ? '/admin' : '/employee');
  }, []);
  return null;
}
