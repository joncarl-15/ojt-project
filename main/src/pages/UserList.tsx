import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
}

// Animation Variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
};

export const UserList: React.FC = () => {
    // ... existing state ...
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();

    // ... existing functions ...
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setUsers(data.data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await fetch(`${API_BASE_URL}/user/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsers(users.filter(u => u._id !== id));
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Users</h2>
                    <p className="text-gray-500">Manage system users</p>
                </div>
                <div className="w-full sm:w-auto">
                    {/* Add user button could go here */}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center p-12">
                                <Loader2 className="animate-spin text-primary-600" size={32} />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">User</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <motion.tbody
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="divide-y divide-gray-100"
                                    >
                                        {filteredUsers.map((user) => (
                                            <motion.tr
                                                key={user._id}
                                                variants={item}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-green-100 flex items-center justify-center text-primary-600 font-bold">
                                                            {user.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{user.username}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'coordinator' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-green-100 text-green-800'
                                                        }`}>
                                                        {user.role || 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.role === 'student' && (user as any).metadata?.status && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(user as any).metadata.status === 'deployed' ? 'bg-green-100 text-green-800' :
                                                                (user as any).metadata.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {(user as any).metadata.status.charAt(0).toUpperCase() + (user as any).metadata.status.slice(1)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(user._id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </motion.tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
};
