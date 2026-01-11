import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { Loader2, X } from 'lucide-react';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    task?: any;
}

interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    program?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSuccess, task }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        assignedTo: [] as string[], // Array of student IDs
    });
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
            if (task) {
                // Populate form for editing
                setFormData({
                    title: task.title || '',
                    description: task.description || '',
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                    assignedTo: task.assignedTo ? task.assignedTo.map((s: any) => typeof s === 'object' ? s._id : s) : [],
                });
            } else {
                // Reset form for creating
                setFormData({ title: '', description: '', dueDate: '', assignedTo: [] });
                setFiles([]);
            }
        }
    }, [isOpen, task]);

    const fetchStudents = async () => {
        setIsFetchingStudents(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: 'student' }) // Fetch all students
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setStudents(data);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setIsFetchingStudents(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // For editing, we use JSON body because we are not uploading new files via this endpoint (usually)
            // But wait, the original CreateTaskModal used FormData to support file upload.
            // If we want to support file upload in edit, we should stick to FormData.
            // However, the backend updateTask might expect JSON if it's simpler, or we check if it supports Multer.
            // Looking at TaskController.updateTask (line 99), it calls `this.taskService.updateTask(req.body)`.
            // It does NOT have `@UseMiddleware(upload...)`. So it does NOT support file upload during update.
            // So for update, we must send JSON.

            if (task) {
                // Update existing task
                const updateData = {
                    _id: task._id,
                    title: formData.title,
                    description: formData.description,
                    dueDate: formData.dueDate,
                    assignedTo: formData.assignedTo
                };

                const response = await fetch(`${API_BASE_URL}/task`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to update task');
                }
            } else {
                // Create new task
                const submitData = new FormData();
                submitData.append('title', formData.title);
                submitData.append('description', formData.description);
                submitData.append('dueDate', formData.dueDate);

                // Append each assigned student ID
                formData.assignedTo.forEach(id => submitData.append('assignedTo[]', id));

                // Append files
                files.forEach(file => submitData.append('files', file));

                const response = await fetch(`${API_BASE_URL}/task`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: submitData
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to create task');
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setFormData(prev => {
            const isSelected = prev.assignedTo.includes(studentId);
            if (isSelected) {
                return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== studentId) };
            } else {
                return { ...prev, assignedTo: [...prev.assignedTo, studentId] };
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Edit Task" : "Create New Task"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <Input
                    label="Task Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm resize-none"
                        rows={4}
                        placeholder="Enter task details and requirements..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <Input
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                />

                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                    <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                        {isFetchingStudents ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-green-600" size={20} /></div>
                        ) : students.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {students.map(student => (
                                    <label
                                        key={student._id}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-green-50/50 ${formData.assignedTo.includes(student._id) ? 'bg-green-50' : ''}`}
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedTo.includes(student._id)}
                                                onChange={() => toggleStudentSelection(student._id)}
                                                className="peer h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {student.firstName} {student.lastName}
                                            </p>
                                            <p className="text-xs text-green-600 font-medium">
                                                {student.program?.toUpperCase()}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No students found.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {formData.assignedTo.length} selected
                        </span>
                    </div>
                </div>

                {!task && (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Attachments (Optional)</label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <p className="mb-2 text-sm text-green-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-green-600">PDF, DOC, Images (MAX. 10MB)</p>
                                </div>
                                <input id="dropzone-file" type="file" className="hidden" multiple onChange={handleFileChange} />
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm bg-gray-100 px-2 py-1 rounded">
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                        <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== index))} className="text-gray-500 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {task ? 'Save Changes' : 'Create Task'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
