import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Search, Plus, Filter, Loader2, Edit, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AssignStudentModal } from '../components/AssignStudentModal';
import { UpdateStatusModal } from '../components/UpdateStatusModal';

interface Student {
    _id: string;
    userName: string;
    metadata?: {
        company?: {
            name: string;
        };
        status?: string;
    };
}

export const Enrollment: React.FC = () => {
    const [enrollments, setEnrollments] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuth();
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedStudentForUpdate, setSelectedStudentForUpdate] = useState<Student | null>(null);

    const fetchEnrollments = async () => {
        setIsLoading(true);
        try {
            // Fetch all students
            const response = await fetch(`${API_BASE_URL}/user/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: 'student' })
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                // Filter client side for now as search API might not support searching into populated fields deeply/easily without more complex queries
                const enrolled = data.filter((s: any) => s.metadata?.company);
                setEnrollments(enrolled);
            } else {
                setEnrollments([]);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to unassign this student? This action cannot be undone.')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/user/unassign-company`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                fetchEnrollments();
            } else {
                alert('Failed to delete enrollment');
            }
        } catch (error) {
            console.error('Failed to delete enrollment', error);
            alert('An error occurred');
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, [token]);

    const filtered = enrollments.filter(e => {
        if (filter === 'All') return true;
        return e.metadata?.status?.toLowerCase() === filter.toLowerCase();
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-cyan-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl shadow-sm">
                            <Users className="text-cyan-600" size={24} />
                        </div>
                        Student Enrollment
                    </h1>
                    <p className="text-cyan-700 mt-1 ml-1 font-medium text-sm">Manage student deployments and company assignments</p>
                </div>
                <Button
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-200 border-none flex items-center justify-center gap-2 h-[42px] px-6 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm font-bold"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} /> New Enrollment
                </Button>
            </div>

            <Card className="min-h-[400px] border-none shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-black/5">
                <CardHeader className="bg-white border-b border-cyan-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-cyan-900 flex items-center gap-2">
                            <div className="w-2 h-6 bg-cyan-500 rounded-full"></div>
                            All Enrollments
                            <span className="ml-2 px-2.5 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                                {filtered.length}
                            </span>
                        </h3>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search student or company..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-cyan-50/30 text-sm font-medium"
                                />
                            </div>
                            <div className="relative w-40">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600" size={16} />
                                <select
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-cyan-200 bg-cyan-50/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none text-sm font-bold text-cyan-700 cursor-pointer"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="All">All Status</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="deployed">Deployed</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 text-cyan-600 font-medium">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            Loading enrollments...
                        </div>
                    ) : (
                        filtered.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-cyan-50/80 border-b border-cyan-100 text-cyan-900 text-xs uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-lg">Student</th>
                                            <th className="px-6 py-4">Company</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cyan-50">
                                        {filtered.map(e => (
                                            <tr key={e._id} className="hover:bg-cyan-50/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700">{e.userName}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                        {e.metadata?.company?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm uppercase tracking-wide ${e.metadata?.status === 'deployed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                        e.metadata?.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                        {e.metadata?.status || 'Scheduled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedStudentForUpdate(e);
                                                            setIsUpdateModalOpen(true);
                                                        }}
                                                        className="p-2 border border-cyan-100 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 hover:border-cyan-200 rounded-lg transition-all"
                                                        title="Edit Status"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(e._id)}
                                                        className="p-2 border border-rose-100 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:border-rose-200 rounded-lg transition-all"
                                                        title="Remove Enrollment"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-cyan-600">
                                <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-4">
                                    <Users className="text-cyan-300" size={32} />
                                </div>
                                <p className="font-bold text-cyan-900">No enrolled students found</p>
                                <p className="text-sm mt-1">Enroll a student to see them here.</p>
                            </div>
                        )
                    )}
                </CardBody>
            </Card>

            <AssignStudentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchEnrollments}
            />

            <UpdateStatusModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onSuccess={fetchEnrollments}
                student={selectedStudentForUpdate}
            />
        </div>
    );
};
