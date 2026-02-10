import { useEffect, useState } from "react";

type NotificationPermission = "default" | "granted" | "denied";

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if Notifications API is supported
        if ("Notification" in window) {
            setIsSupported(true);
            setPermission(Notification.permission as NotificationPermission);
        }
    }, []);

    const requestPermission = async (): Promise<NotificationPermission> => {
        if (!isSupported) {
            return "denied";
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result as NotificationPermission);
            localStorage.setItem("notification_permission_requested", "true");
            return result as NotificationPermission;
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return "denied";
        }
    };

    const showNotification = (title: string, options?: NotificationOptions) => {
        if (!isSupported || permission !== "granted") {
            console.warn("Notifications not available or not permitted");
            return;
        }

        try {
            new Notification(title, {
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                ...options,
            });
        } catch (error) {
            console.error("Error showing notification:", error);
        }
    };

    const hasRequestedBefore = (): boolean => {
        return localStorage.getItem("notification_permission_requested") === "true";
    };

    return {
        permission,
        isSupported,
        requestPermission,
        showNotification,
        hasRequestedBefore,
    };
}
