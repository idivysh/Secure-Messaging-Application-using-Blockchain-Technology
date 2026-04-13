import { initializeApp } from 'firebase/app';
// @ts-ignore: getReactNativePersistence exists in the RN bundle 
// but is often missing from public TypeScript definitions.
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDB6pQWDfq_n-PN18vNQnKoM7mTaz1i9LI",
  authDomain: "smaubct.firebaseapp.com",
  projectId: "smaubct",
  storageBucket: "smaubct.firebasestorage.app",
  messagingSenderId: "39913426285",
  appId: "1:39913426285:web:2b7be16f4fc510adc25e64",
};

const app = initializeApp(firebaseConfig);

// ✅ THIS IS THE KEY FIX
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);