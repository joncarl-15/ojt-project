import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, ChevronRight, Download, FileText, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    submissionProofUrl?: string[];
    submissions?: any[];
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

export const MyTasks: React.FC = () => {
    const { user, token } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
    const [filter, setFilter] = useState('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user, token]); // Added token to dependency array

    // Check for highlight param and open modal
    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (highlightId && tasks.length > 0) {
            const taskToOpen = tasks.find(t => t._id === highlightId);
            if (taskToOpen) {
                setSelectedTask(taskToOpen);
            }
        }
    }, [searchParams, tasks]);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/task/student/${user?._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setTasks(data);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSubmissionFiles(Array.from(e.target.files));
        }
    };

    const handleSubmitReport = async () => {
        if (!selectedTask || !submissionFiles.length) return;

        const formData = new FormData();
        submissionFiles.forEach(file => formData.append('files', file));

        try {
            const response = await fetch(`${API_BASE_URL}/task/add-files/${selectedTask._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Task report submitted successfully!');
                setSelectedTask(null);
                setSubmissionFiles([]);
                fetchTasks(); // Refresh tasks
            } else {
                alert('Failed to submit report.');
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert('Error submitting report.');
        }
    };

    const getEffectiveStatus = (task: Task): 'pending' | 'in-progress' | 'completed' => {
        const mySubmission = task.submissions?.find((s: any) =>
            (typeof s.student === 'object' ? s.student._id : s.student) === user?._id
        );
        if (mySubmission && mySubmission.files.length > 0) {
            return 'completed';
        }
        return task.status;
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return getEffectiveStatus(task) === filter;
    });

    const getStatusColor = (status: 'pending' | 'in-progress' | 'completed') => {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-700';
            case 'in-progress': return 'bg-green-50 text-green-700';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDownloadUrl = (url: string) => {
        return url;
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
                    <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <CheckCircle size={24} />
                        </div>
                        My Tasks
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Track your progress and manage your assigned responsibilities</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2.5 border border-indigo-100 rounded-xl text-sm bg-white text-indigo-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-auto shadow-sm hover:border-indigo-200 transition-colors"
                    >
                        <option value="all">All Tasks</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4"
            >
                {filteredTasks.length === 0 ? (
                    <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        <CheckCircle className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-lg font-medium text-gray-600">No tasks found</p>
                        <p className="text-sm text-gray-400">Get started by asking for a task!</p>
                    </div>
                ) : (
                    filteredTasks.map(task => {
                        const effectiveStatus = getEffectiveStatus(task);

                        const statusColors = {
                            'pending': 'border-l-amber-500',
                            'in-progress': 'border-l-blue-500',
                            'completed': 'border-l-emerald-500'
                        };

                        const statusBadgeStyles = {
                            'pending': 'bg-amber-100 text-amber-800 border-amber-200',
                            'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
                            'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        };

                        const priorityStyles = {
                            'high': 'bg-rose-50 text-rose-700 border-rose-100',
                            'medium': 'bg-orange-50 text-orange-700 border-orange-100',
                            'low': 'bg-slate-50 text-slate-700 border-slate-100'
                        };

                        return (
                            <motion.div key={task._id} variants={item}>
                                <Card
                                    className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-gray-200 overflow-hidden ${statusColors[effectiveStatus] || 'border-l-gray-300'} border-l-4`}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`p-3 rounded-2xl shadow-sm ${effectiveStatus === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                                effectiveStatus === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                {effectiveStatus === 'completed' ? <CheckCircle size={24} /> :
                                                    effectiveStatus === 'in-progress' ? <Clock size={24} /> :
                                                        <AlertCircle size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-indigo-700 transition-colors mb-1">{task.title}</h3>
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize border ${statusBadgeStyles[effectiveStatus]}`}>
                                                        {effectiveStatus.replace('-', ' ')}
                                                    </span>

                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize border flex items-center gap-1 ${priorityStyles[task.priority]}`}>
                                                        {task.priority === 'high' && <AlertCircle size={10} />}
                                                        {task.priority} Priority
                                                    </span>

                                                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                                        <Clock size={12} />
                                                        Due {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-gray-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1 hidden sm:block">
                                            <ChevronRight size={28} />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>

            {selectedTask && (
                <Modal
                    isOpen={!!selectedTask && !selectedImage}
                    onClose={() => {
                        setSelectedTask(null);
                        setSubmissionFiles([]);
                    }}
                    title="Task Details"
                >
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(selectedTask.status)}`}>
                                    {selectedTask.status.replace('-', ' ')}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Due {new Date(selectedTask.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{selectedTask.description}</p>

                            {selectedTask.submissionProofUrl && selectedTask.submissionProofUrl.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <FileText size={16} className="text-green-600" />
                                        Task Attachments
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {selectedTask.submissionProofUrl.map((url, i) => {
                                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                            return (
                                                <div key={i} className="group relative border border-gray-200 rounded-lg p-2 hover:border-green-300 transition-colors">
                                                    {isImage ? (
                                                        <div
                                                            className="cursor-pointer"
                                                            onClick={() => setSelectedImage(url)}
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Attachment ${i + 1}`}
                                                                className="w-full h-32 object-cover rounded-md bg-gray-50"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex flex-col items-center justify-center h-32 text-center p-2 gap-2 text-gray-500 hover:text-green-600"
                                                            download
                                                        >
                                                            <FileText size={32} />
                                                            <span className="text-xs truncate w-full">Attachment {i + 1}</span>
                                                            <Download size={16} className="transition-opacity absolute top-2 right-2" />
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedTask.status !== 'completed' && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FileText size={16} />
                                    Submit Deliverables
                                </h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    Please attach your report or required documents here.
                                </p>
                                <div className="mb-4">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        accept=".doc,.docx,.xls,.xlsx,.csv,image/*"
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    />
                                    {submissionFiles.length > 0 && (
                                        <div className="mt-2 text-xs text-green-600">
                                            {submissionFiles.length} file(s) selected
                                        </div>
                                    )}
                                </div>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleSubmitReport}
                                    disabled={submissionFiles.length === 0}
                                >
                                    Submit Task Report
                                </Button>
                            </div>
                        )}


                        {selectedTask.submissions && selectedTask.submissions.length > 0 && (() => {
                            // Find submission for current student
                            const mySubmission = selectedTask.submissions.find((sub: any) =>
                                (typeof sub.student === 'object' ? sub.student._id : sub.student) === user?._id
                            );

                            if (mySubmission && mySubmission.files.length > 0) {
                                return (
                                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 mb-2">Submitted Files</h4>
                                        <ul className="list-disc pl-5 text-sm text-green-600">
                                            {mySubmission.files.map((url: string, i: number) => (
                                                <li key={i}>
                                                    <a href={getDownloadUrl(url)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        Attachment {i + 1}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Submitted on {new Date(mySubmission.submittedAt).toLocaleString()}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </Modal>
            )}

            {/* Image Viewer Modal */}
            {selectedImage && createPortal(
                <div
                    className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};
