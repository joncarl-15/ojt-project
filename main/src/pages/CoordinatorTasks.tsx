import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, Plus, Loader2, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
// Modals will be fixed after finding their paths
import { TaskFormModal } from '../components/TaskFormModal'; // Placeholder

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    dueDate: string;
    assignedTo: any[];
    submissions?: any[];
    submissionProofUrl?: string[];
}

// Animation Variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const CoordinatorTasks: React.FC = () => {
    // ... existing state ...
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
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div>
                    <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <CheckSquare size={20} />
                        </div>
                        Tasks Management
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Create, assign, and track student tasks</p>
                </div>

                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 shadow-lg shadow-indigo-200"
                    onClick={handleCreateTask}
                >
                    <Plus size={20} /> Create New Task
                </Button>
            </motion.div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-800">All Tasks</h3>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                            const status = getTaskStatus(task);
                            const fileCount = getFileCount(task);

                            const statusColor = status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200';

                            const borderClass = status === 'completed' ? 'border-l-emerald-500' : 'border-l-amber-500';

                            return (
                                <motion.div
                                    key={task._id}
                                    variants={item}
                                    className={`border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all bg-white border-l-4 ${borderClass}`}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-slate-800 text-lg">{task.title}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${statusColor}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-4 leading-relaxed">{task.description}</p>

                                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <FileText size={14} className="text-indigo-500" />
                                                    {fileCount} uploads
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <CheckSquare size={14} className="text-indigo-500" />
                                                    {task.assignedTo?.length || 0} assigned
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                            <Button
                                                size="sm"
                                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium"
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                View Details
                                            </Button>
                                            <button
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                onClick={() => handleEditTask(task)}
                                                title="Edit Task"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                onClick={() => handleDelete(task._id)}
                                                title="Delete Task"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }) : (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <CheckSquare className="mx-auto text-slate-300 mb-2" size={48} />
                                <p className="text-slate-500 font-medium">No tasks found</p>
                            </div>
                        )}
                    </motion.div>
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
