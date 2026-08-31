import { getApp, getApps, initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDaipER6pWZ0JMofkshxyPkwbbVNrq9S9A",
  authDomain: "gentalk-595d2.firebaseapp.com",
  projectId: "gentalk-595d2",
  storageBucket: "gentalk-595d2.firebasestorage.app",
  messagingSenderId: "513534244833",
  appId: "1:513534244833:web:eaa56d2d3f2dc3172884a0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = createAuth();
