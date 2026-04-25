import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from './src/firebase/config';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  try {
    await signInWithEmailAndPassword(auth, "test@example.com", "password123");
    console.log("Auth Sign In worked");
  } catch(e: any) {
    if(e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-email') {
       console.log("Auth is ENABLED. Success!");
    } else if(e.code === 'auth/operation-not-allowed') {
       console.log("Auth Email/Password is DISABLED.");
    } else {
       console.error("Auth error:", e.code, e.message);
    }
    process.exit(0);
  }
}
testAuth();
