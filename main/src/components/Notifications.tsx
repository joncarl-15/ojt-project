import { API_BASE_URL } from '../config';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from './Card';
import { Bell, FileText, MessageSquare, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    type: 'message' | 'document' | 'task';
    id: string;
    title: string;
    content: string;
    createdAt: string;
    metadata: any;
}

export const Notifications: React.FC = () => {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/user/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [token]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <MessageSquare size={18} />;
            case 'document': return <FileText size={18} />;
            case 'task': return <CheckSquare size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'message': return 'bg-blue-100 text-blue-600';
            case 'document': return 'bg-orange-100 text-orange-600';
            case 'task': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getLink = (notification: Notification) => {
        switch (notification.type) {
            case 'message': return '/messages';
            case 'document': return '/upload-documents'; // Or highlights specific document
            case 'task': return '/my-tasks';
            default: return '#';
        }
    };

    if (isLoading) return <div className="animate-pulse h-48 bg-gray-100 rounded-xl"></div>;

    if (notifications.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="text-green-600" size={20} />
                        Recent Activity
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No recent notifications or updates.
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="text-green-600" size={20} />
                    Recent Activity
                </h3>
            </CardHeader>
            <CardBody className="p-0">
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                    {notifications.map((notification, index) => (
                        <Link
                            to={getLink(notification)}
                            key={index}
                            className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors block"
                        >
                            <div className={`p-2 rounded-full shrink-0 ${getColor(notification.type)}`}>
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{notification.content}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
};
