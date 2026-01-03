import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2, X } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Student {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    program?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        setIsFetchingStudents(true);
        try {
            const response = await fetch('/api/user/search', {
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
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('dueDate', formData.dueDate);

            // Append each assigned student ID
            formData.assignedTo.forEach(id => submitData.append('assignedTo[]', id));

            // Append files
            files.forEach(file => submitData.append('files', file));

            const response = await fetch('/api/task', {
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

            onSuccess();
            onClose();
            setFormData({ title: '', description: '', dueDate: '', assignedTo: [] });
            setFiles([]);
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
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <Input
                    label="Task Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
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

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                        {isFetchingStudents ? (
                            <div className="flex justify-center py-2"><Loader2 className="animate-spin text-gray-400" size={16} /></div>
                        ) : students.length > 0 ? (
                            students.map(student => (
                                <div key={student._id} className="flex items-center gap-2 mb-1">
                                    <input
                                        type="checkbox"
                                        id={`student-${student._id}`}
                                        checked={formData.assignedTo.includes(student._id)}
                                        onChange={() => toggleStudentSelection(student._id)}
                                        className="rounded text-green-600 focus:ring-green-500"
                                    />
                                    <label htmlFor={`student-${student._id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                        {student.firstName} {student.lastName} ({student.program?.toUpperCase()})
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center">No students found.</p>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 text-right">Selected: {formData.assignedTo.length}</p>
                </div>

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

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Create Task
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
