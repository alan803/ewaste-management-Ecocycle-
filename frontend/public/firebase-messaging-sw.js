importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyAc3jZ4zgDyYjto6A3lexqQ0Yj0fvPVFX4",
    authDomain: "ecocycle-23f06.firebaseapp.com",
    projectId: "ecocycle-23f06",
    storageBucket: "ecocycle-23f06.firebasestorage.app",
    messagingSenderId: "1030719798521",
    appId: "1:1030719798521:web:221cc9773a7a9486357628"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[firebase-messaging-sw.js] Background message:",
        payload
    );

    const notificationTitle =
        payload.notification?.title || "EcoCycle";

    const notificationOptions = {
        body:
            payload.notification?.body ||
            "You have a new notification.",
        icon: "/logo.png"
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});