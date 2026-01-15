import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, ClipboardList } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { CreateRequirementModal } from '../components/CreateRequirementModal';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Select } from '../components/Select';
import { motion } from 'framer-motion';

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
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
            >
                <div>
                    <h1 className="text-2xl font-extrabold text-emerald-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl shadow-sm">
                            <ClipboardList className="text-emerald-600" size={24} />
                        </div>
                        Program Requirements
                    </h1>
                    <p className="text-emerald-700 mt-1 ml-1 font-medium text-sm">Manage requirements for OJT programs</p>
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
                            className="bg-white border-emerald-200 focus:ring-emerald-500"
                        />
                    </div>
                    <Button onClick={handleCreate} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 border-none flex items-center justify-center gap-2 h-[42px] px-6 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm font-bold">
                        <Plus size={20} />
                        Add Requirement
                    </Button>
                </div>
            </motion.div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm">
                    {error}
                </div>
            )}

            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-black/5">
                <CardHeader className="bg-white border-b border-emerald-100 p-6">
                    <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                        All Requirements
                        <span className="ml-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                            {filteredRequirements.length}
                        </span>
                    </h2>
                </CardHeader>

                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center text-emerald-600 flex flex-col items-center">
                            Loading requirements...
                        </div>
                    ) : requirements.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="text-emerald-300" size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-emerald-900">No requirements found</h3>
                            <p className="text-emerald-600 mt-1">Get started by adding a new program requirement.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-emerald-50/80 border-b border-emerald-100 text-emerald-900 text-xs uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-lg">Name</th>
                                        <th className="px-6 py-4">Program</th>
                                        <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <motion.tbody
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="divide-y divide-emerald-50"
                                >
                                    {filteredRequirements.map((req) => (
                                        <motion.tr key={req._id} variants={item} className="hover:bg-emerald-50/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                    {req.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${req.program === 'bsit'
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    {req.program.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(req)}
                                                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(req._id)}
                                                        className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
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

