import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Bell, BellOff } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

export function NotificationPermission() {
    const [open, setOpen] = useState(false);
    const { permission, isSupported, requestPermission, hasRequestedBefore } = useNotifications();

    useEffect(() => {
        // Show dialog if notifications are supported, not yet requested, and permission not already granted
        if (isSupported && !hasRequestedBefore() && permission === "default") {
            // Delay showing the dialog slightly so it doesn't appear immediately on page load
            const timer = setTimeout(() => {
                setOpen(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSupported, permission, hasRequestedBefore]);

    const handleAllow = async () => {
        const result = await requestPermission();
        if (result === "granted") {
            toast.success("Notifications enabled! You'll receive important updates.");
        } else if (result === "denied") {
            toast.error("Notifications blocked. You can enable them in your browser settings.");
        }
        setOpen(false);
    };

    const handleDismiss = () => {
        localStorage.setItem("notification_permission_requested", "true");
        setOpen(false);
        toast.info("You can enable notifications anytime from Settings.");
    };

    if (!isSupported) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <Bell className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">Enable Notifications</DialogTitle>
                    <DialogDescription className="text-center text-base space-y-2">
                        <p>Stay updated with important placement announcements and drive notifications.</p>
                        <ul className="text-left mt-4 space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Get instant alerts for new placement drives</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Receive application status updates</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Never miss important announcements</span>
                            </li>
                        </ul>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleDismiss}
                        className="w-full sm:w-auto"
                    >
                        <BellOff className="h-4 w-4 mr-2" />
                        Maybe Later
                    </Button>
                    <Button
                        onClick={handleAllow}
                        className="w-full sm:w-auto gradient-primary"
                    >
                        <Bell className="h-4 w-4 mr-2" />
                        Enable Notifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
