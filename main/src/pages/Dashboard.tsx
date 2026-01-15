import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Building2, ClipboardList, User as UserIcon, MessageSquare, Archive, UserCog, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TimeLogger } from '../components/TimeLogger';
import { TutorialModal } from '../components/TutorialModal';
import { API_BASE_URL } from '../config';
import { motion } from 'framer-motion';

// Animation Variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const Dashboard: React.FC = () => {
    const { user, token } = useAuth();
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch dashboard stats
                const response = await fetch(`${API_BASE_URL}/user/dashboard?userId=${user._id}&userRole=${user.role}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.dashboard) {
                    setDashboardData(data.dashboard);
                }

                // Fetch announcements
                const announcementsResponse = await fetch(`${API_BASE_URL}/announcement`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const announcementsData = await announcementsResponse.json();
                if (Array.isArray(announcementsData)) {
                    setAnnouncements(announcementsData.slice(0, 5)); // Show max 5 announcements
                }

                // Fetch messages for unread count
                const messagesResponse = await fetch(`${API_BASE_URL}/message`, {
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

    // Check for tutorial seen status
    useEffect(() => {
        if (!user) return;

        const hasSeenTutorialForever = localStorage.getItem(`ojt_tutorial_seen_${user._id}`);
        const hasSeenTutorialSession = sessionStorage.getItem(`ojt_tutorial_session_seen_${user._id}`);

        if (!hasSeenTutorialForever && !hasSeenTutorialSession) {
            // Small delay to ensure smooth entrance after load
            const timer = setTimeout(() => {
                setShowTutorial(true);
                sessionStorage.setItem(`ojt_tutorial_session_seen_${user._id}`, 'true');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    if (!user) return null;

    // STUDENT VIEW
    if (user.role === 'student') {
        const studentStats = [
            {
                label: 'Total Tasks',
                value: dashboardData?.totalTasks || 0,
                icon: <ClipboardList className="text-white" size={24} />,
                gradient: 'from-blue-500 to-blue-600',
                shadow: 'shadow-blue-500/20'
            },
            {
                label: 'New Messages',
                value: newMessageCount,
                icon: <MessageSquare className="text-white" size={24} />,
                gradient: 'from-emerald-500 to-emerald-600',
                shadow: 'shadow-emerald-500/20'
            },
            {
                label: 'User Role',
                value: <span className="capitalize">{user.role}</span>,
                icon: <UserIcon className="text-white" size={24} />,
                gradient: 'from-violet-500 to-violet-600',
                shadow: 'shadow-violet-500/20'
            }
        ];

        return (
            <div className="space-y-8 font-sans">
                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row justify-between items-end gap-4"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                            Dashboard
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Welcome back, <span className="font-semibold text-green-600">{user?.firstName}</span>!
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-white/60 backdrop-blur-sm"
                    >
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </motion.div>
                </motion.div>

                {/* Stats Grid */}
                <div className="mb-6">
                    <TimeLogger />
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {studentStats.map((stat, index) => (
                        <motion.div key={index} variants={item}>
                            <Card className="overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-none shadow-lg shadow-gray-200/50 bg-white/80 backdrop-blur-xl">
                                <CardBody className="flex items-center space-x-4 p-6">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300 text-white`}>
                                        {stat.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-500 truncate mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold text-gray-800 tracking-tight">{stat.value}</p>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Message Alert / Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {newMessageCount > 0 && (
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20 animate-fade-in relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <MessageSquare size={120} />
                                </div>
                                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">New Messages</h4>
                                        <p className="text-blue-50 font-medium">You have {newMessageCount} unread messages waiting for you.</p>
                                    </div>
                                    <Link to="/messages" className="px-6 py-2.5 bg-white text-green-600 hover:bg-green-50 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md whitespace-nowrap">
                                        View Messages
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Placeholder for future widgets */}
                        <div className="bg-white/40 border border-white/50 rounded-2xl p-8 text-center text-gray-400 border-dashed">
                            <ClipboardList className="mx-auto mb-3 opacity-50" size={48} />
                            <p>More widgets coming soon...</p>
                        </div>
                    </motion.div>

                    {/* Announcements Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-1"
                    >
                        <Card className="h-full flex flex-col border-none shadow-lg shadow-gray-200/50 bg-white/80 backdrop-blur-xl">
                            <CardHeader className="flex items-center justify-between border-b border-gray-100/50 pb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                                    Announcements
                                </h3>
                                <Link to="/announcements" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider">
                                    View All
                                </Link>
                            </CardHeader>
                            <CardBody className="flex-1 min-h-[300px] overflow-y-auto custom-scrollbar p-0">
                                <div className="divide-y divide-gray-100/50">
                                    {announcements.length > 0 ? (
                                        announcements.map((announcement) => (
                                            <div key={announcement._id} className="p-4 hover:bg-orange-50/20 transition-colors group cursor-pointer">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shadow-sm">
                                                        <span className="group-hover:scale-110 transition-transform">!</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-orange-600 transition-colors">
                                                            {announcement.title}
                                                        </h5>
                                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                            {announcement.content}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                            {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                                <Archive size={20} />
                                            </div>
                                            <p className="text-sm">No announcements yet</p>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    <TutorialModal
                        isOpen={showTutorial}
                        onClose={() => setShowTutorial(false)}
                        userRole={user?.role || 'student'}
                        userId={user._id}
                    />
                </div>
            </div>
        );
    }

    // ADMIN/COORDINATOR VIEW
    const isAdmin = user.role === 'admin';
    const isCoordinator = user.role === 'coordinator';

    const allStats = [
        {
            label: 'Total Students',
            value: isAdmin ? (dashboardData?.totalStudents || 0) : (dashboardData?.totalStudentsHandled || 0),
            subElement: <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">{isAdmin ? 'All enrolled' : 'Your students'}</span>,
            icon: <Users className="text-white" size={24} />,
            gradient: 'from-blue-500 to-blue-600',
            shadow: 'shadow-blue-500/20',
            show: true
        },
        {
            label: 'BSIT Students',
            value: dashboardData?.bsitStudents || 0,
            subElement: <span className="text-gray-400 text-xs bg-gray-50 px-2 py-0.5 rounded-full">BSIT Program</span>,
            icon: <BookOpen className="text-white" size={24} />,
            gradient: 'from-indigo-500 to-indigo-600',
            shadow: 'shadow-indigo-500/20',
            show: isAdmin || (isCoordinator && user?.program === 'bsit')
        },
        {
            label: 'BSBA Students',
            value: dashboardData?.bsbaStudents || 0,
            subElement: <span className="text-gray-400 text-xs bg-gray-50 px-2 py-0.5 rounded-full">BSBA Program</span>,
            icon: <BookOpen className="text-white" size={24} />,
            gradient: 'from-purple-500 to-purple-600',
            shadow: 'shadow-purple-500/20',
            show: isAdmin || (isCoordinator && user?.program === 'bsba')
        },
        {
            label: 'Total Coordinators',
            value: dashboardData?.totalCoordinators || 0,
            subElement: <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">Active</span>,
            icon: <UserCog className="text-white" size={24} />,
            gradient: 'from-pink-500 to-pink-600',
            shadow: 'shadow-pink-500/20',
            show: isAdmin
        },
        {
            label: 'Total Companies',
            value: isAdmin ? (dashboardData?.totalCompanies || 0) : (dashboardData?.companiesWithStudents || 0),
            subElement: <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">{isAdmin ? 'Partnered' : 'Linked'}</span>,
            icon: <Building2 className="text-white" size={24} />,
            gradient: 'from-orange-500 to-orange-600',
            shadow: 'shadow-orange-500/20',
            show: true
        },
    ];

    const visibleStats = allStats.filter(stat => stat.show);

    return (
        <div className="space-y-8 font-sans">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-end gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                        Dashboard
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Welcome back, <span className="font-semibold text-green-600">{user?.firstName}</span>!
                    </p>
                </div>
                <div className="text-sm text-gray-500 bg-white/50 px-4 py-2 rounded-full border border-white/60 backdrop-blur-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.max(1, Math.min(visibleStats.length - 1, 4))} gap-6`}
            >
                {visibleStats.map((stat, index) => (
                    <motion.div
                        key={index}
                        variants={item}
                        className={stat.label === 'Total Companies' ? 'col-span-full' : ''}
                    >
                        <Card className="overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-none shadow-lg shadow-gray-200/50 bg-white/80 backdrop-blur-xl">
                            <CardBody className="flex items-center space-x-4 p-6">
                                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300 text-white`}>
                                    {stat.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-500 truncate mb-1">{stat.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-gray-800 tracking-tight">{stat.value}</p>
                                        {stat.subElement}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 gap-6"
            >
                <Card className="h-full border-none shadow-lg shadow-gray-200/50 bg-white/80 backdrop-blur-xl">
                    <CardHeader className="flex items-center justify-between border-b border-gray-100/50 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Announcements
                        </h3>
                        <Link to="/announcements" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-wider">
                            View All
                        </Link>
                    </CardHeader>
                    <CardBody>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {announcements.length > 0 ? (
                                announcements.map((announcement) => (
                                    <div key={announcement._id} className="p-4 rounded-xl bg-gray-50/50 hover:bg-orange-50/30 border border-gray-100/50 hover:border-orange-100 transition-all cursor-pointer group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 rounded-lg bg-white text-orange-600 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                                                <Megaphone size={18} />
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h5 className="text-sm font-bold text-gray-800 line-clamp-1 mb-2 group-hover:text-orange-700 transition-colors">
                                            {announcement.title}
                                        </h5>
                                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                                            {announcement.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-gray-400">
                                    No announcements found
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
            <TutorialModal
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                userRole={user?.role || 'student'}
                userId={user._id}
            />
        </div>
    );
};
