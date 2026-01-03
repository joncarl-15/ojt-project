import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Building2, RefreshCw, ClipboardList, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch dashboard stats
                const response = await fetch(`/api/user/dashboard?userId=${user._id}&userRole=${user.role}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.dashboard) {
                    setDashboardData(data.dashboard);
                }

                // Fetch announcements
                const announcementsResponse = await fetch(`/api/announcement`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const announcementsData = await announcementsResponse.json();
                if (Array.isArray(announcementsData)) {
                    setAnnouncements(announcementsData.slice(0, 5)); // Show max 5 announcements
                }

                // Fetch messages for unread count
                const messagesResponse = await fetch('/api/message', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const messagesData = await messagesResponse.json();
                if (Array.isArray(messagesData)) {
                    const unread = messagesData.filter((msg: any) => msg.receiver._id === user._id && !msg.isRead).length;
                    setNewMessageCount(unread);
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();
    }, [user, token]);

    const handleRefresh = () => {
        window.location.reload();
    };

    if (!user) return null;

    if (user.role === 'student') {
        const studentStats = [
            {
                label: 'Total Tasks',
                value: dashboardData?.totalTasks || 0,
                icon: <ClipboardList className="text-green-600" />,
                color: 'bg-green-50'
            },
            {
                label: 'New Messages',
                value: newMessageCount,
                icon: <Users className="text-green-600" />,
                color: 'bg-green-50'
            },
            {
                label: 'User Role',
                value: <span className="capitalize">{user.role}</span>,
                icon: <UserIcon className="text-green-600" />,
                color: 'bg-green-50'
            }
        ];

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                        <p className="text-gray-500">Welcome back, {user?.username}!</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 bg-white border border-green-500 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {studentStats.map((stat, index) => (
                        <Card key={index}>
                            <CardBody className="flex items-center space-x-3">
                                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-500 truncate">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Message Alert */}
                {newMessageCount > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h4 className="text-green-900 font-medium mb-1">New Messages from Coordinator</h4>
                                    <p className="text-green-700 font-medium mb-1">You have {newMessageCount} new {newMessageCount === 1 ? 'message' : 'messages'} from your coordinator</p>
                                    <p className="text-green-600 text-sm">Click below to view and respond to your messages</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded-full">{newMessageCount} unread</span>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Link to="/messages" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
                                View Messages
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <Card className="h-full">
                        <CardHeader>
                            <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {announcements.length > 0 ? (
                                    announcements.map((announcement) => (
                                        <div key={announcement._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 rounded-full bg-green-100 text-green-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-1">{announcement.content}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No announcements found
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        );
    }

    // Admin Dashboard
    const adminStats = [
        {
            label: 'Total Students',
            value: dashboardData?.totalStudents || 0,
            subElement: <span className="text-green-600 text-xs font-bold">All enrolled students</span>,
            icon: <Users className="text-green-600" />,
            color: 'bg-white border border-gray-100'
        },
        {
            label: 'BSIT Students',
            value: dashboardData?.bsitStudents || 0,
            subElement: <span className="text-gray-400 text-xs">Students enrolled in BSIT program</span>,
            icon: <BookOpen className="text-green-600" />,
            color: 'bg-white border border-gray-100'
        },
        {
            label: 'BSBA Students',
            value: dashboardData?.bsbaStudents || 0,
            subElement: <span className="text-gray-400 text-xs">Students enrolled in BSBA program</span>,
            icon: <BookOpen className="text-green-600" />,
            color: 'bg-white border border-gray-100'
        },
        {
            label: 'Total Coordinators',
            value: dashboardData?.totalCoordinators || 0,
            subElement: <span className="text-green-600 text-xs font-bold">Active coordinators</span>,
            icon: <Users className="text-green-600" />,
            color: 'bg-white border border-gray-100'
        },
        {
            label: 'Total Companies',
            value: dashboardData?.totalCompanies || 0,
            subElement: <span className="text-green-600 text-xs font-bold">Partnered companies</span>,
            icon: <Building2 className="text-green-600" />,
            color: 'bg-white border border-gray-100'
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-500">Welcome back, {user?.username}!</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 bg-white border border-green-500 rounded-xl hover:bg-green-50 text-green-600 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4`}>
                {adminStats.map((stat, index) => (
                    <Card key={index}>
                        <CardBody className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="h-full">
                    <CardHeader>
                        <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {announcements.length > 0 ? (
                                announcements.map((announcement) => (
                                    <div key={announcement._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{announcement.content}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(announcement.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No announcements found
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};
