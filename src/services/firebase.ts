import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import rawConfig from '../../firebase-applet-config.json';

// Firebase configuration using applet credentials with environment fallback
export const currentFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId
};

export const firebaseConfig = currentFirebaseConfig;
export const isRealFirebaseConfigured = Boolean(currentFirebaseConfig.apiKey && currentFirebaseConfig.projectId);

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(currentFirebaseConfig);
} else {
  app = getApp();
}

export { app };

export const auth: Auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {
  // Persistence fallback
}

/* CRITICAL: Passing firestoreDatabaseId and enabling experimentalForceLongPolling prevents 10s proxy stream timeouts in web previews */
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, currentFirebaseConfig.firestoreDatabaseId || undefined);
  } catch {
    return getFirestore(app, currentFirebaseConfig.firestoreDatabaseId || undefined);
  }
})();

export const storage: FirebaseStorage = getStorage(app);

// Connection test on boot as recommended in Skill
async function testConnection() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach Cloud Firestore backend'))) {
      console.warn("[Firebase] Client operating in offline mode or initializing backend connection.");
    }
  }
}
export const testFirebaseHealth = testConnection;
testConnection();

/**
 * Upload a file/image to Firebase Storage with automatic fallback
 */
export async function uploadFileToStorage(folder: string, fileName: string, file: File | Blob): Promise<string> {
  try {
    const cleanName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const storageRef = ref(storage, `${folder}/${cleanName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn(`[Firebase Storage] Could not upload ${fileName} to storage, falling back to base64 reader:`, err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80');
      reader.readAsDataURL(file);
    });
  }
}

export default app;
