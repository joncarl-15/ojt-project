import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, ClipboardList } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CreateRequirementModal } from '../components/CreateRequirementModal';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Select } from '../components/Select';

interface Requirement {
    _id: string;
    name: string;
    program: 'bsit' | 'bsba';
}

export const ProgramRequirements: React.FC = () => {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
    const [programFilter, setProgramFilter] = useState<'all' | 'bsit' | 'bsba'>('all');
    const { token } = useAuth();

    const fetchRequirements = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/requirements`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch requirements');
            setRequirements(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequirements();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this requirement?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete requirement');

            fetchRequirements();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (req: Requirement) => {
        setSelectedRequirement(req);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedRequirement(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const filteredRequirements = requirements.filter(req =>
        programFilter === 'all' ? true : req.program === programFilter
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <ClipboardList className="text-green-700" /> Program Requirements
                    </h1>
                    <p className="text-green-600 mt-1">Manage requirements for OJT programs</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-48">
                        <Select
                            value={programFilter}
                            onChange={(value) => setProgramFilter(value as any)}
                            options={[
                                { value: 'all', label: 'All Programs' },
                                { value: 'bsit', label: 'BSIT' },
                                { value: 'bsba', label: 'BSBA' }
                            ]}
                        />
                    </div>
                    <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 h-[42px] w-full sm:w-auto justify-center">
                        <Plus size={18} className="mr-2" />
                        Add Requirement
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-green-700">All Requirements</h2>
                </CardHeader>

                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading requirements...</div>
                    ) : requirements.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No requirements found</h3>
                            <p className="text-gray-500 mt-1">Get started by adding a new program requirement.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-green-50 text-green-800 text-sm font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Program</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRequirements.map((req) => (
                                        <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-green-700">{req.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${req.program === 'bsit'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {req.program.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(req)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(req._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            <CreateRequirementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRequirements}
                mode={modalMode}
                initialData={selectedRequirement}
            />
        </div>
    );
};

