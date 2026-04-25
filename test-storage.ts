import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { firebaseConfig } from './src/firebase/config';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

async function testStorage() {
  try {
    // We try to sign in with a new user or just an anonymous write if rules allow
    const user = await signInWithEmailAndPassword(auth, "test@example.com", "password123").catch(e => {
        console.log("Failed to sign in, testing without auth");
        return null;
    });
    
    console.log("Testing Storage write...");
    const storageRef = ref(storage, 'test/test.txt');
    await uploadString(storageRef, 'Hello, world!');
    console.log("Storage write successful!");
  } catch(e: any) {
    console.error("Storage error:", e);
  }
  process.exit(0);
}

testStorage();
