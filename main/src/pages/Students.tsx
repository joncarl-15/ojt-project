import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, UserPlus, Search, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardBody } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { CreateUserModal } from '../components/CreateUserModal';
import { AssignStudentModal } from '../components/AssignStudentModal';
import { EditUserModal } from '../components/EditUserModal';

interface Student {
    _id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    program?: string;
    role: string;
    metadata?: {
        company?: {
            name: string;
        };
        status?: string;
        deploymentDate?: string;
    };
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

export const Students: React.FC = () => {
    // ... existing state ...
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // ... existing functions ...
    const fetchStudents = async () => {
        setIsLoading(true);
        try {
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
        if (!confirm('Are you sure you want to move this student to the archive?')) return;

        try {
            await fetch(`${API_BASE_URL}/user/${id}`, {
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
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-teal-900 flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                            <GraduationCap size={20} />
                        </div>
                        Students Directory
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Manage student records, internships, and company assignments</p>
                </div>
                <div className="flex gap-2 flex-wrap">

                    <Button
                        className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 shadow-lg shadow-teal-200"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus size={20} /> Create Student
                    </Button>
                    <Button
                        variant="secondary"
                        className="text-teal-700 border-teal-200 flex items-center gap-2 hover:bg-teal-50 shadow-none border"
                        onClick={() => setIsAssignModalOpen(true)}
                    >
                        <UserPlus size={20} />
                        <span>Assign Student</span>
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border border-slate-200 shadow-md">
                    <CardHeader className="bg-white border-b border-slate-100 py-4 px-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-bold text-slate-800">All Students</h3>
                            <div className="w-full sm:w-auto relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center p-12">
                                <Loader2 className="animate-spin text-teal-600" size={32} />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Full Name</th>
                                            <th className="px-6 py-4 font-bold">Email</th>
                                            <th className="px-6 py-4 font-bold">Program</th>
                                            <th className="px-6 py-4 font-bold">Company</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <motion.tbody
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="divide-y divide-slate-100"
                                    >
                                        {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                            <motion.tr
                                                key={student._id}
                                                variants={item}
                                                className="hover:bg-teal-50/30 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-800">
                                                        {student.firstName && student.lastName
                                                            ? `${student.firstName} ${student.lastName}`
                                                            : student.userName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">{student.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold uppercase border border-indigo-100">
                                                        {student.program || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.metadata?.company?.name ? (
                                                        <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            {student.metadata.company.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.metadata?.status ? (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.metadata.status === 'deployed' ? 'bg-green-100 text-green-800' :
                                                            student.metadata.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {student.metadata.status === 'scheduled' && student.metadata.deploymentDate
                                                                ? new Date(student.metadata.deploymentDate).toLocaleDateString()
                                                                : student.metadata.status.charAt(0).toUpperCase() + student.metadata.status.slice(1)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">Pending</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 text-slate-400">
                                                        <button
                                                            className="p-1.5 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            onClick={() => handleDelete(student._id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                    No students found matching your search.
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
