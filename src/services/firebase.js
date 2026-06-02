import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7z10M2yfiPm57oR_nPaMR8AjE5qR0Nqw",
  authDomain: "autoescola-agendamento-a3af0.firebaseapp.com",
  projectId: "autoescola-agendamento-a3af0",
  storageBucket: "autoescola-agendamento-a3af0.firebasestorage.app",
  messagingSenderId: "1006303919517",
  appId: "1:1006303919517:web:f7ba9b789bd9b3c4b84374",
  measurementId: "G-W1659LZ1RL",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
