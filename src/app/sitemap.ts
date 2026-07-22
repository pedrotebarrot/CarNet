import type { MetadataRoute } from 'next';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { SITE_URL } from '@/lib/site-url';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    const entries: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ];

    const dealershipsSnap = await getDocs(collection(firestore, 'dealerships'));

    for (const dealershipDoc of dealershipsSnap.docs) {
        const dealership = dealershipDoc.data();
        if (!dealership.slug) continue;

        entries.push({
            url: `${SITE_URL}/${dealership.slug}`,
            changeFrequency: 'daily',
            priority: 0.8,
        });

        const vehiclesSnap = await getDocs(
            query(
                collection(firestore, 'vehicles'),
                where('dealershipId', '==', dealershipDoc.id),
                where('status', '==', 'available'),
            ),
        );

        for (const vehicleDoc of vehiclesSnap.docs) {
            entries.push({
                url: `${SITE_URL}/${dealership.slug}/${vehicleDoc.id}`,
                changeFrequency: 'daily',
                priority: 0.6,
            });
        }
    }

    return entries;
}
