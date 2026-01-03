import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Search, Plus, Edit, Trash2, FileText, CheckSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateTaskModal } from '../components/CreateTaskModal';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    assignedTo: string[]; // IDs
    submissionProofUrl?: string[];
}

export const CoordinatorTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/task', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setTasks(data);
            } else {
                setTasks([]);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await fetch(`/api/task/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setTasks(tasks.filter(t => t._id !== id));
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <CheckSquare className="text-green-600" /> Tasks
                    </h2>
                    <p className="text-green-600 text-sm">Create, edit, and manage tasks for students</p>
                </div>

                <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus size={20} /> Create Task
                </Button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-green-100 space-y-6 shadow-sm">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-green-700">All Tasks</h3>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-green-600" size={32} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                            <div key={task._id} className="border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-green-800 text-lg">{task.title}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <p className="text-green-600 text-sm mb-3">{task.description}</p>

                                        <div className="flex items-center gap-4 text-xs text-green-700 font-medium">
                                            <span className="flex items-center gap-1">
                                                {task.submissionProofUrl?.length || 0} file(s) uploaded
                                            </span>
                                            <span className="flex items-center gap-1">
                                                Assigned: {task.assignedTo?.length || 0} student(s)
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Student</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                            View Details
                                        </Button>
                                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200">
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="p-2 text-green-600 hover:bg-red-50 hover:text-red-500 rounded-lg border border-green-200"
                                            onClick={() => handleDelete(task._id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-gray-500 py-8">
                                No tasks found
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchTasks}
            />
        </div>
    );
};
