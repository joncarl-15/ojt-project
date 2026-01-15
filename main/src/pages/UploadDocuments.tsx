import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, FileText, X, Loader2, Clock } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface Requirement {
    _id: string;
    name: string;
    program: string;
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
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
};

export const UploadDocuments: React.FC = () => {
    const [documentName, setDocumentName] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const { user, token } = useAuth();
    const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);

    useEffect(() => {
        if (user) {
            fetchDocuments();
            fetchRequirements();
        }
    }, [user]);

    const fetchRequirements = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/requirements`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                // Filter requirements based on user's program
                const userProgram = user?.program?.toLowerCase();
                const filtered = data.filter((req: Requirement) => req.program === userProgram);
                setRequirements(filtered);
            }
        } catch (err) {
            console.error("Failed to fetch requirements", err);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/document/student/${user?._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setUploadedDocuments(data);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!files.length || !documentName) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('student', user?._id || '');
        formData.append('documentName', documentName);
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await fetch(`${API_BASE_URL}/document`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Documents uploaded successfully!');
                setFiles([]);
                setDocumentName('');
                fetchDocuments();
            } else {
                alert('Failed to upload documents.');
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert('An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const requirementOptions = requirements.map(req => ({
        value: req.name,
        label: req.name
    }));

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-violet-900 flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                            <UploadIcon size={20} />
                        </div>
                        Upload Documents
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage and submit your required internship documents</p>
                </div>
            </motion.div>

            <Card className="border border-violet-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-violet-50/50 border-b border-violet-100">
                    <h2 className="text-lg font-bold text-violet-900 flex items-center gap-2">
                        <FileText size={20} className="text-violet-500" />
                        Required Documents
                        <span className="text-xs font-normal text-violet-600 bg-violet-100 px-2 py-1 rounded-full uppercase ml-2 border border-violet-200">
                            {user?.program || 'N/A'}
                        </span>
                    </h2>
                </CardHeader>
                <CardBody className="p-6">
                    <motion.ul
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                        {requirements.length > 0 ? (
                            requirements.map((req) => (
                                <motion.li key={req._id} variants={item} className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 border-l-4 border-l-violet-400">
                                    <div className="flex-1 font-medium">{req.name}</div>
                                </motion.li>
                            ))
                        ) : (
                            <li className="text-slate-500 italic col-span-2 text-center py-4 bg-slate-50 rounded-xl">No requirements found for your program.</li>
                        )}
                    </motion.ul>
                </CardBody>
            </Card>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
                <Card className="border border-violet-100 shadow-sm">
                    <CardHeader className="bg-white border-b border-violet-100">
                        <h2 className="text-lg font-bold text-violet-900">Your Uploaded Documents</h2>
                    </CardHeader>
                    <CardBody className="p-6">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="space-y-3"
                        >
                            {uploadedDocuments.map((doc: any) => (
                                <motion.div key={doc._id} variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
                                    <div className="flex items-start sm:items-center gap-4 mb-3 sm:mb-0">
                                        <div className="p-3 bg-violet-50 rounded-xl text-violet-600 group-hover:bg-violet-100 transition-colors">
                                            {doc.documents && doc.documents[0] && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.documents[0]) ? (
                                                <div
                                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => setSelectedImage(doc.documents[0])}
                                                >
                                                    <img
                                                        src={doc.documents[0]}
                                                        alt="Preview"
                                                        className="w-10 h-10 object-cover rounded-lg"
                                                    />
                                                </div>
                                            ) : (
                                                <FileText size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{doc.documentName}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Clock size={10} />
                                                Uploaded {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider mx-auto sm:mx-0 ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                        doc.status === 'rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                            'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                        {doc.status}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </CardBody>
                </Card>
            )}

            <Card className="border border-violet-100 shadow-lg">
                <CardHeader className="bg-violet-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <UploadIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Upload New Files</h2>
                            <p className="text-violet-100 text-sm opacity-90">Select the requirement and drop your files below</p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="space-y-6 p-6">
                    <Select
                        label="Document Type *"
                        placeholder="Select which requirement this file fulfills"
                        value={documentName}
                        onChange={(value) => setDocumentName(value)}
                        options={requirementOptions}
                        className="text-slate-800"
                    />

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            border-3 border-dashed rounded-2xl p-10 text-center transition-all duration-300
                            ${isDragging
                                ? 'border-violet-500 bg-violet-50 scale-[1.02]'
                                : 'border-slate-300 hover:border-violet-400 hover:bg-slate-50'
                            }
                        `}
                    >
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                                <UploadIcon size={32} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-700 mb-1">
                                    Drag & Drop files here
                                </p>
                                <p className="text-slate-500 text-sm">
                                    or <span className="text-violet-600 font-bold cursor-pointer hover:underline" onClick={() => document.getElementById('file-upload')?.click()}>browse your device</span>
                                </p>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-100 group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-white rounded-lg border border-violet-100 text-violet-600">
                                            <FileText size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-violet-900 truncate">{file.name}</p>
                                            <p className="text-xs text-violet-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1.5 text-violet-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center pt-4">
                        <Button
                            type="button"
                            className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 w-auto px-6 font-medium"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            Browse More
                        </Button>
                        <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 w-auto px-8 font-bold"
                            disabled={files.length === 0 || !documentName || uploading}
                            onClick={handleUpload}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Uploading...
                                </>
                            ) : (
                                'Submit Documents'
                            )}
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Image Viewer Modal */}
            {selectedImage && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
                        title="Close"
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
