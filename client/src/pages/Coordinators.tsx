import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Search, Plus, Edit, Trash2, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';

interface Coordinator {
    _id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    program?: string;
    status?: string;
}

export const Coordinators: React.FC = () => {
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);

    const fetchCoordinators = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/search', {
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
        if (!confirm('Are you sure you want to delete this coordinator?')) return;

        try {
            await fetch(`/api/user/${id}`, {
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-green-700">Coordinators</h2>
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus size={20} /> Create Coordinator
                </Button>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-4">
                <h3 className="text-lg font-medium text-green-700">All Coordinators</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search coordinators..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-green-600" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredCoordinators.length > 0 ? filteredCoordinators.map((coordinator) => (
                            <Card key={coordinator._id} className="hover:shadow-md transition-shadow">
                                <CardBody>
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                {coordinator.firstName?.[0]?.toUpperCase() || coordinator.userName?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">
                                                    {coordinator.firstName && coordinator.lastName
                                                        ? `${coordinator.firstName} ${coordinator.lastName}`
                                                        : coordinator.userName}
                                                </h4>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">active</span>
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded uppercase">{coordinator.program || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200"
                                                onClick={() => {
                                                    setSelectedCoordinator(coordinator);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200"
                                                onClick={() => handleDelete(coordinator._id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-gray-500 text-sm">
                                        <Mail size={16} className="mr-2" />
                                        {coordinator.email}
                                    </div>
                                </CardBody>
                            </Card>
                        )) : (
                            <div className="col-span-2 text-center text-gray-500 py-8">
                                No coordinators found
                            </div>
                        )}
                    </div>
                )}
            </div>

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
