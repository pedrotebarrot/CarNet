
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from './src/firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite() {
    console.log('Testing Firestore Write...');
    try {
        const testDocRef = doc(db, 'dealerships', 'test-write-permission');
        await setDoc(testDocRef, {
            name: 'Test Dealership',
            updatedAt: new Date(),
        });
        console.log('Write successful!');
    } catch (error) {
        console.error('Write failed:', error);
    }
}

testWrite();
