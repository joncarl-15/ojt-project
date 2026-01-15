import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Loader2, Edit, Trash2, Mail } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { CreateUserModal } from '../components/CreateUserModal'; // Placeholder
import { EditUserModal } from '../components/EditUserModal'; // Placeholder

interface Coordinator {
    _id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    program?: string;
}

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

export const Coordinators: React.FC = () => {
    // ... existing state ...
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);

    // ... existing functions ...
    const fetchCoordinators = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: 'coordinator' })
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setCoordinators(data);
            } else {
                setCoordinators([]);
            }
        } catch (error) {
            console.error('Failed to fetch coordinators', error);
            setCoordinators([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoordinators();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to move this coordinator to the archive?')) return;

        try {
            await fetch(`${API_BASE_URL}/user/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCoordinators(coordinators.filter(c => c._id !== id));
        } catch (error) {
            console.error('Failed to delete coordinator', error);
        }
    };

    const filteredCoordinators = coordinators.filter(c =>
        c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Users size={20} />
                        </div>
                        Coordinators
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Manage coordinator accounts and assignments</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-200"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus size={20} /> Create Coordinator
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6"
            >
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-800">All Coordinators</h3>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search coordinators..."
                            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {filteredCoordinators.length > 0 ? filteredCoordinators.map((coordinator) => (
                            <motion.div key={coordinator._id} variants={item}>
                                <Card className="hover:shadow-lg transition-all border border-slate-200 hover:border-blue-200 group h-full">
                                    <CardBody className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                                                    {coordinator.firstName?.[0]?.toUpperCase() || coordinator.userName?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-lg">
                                                        {coordinator.firstName && coordinator.lastName
                                                            ? `${coordinator.firstName} ${coordinator.lastName}`
                                                            : coordinator.userName}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-medium border border-emerald-200">Active</span>
                                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium uppercase border border-slate-200">{coordinator.program || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 transition-opacity">
                                                <button
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        setSelectedCoordinator(coordinator);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    onClick={() => handleDelete(coordinator._id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-slate-500 text-sm">
                                            <Mail size={16} className="mr-2 text-blue-400" />
                                            {coordinator.email}
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        )) : (
                            <div className="col-span-2 text-center text-slate-500 py-12 bg-white rounded-xl border border-dashed border-slate-200">
                                No coordinators found
                            </div>
                        )}
                    </motion.div>
                )}
            </motion.div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchCoordinators}
                role="coordinator"
            />

            {selectedCoordinator && (
                <EditUserModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedCoordinator(null);
                    }}
                    onSuccess={fetchCoordinators}
                    user={selectedCoordinator}
                />
            )}
        </div>
    );
};
