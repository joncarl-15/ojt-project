import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckCircle, Clock, AlertCircle, FileText, ChevronRight, Download, X } from 'lucide-react';
import { Modal } from '../components/Modal';

import { useAuth } from '../context/AuthContext';


interface Task {
    _id: string; // MongoDB ID is _id
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate: string; // API returns date string
    priority: 'low' | 'medium' | 'high';
    submissionProofUrl?: string[];
    submissions?: {
        student: string;
        files: string[];
        submittedAt: string;
    }[];
}

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

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'high': return 'text-green-800 font-bold';
            case 'medium': return 'text-green-600';
            case 'low': return 'text-gray-500';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <CheckCircle className="text-green-700" /> My Tasks
                    </h1>
                    <p className="text-green-600 mt-1">View and manage your assigned tasks</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-green-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-full sm:w-auto"
                    >
                        <option value="all">All Tasks</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredTasks.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No tasks found.</div>
                ) : (
                    filteredTasks.map(task => {
                        const effectiveStatus = getEffectiveStatus(task);
                        return (
                            <Card
                                key={task._id}
                                className="group hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-green-200"
                                onClick={() => setSelectedTask(task)}
                            >
                                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${effectiveStatus === 'completed' ? 'bg-green-100 text-green-600' :
                                            effectiveStatus === 'in-progress' ? 'bg-green-50 text-green-600' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>
                                            {effectiveStatus === 'completed' ? <CheckCircle size={24} /> :
                                                effectiveStatus === 'in-progress' ? <Clock size={24} /> :
                                                    <AlertCircle size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{task.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">{task.description}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(effectiveStatus)}`}>
                                                    {effectiveStatus.replace('-', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Due {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                                <span className={`text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                                                    {task.priority} Priority
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-green-500 transition-colors hidden sm:block">
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

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
                                                            <Download size={16} className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
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
                                                    <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
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
