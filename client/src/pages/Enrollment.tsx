import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AssignStudentModal } from '../components/AssignStudentModal';

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

    const fetchEnrollments = async () => {
        setIsLoading(true);
        try {
            // Fetch all students
            const response = await fetch('/api/user/search', {
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
                <h2 className="text-2xl font-bold text-green-700">Student Enrollment</h2>
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} /> New Enrollment
                </Button>
            </div>

            <Card className="min-h-[400px]">
                <CardHeader>
                    <h3 className="text-lg font-medium text-green-700 mb-4">All Enrollments</h3>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search student or company..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div className="relative w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" size={16} />
                            <select
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="deployed">Deployed</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-green-600" size={32} />
                        </div>
                    ) : (
                        filtered.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-green-50 text-green-800">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Company</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(e => (
                                        <tr key={e._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">{e.userName}</td>
                                            <td className="px-6 py-4">{e.metadata?.company?.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs ${e.metadata?.status === 'deployed' ? 'bg-blue-100 text-blue-800' :
                                                    e.metadata?.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {e.metadata?.status || 'Scheduled'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-green-600 text-sm">
                                No enrolled students found.
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
        </div>
    );
};
