import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    User as UserIcon,
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

export const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

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
        { icon: <MessageSquare size={18} />, label: 'Messages', path: '/messages' },
        { icon: <Upload size={18} />, label: 'Upload Documents', path: '/upload-documents' },
        { icon: <CheckSquare size={18} />, label: 'My Tasks', path: '/my-tasks' },
        { icon: <UserIcon size={18} />, label: 'Profile', path: '/profile' },
    ];

    const coordinatorNavItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <Users size={18} />, label: 'Students', path: '/students' },
        { icon: <MessageSquare size={18} />, label: 'Messages', path: '/messages' },
        { icon: <CheckSquare size={18} />, label: 'Tasks', path: '/tasks' },
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
          text-sm
        `}
                onClick={() => setIsSidebarOpen(false)}
            >
                {item.icon}
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <div className="h-screen w-full bg-gray-50 flex overflow-hidden transition-colors duration-200">
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
          fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white/80 backdrop-blur-md border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-green-600">
                            {user?.role === 'coordinator' ? 'Coordinator Menu' : 'OJT Monitor'}
                        </h1>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        {navItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 mb-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold group-hover:bg-green-200 transition-colors">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-green-700">
                                    {user?.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-auto">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">
                        {user?.role === 'coordinator' ? 'Coordinator Menu' : 'OJT Monitor'}
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
