import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { Plus, Edit, Trash2, FileText, CheckSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TaskFormModal } from '../components/TaskFormModal';
import { Modal } from '../components/Modal';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    assignedTo: string[]; // IDs
    submissionProofUrl?: string[];
    submissions?: {
        student: any;
        files: string[];
        submittedAt: string;
    }[];
}

export const CoordinatorTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const { token } = useAuth(); // Handled in the main block now
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleCreateTask = () => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const [searchParams] = useSearchParams();
    const { user, token } = useAuth(); // Destructure user from useAuth
    const navigate = useNavigate();

    // Redirect students
    useEffect(() => {
        if (user && user.role === 'student') {
            navigate('/my-tasks', { replace: true });
        }
    }, [user, navigate]);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/task`, {
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

    // Check for highlight param and open modal
    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (highlightId && tasks.length > 0) {
            const taskToOpen = tasks.find(t => t._id === highlightId);
            if (taskToOpen) {
                setEditingTask(taskToOpen);
                setIsTaskModalOpen(true);
            }
        }
    }, [searchParams, tasks]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await fetch(`${API_BASE_URL}/task/${id}`, {
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

    const filteredTasks = tasks;

    const getTaskStatus = (task: Task) => {
        if (task.status === 'completed') return 'completed';

        // If no students assigned, rely on manual status
        if (!task.assignedTo || task.assignedTo.length === 0) return task.status;

        // Check if all assigned students have submitted
        const allSubmitted = task.assignedTo.every((studentId: any) => {
            // Handle both populated object and string ID
            const id = typeof studentId === 'object' ? studentId._id : studentId;
            const submission = task.submissions?.find((s: any) =>
                (typeof s.student === 'object' ? s.student._id : s.student) === id
            );
            return submission && submission.files.length > 0;
        });

        return allSubmitted ? 'completed' : 'pending';
    };

    const getFileCount = (task: Task) => {
        let count = task.submissionProofUrl?.length || 0;
        if (task.submissions) {
            count += task.submissions.reduce((acc, sub) => acc + sub.files.length, 0);
        }
        return count;
    };

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
                    onClick={handleCreateTask}
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
                        {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                            const status = getTaskStatus(task);
                            const fileCount = getFileCount(task);

                            return (
                                <div key={task._id} className="border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-green-800 text-lg">{task.title}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-green-600 text-sm mb-3">{task.description}</p>

                                            <div className="flex items-center gap-4 text-xs text-green-700 font-medium">
                                                <span className="flex items-center gap-1">
                                                    {fileCount} file(s) uploaded
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    Assigned: {task.assignedTo?.length || 0} student(s)
                                                </span>
                                            </div>
                                            <div className="mt-2">
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Student</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                View Details
                                            </Button>
                                            <button
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200"
                                                onClick={() => handleEditTask(task)}
                                            >
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
                            );
                        }) : (
                            <div className="text-center text-gray-500 py-8">
                                No tasks found
                            </div>
                        )}
                    </div>
                )}
            </div>

            <TaskFormModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSuccess={fetchTasks}
                task={editingTask}
            />

            {/* Task Details Modal */}
            {selectedTask && (
                <Modal
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    title="Task Details"
                >
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${selectedTask.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {selectedTask.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Due {new Date(selectedTask.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h3>
                            <p className="text-gray-600">{selectedTask.description}</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText size={18} className="text-green-600" /> Student Submissions
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 ? (
                                    selectedTask.assignedTo.map((student: any) => {
                                        // Find submission for this student
                                        const submission = selectedTask.submissions?.find((s: any) => s.student._id === student._id || s.student === student._id);
                                        const hasSubmitted = submission && submission.files.length > 0;

                                        return (
                                            <div key={student._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                                                        <p className="text-xs text-gray-500 uppercase">{student.program}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasSubmitted ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                        {hasSubmitted ? 'Completed' : 'Pending'}
                                                    </span>
                                                </div>

                                                {hasSubmitted && (
                                                    <div className="mt-2 text-xs">
                                                        <p className="text-gray-500 mb-1">Files:</p>
                                                        <ul className="space-y-1">
                                                            {submission.files.map((file: string, idx: number) => (
                                                                <li key={idx}>
                                                                    <a
                                                                        href={file}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                                    >
                                                                        <FileText size={10} /> Attachment {idx + 1}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <p className="text-xs text-gray-400 mt-1 mt-2 text-right">
                                                            {new Date(submission.submittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 text-sm">No students assigned.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
