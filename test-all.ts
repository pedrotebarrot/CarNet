import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from './src/firebase/config';

console.log("Initializing Test Script...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

async function runTests() {
  const ts = Date.now();
  const testEmail = `test_${ts}@example.com`;
  
  try {
    console.log("1. Testing Auth Create Custom User...");
    const userCred = await createUserWithEmailAndPassword(auth, testEmail, "password123");
    console.log("Auth User Created:", userCred.user.uid);
    
    console.log("2. Testing Firestore Dealership Query (Slug check)...");
    const q = query(collection(db, 'dealerships'), where('slug', '==', 'test-slug'));
    const qs = await getDocs(q);
    console.log("Query success. Is empty?", qs.empty);
    
    console.log("3. Testing Storage Upload...");
    const storageRef = ref(storage, `logos/test_${ts}.txt`);
    await uploadString(storageRef, 'Hello Storage');
    const url = await getDownloadURL(storageRef);
    console.log("Storage upload success. URL:", url);
    
    console.log("4. Testing Firestore Write Dealership...");
    const docRef = await addDoc(collection(db, 'dealerships'), { name: 'Test', ownerId: userCred.user.uid });
    console.log("Firestore Write success. Doc ID:", docRef.id);
    
    console.log("All systems GO!");
  } catch(error: any) {
    console.error("Test failed at some step:", error.code || error.message, error);
  }
  process.exit(0);
}

runTests();
