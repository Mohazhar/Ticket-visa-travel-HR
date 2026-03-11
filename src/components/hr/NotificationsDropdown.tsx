'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
}

export function NotificationsDropdown({
    onNavigate
}: {
    onNavigate?: (page: 'dashboard' | 'apply-leave' | 'payslips' | 'expenses' | 'admin') => void
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const initialLoadDone = useRef(false);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();

                setUnreadCount((prevCount) => {
                    const newCount = data.unreadCount || 0;

                    // Play a sound if we receive a new notification after the initial load
                    if (initialLoadDone.current && newCount > prevCount) {
                        try {
                            const audio = new Audio('/notify.wav');
                            audio.play().catch(e => console.log('Audio autoplay prevented by browser'));
                        } catch (error) {
                            console.error('Audio play error', error);
                        }
                    }

                    return newCount;
                });

                setNotifications(data.notifications || []);
                initialLoadDone.current = true;
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Setup fast polling every 5 seconds for immediate notifications
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id?: string) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(id ? { notificationId: id } : {}),
            });

            if (response.ok) {
                // Optimistically update UI
                if (id) {
                    setNotifications(prev =>
                        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } else {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                    <DropdownMenuLabel className="p-0 text-base font-semibold">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead()}
                            className="h-auto px-2 py-1 text-xs text-primary hover:text-primary/80"
                        >
                            <Check className="mr-1 h-3 w-3" />
                            Mark all as read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 p-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? 'bg-primary/5 font-medium' : 'text-muted-foreground'
                                        }`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!notification.isRead) markAsRead(notification.id);
                                        if (onNavigate) {
                                            if (notification.type === 'leave_request') {
                                                onNavigate('admin'); // For Admins processing requested leaves
                                            } else if (notification.type === 'leave_status') {
                                                onNavigate('apply-leave'); // For Employees viewing their leave history
                                            }
                                        }
                                    }}
                                >
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <span className="text-sm font-semibold leading-none text-foreground">
                                            {notification.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(notification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
