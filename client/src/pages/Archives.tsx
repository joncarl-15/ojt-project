import React, { useState, useEffect } from 'react';
import { Search, Archive, User, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Card, CardBody } from '../components/Card';
import { Select } from '../components/Select';
import { Input } from '../components/Input';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    program: string;
    metadata: {
        company?: {
            name: string;
        };
        coordinator?: {
            firstName: string;
            lastName: string;
        };
        status: string;
    };
    createdAt: string;
}

export const Archives: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'students' | 'coordinators' | 'documents'>('students');
    const [statusFilter, setStatusFilter] = useState('all');
    const [programFilter, setProgramFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();

    const fetchArchives = async (query = '') => {
        setIsLoading(true);
        try {
            // Only implementing for students for now as per requirement
            if (activeTab === 'students') {
                const response = await fetch('/api/user/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        role: 'student',
                        'metadata.status': 'completed',
                        ...(query && { query }),
                        ...(programFilter !== 'all' && { program: programFilter })
                    })
                });
                const data = await response.json();
                setItems(Array.isArray(data) ? data : []);
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Failed to fetch archives:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArchives(searchQuery);
    }, [token, activeTab, programFilter, searchQuery]);

    const tabs = [
        { id: 'students', label: 'Students', icon: User, count: items.length },
        { id: 'coordinators', label: 'Coordinators', icon: User, count: 0 },
        { id: 'documents', label: 'Documents', icon: FileText, count: 0 }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-green-700">Archive</h1>
                <p className="text-gray-500 mt-1">View past records and history</p>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-gray-100 overflow-x-auto">
                    <div className="flex px-4 sm:px-6 pt-4 gap-6 min-w-max">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                        <div className="flex-1">
                            <Input
                                icon={<Search size={20} />}
                                placeholder="Search archives..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white w-full"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                value={programFilter}
                                onChange={(value) => setProgramFilter(value)}
                                options={[
                                    { value: 'all', label: 'All Programs' },
                                    { value: 'bsit', label: 'BSIT' },
                                    { value: 'bsba', label: 'BSBA' }
                                ]}
                                className="bg-white"
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                                options={[
                                    { value: 'all', label: 'All Status' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'withdrawn', label: 'Withdrawn' }
                                ]}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>

                <CardBody className="p-0">
                    {activeTab === 'students' && (
                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading archives...</div>
                            ) : items.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Archive className="mx-auto text-gray-300 mb-3" size={48} />
                                    <p className="text-gray-500">No archived records found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-green-50 text-green-800 text-sm font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Program</th>
                                            <th className="px-6 py-4">Company</th>
                                            <th className="px-6 py-4">Coordinator</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((student) => (
                                            <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-green-700">
                                                    {student.firstName} {student.lastName}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{student.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.program === 'bsit' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {student.program.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {student.metadata?.company?.name || 'Not assigned'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {student.metadata?.coordinator ?
                                                        `${student.metadata.coordinator.firstName} ${student.metadata.coordinator.lastName}` :
                                                        'Not assigned'
                                                    }
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        {student.metadata?.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {format(new Date(student.createdAt), 'MMM d, yyyy')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab !== 'students' && (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">Archive for {activeTab} coming soon.</p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};
