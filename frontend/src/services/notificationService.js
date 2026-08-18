import { getToken } from "firebase/messaging";
import { messaging } from "../firebase";

export const enableNotifications = async () => {

    try {

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey: "BFYNnvfdN5oZYtDfqvZ8o8N7bvlCN4T6FDG1AMj4IgTDzNzWT3-zZjTIh5i3Z4fwkaAHNqFcl3KSszbLvBEkNqM"
        });

        if (!token) {
            console.log("No FCM token received");
            return null;
        }

        console.log("FCM Token:", token);

        return token;

    } catch (error) {

        console.error("Notification error:", error);

        return null;
    }
};