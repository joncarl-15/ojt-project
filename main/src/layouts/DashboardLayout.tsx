import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    UserCog,
    Building2,
    ClipboardList,
    BookOpen,
    FileText,
    Megaphone,
    Archive,
    MessageSquare,
    Upload,
    CheckSquare
} from 'lucide-react';
import { PullToRefresh } from '../components/PullToRefresh';

export const DashboardLayout: React.FC = () => {
    const { user, logout, token } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();

    // Fetch initial unread count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user || !token) return;
            try {
                const response = await fetch('/api/message', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const messages = await response.json();
                if (Array.isArray(messages)) {
                    // Count messages where receiver is current user and isRead is false
                    // Note: This logic duplicates what's in Dashboard.tsx, but needed globally for sidebar
                    const count = messages.filter((msg: any) =>
                        msg.receiverModel === 'User' &&
                        msg.receiver._id === user._id &&
                        !msg.isRead
                    ).length;
                    setUnreadCount(count);
                }
            } catch (error) {
                console.error("Failed to fetch unread messages", error);
            }
        };

        fetchUnreadCount();
    }, [user, token]);




    const adminNavItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Users size={18} />, label: 'Students', path: '/students' },
        { icon: <UserCog size={18} />, label: 'Coordinators', path: '/coordinators' },
        { icon: <Building2 size={18} />, label: 'Companies', path: '/companies' },
        { icon: <ClipboardList size={18} />, label: 'Enrollment', path: '/enrollment' },
        { icon: <BookOpen size={18} />, label: 'Program Requirements', path: '/requirements' },
        { icon: <FileText size={18} />, label: 'Documents', path: '/documents' },
        { icon: <Megaphone size={18} />, label: 'Announcement', path: '/announcements' },
        { icon: <Archive size={18} />, label: 'Archives', path: '/archives' },
    ];

    const studentNavItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <MessageSquare size={18} />, label: 'Messages', path: '/messages', badge: unreadCount },
        { icon: <Upload size={18} />, label: 'Upload Documents', path: '/upload-documents' },
        { icon: <CheckSquare size={18} />, label: 'My Tasks', path: '/my-tasks' },
    ];

    const coordinatorNavItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Users size={18} />, label: 'Students', path: '/students' },
        { icon: <MessageSquare size={18} />, label: 'Messages', path: '/messages', badge: unreadCount },
        { icon: <CheckSquare size={18} />, label: 'Tasks', path: '/tasks' },
        { icon: <Building2 size={18} />, label: 'Companies', path: '/companies' },
        { icon: <FileText size={18} />, label: 'Documents', path: '/documents' },
        { icon: <Megaphone size={18} />, label: 'Announcement', path: '/announcements' },

    ];

    const navItems = user?.role === 'admin' ? adminNavItems : user?.role === 'coordinator' ? coordinatorNavItems : studentNavItems;

    const NavItem: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
        const isActive = location.pathname === item.path;
        return (
            <Link
                to={item.path}
                className={`
          flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200
          ${isActive
                        ? 'bg-green-50 text-green-600 font-medium shadow-sm'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }
          text-sm group relative
        `}
                onClick={() => {
                    setIsSidebarOpen(false);
                    if (item.label === 'Messages' && (item as any).badge > 0) {
                        setUnreadCount(0); // Optimistic clear
                        fetch('/api/message/read-all', {
                            method: 'PATCH',
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).catch(err => console.error("Failed to mark all as read", err));
                    }
                }}
            >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {(item as any).badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {(item as any).badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <div className="h-[100dvh] w-full bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 flex overflow-hidden transition-colors duration-200 font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/70 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                            {user?.role === 'coordinator' ? 'Coordinator Menu' : 'OJT Monitor'}
                        </h1>
                    </div>

                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </nav>

                    <div className="p-4">
                        <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 mb-2 hover:bg-white/50 rounded-2xl transition-all duration-200 cursor-pointer group shadow-sm border border-transparent hover:border-white/60">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-600 font-bold group-hover:from-green-200 group-hover:to-emerald-200 transition-colors shadow-inner">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-700">
                                    {user?.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate group-hover:text-green-600/70">
                                    {user?.email}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50/80 rounded-xl transition-colors font-medium"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-hidden relative">
                <PullToRefresh
                    onRefresh={() => window.location.reload()}
                    disabled={location.pathname.includes('/messages')}
                >
                    {/* Mobile Header */}
                    <div className="lg:hidden sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/50 px-4 py-3 flex items-center justify-between shadow-sm">
                        <h1 className="text-lg font-bold text-gray-900">
                            {user?.role === 'coordinator' ? 'Coordinator Menu' : 'OJT Monitor'}
                        </h1>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in h-full flex flex-col flex-1 overflow-y-auto">
                        <Outlet />
                    </div>
                </PullToRefresh>
            </main>
        </div>
    );
};
