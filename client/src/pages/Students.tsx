import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search, Plus, UserPlus, Edit, Trash2, Loader2, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { AssignStudentModal } from '../components/AssignStudentModal';

interface Student {
    _id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    program?: string;
    metadata?: {
        company?: {
            name: string;
        };
    };
}

export const Students: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
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
                setStudents(data);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Failed to fetch students', error);
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            await fetch(`/api/user/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStudents(students.filter(s => s._id !== id));
        } catch (error) {
            console.error('Failed to delete student', error);
        }
    };

    const filteredStudents = students.filter(student =>
        student.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-green-700">Students</h2>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={fetchStudents} variant="outline" size="sm">
                        <RefreshCcw size={18} />
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={20} /> Create Student
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        onClick={() => setIsAssignModalOpen(true)}
                    >
                        <UserPlus size={20} /> Assign Student
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-green-700">All Students</h3>
                    </div>
                    <div className="mt-4">
                        <Input
                            icon={<Search size={20} />}
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="animate-spin text-green-600" size={32} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-green-50 text-green-800">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-semibold">Full Name</th>
                                        <th className="px-4 py-3 text-sm font-semibold">Email</th>
                                        <th className="px-4 py-3 text-sm font-semibold">Program</th>
                                        <th className="px-4 py-3 text-sm font-semibold">Company</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {student.firstName && student.lastName
                                                    ? `${student.firstName} ${student.lastName}`
                                                    : student.userName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{student.email}</td>
                                            <td className="px-4 py-3 text-gray-600 uppercase">{student.program || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{student.metadata?.company?.name || '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit size={16} className="mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(student._id)}
                                                    >
                                                        <Trash2 size={16} className="mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchStudents}
                role="student"
            />

            <AssignStudentModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSuccess={fetchStudents}
            />

            {selectedStudent && (
                <EditUserModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedStudent(null);
                    }}
                    onSuccess={fetchStudents}
                    user={selectedStudent}
                />
            )}
        </div>
    );
};
