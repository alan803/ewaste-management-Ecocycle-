import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyAc3jZ4zgDyYjto6A3lexqQ0Yj0fvPVFX4",
    authDomain: "ecocycle-23f06.firebaseapp.com",
    projectId: "ecocycle-23f06",
    storageBucket: "ecocycle-23f06.firebasestorage.app",
    messagingSenderId: "1030719798521",
    appId: "1:1030719798521:web:221cc9773a7a9486357628"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);