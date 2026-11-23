'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Checks the browser session once a protected page is mounted. */
export function useProtectedSession(getAccessToken: () => string | null) {
	const router = useRouter();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (!getAccessToken()) {
			router.replace('/login');
			return;
		}
		setReady(true);
	}, [getAccessToken, router]);

	return ready;
}