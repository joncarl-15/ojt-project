import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckCircle, Clock, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { Modal } from '../components/Modal';

import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';

interface Task {
    _id: string; // MongoDB ID is _id
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate: string; // API returns date string
    priority: 'low' | 'medium' | 'high';
    submissionProofUrl?: string[];
}

export const MyTasks: React.FC = () => {
    const { user, token } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user, token]); // Added token to dependency array

    const fetchTasks = async () => {
        try {
            const response = await fetch(`/api/task/student/${user?._id}`, {
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
            const response = await fetch(`/api/task/add-files/${selectedTask._id}`, {
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

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    const getStatusColor = (status: Task['status']) => {
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
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
                    filteredTasks.map(task => (
                        <Card
                            key={task._id}
                            className="group hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-green-200"
                            onClick={() => setSelectedTask(task)}
                        >
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${task.status === 'completed' ? 'bg-green-100 text-green-600' :
                                        task.status === 'in-progress' ? 'bg-green-50 text-green-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                        {task.status === 'completed' ? <CheckCircle size={24} /> :
                                            task.status === 'in-progress' ? <Clock size={24} /> :
                                                <AlertCircle size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{task.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">{task.description}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(task.status)}`}>
                                                {task.status.replace('-', ' ')}
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
                                <div className="text-gray-300 group-hover:text-green-500 transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {selectedTask && (
                <Modal
                    isOpen={!!selectedTask}
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

                        {selectedTask.submissionProofUrl && selectedTask.submissionProofUrl.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-2">Submitted Files</h4>
                                <ul className="list-disc pl-5 text-sm text-green-600">
                                    {selectedTask.submissionProofUrl.map((url, i) => (
                                        <li key={i}>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                Attachment {i + 1}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};
