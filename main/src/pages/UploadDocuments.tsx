import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { Upload as UploadIcon, FileText, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


interface Requirement {
    _id: string;
    name: string;
    program: 'bsit' | 'bsba';
}

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

    const handleDragLeave = () => {
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <UploadIcon className="text-green-700" /> Upload Documents
                    </h1>
                    <p className="text-green-600 mt-1">Upload your files — drag and drop or browse manually</p>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Required Documents ({user?.program || 'N/A'})</h2>
                </CardHeader>
                <CardBody>
                    <ul className="space-y-2">
                        {requirements.length > 0 ? (
                            requirements.map((req) => (
                                <li key={req._id} className="flex items-center gap-2 text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    {req.name}
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500 italic">No requirements found for your program.</li>
                        )}
                    </ul>
                </CardBody>
            </Card>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
                <Card className="border border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Your Uploaded Documents</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {uploadedDocuments.map((doc: any) => (
                                <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-gray-100 text-green-600">
                                            {doc.documents && doc.documents[0] && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.documents[0]) ? (
                                                <div
                                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => setSelectedImage(doc.documents[0])}
                                                >
                                                    <img
                                                        src={doc.documents[0]}
                                                        alt="Preview"
                                                        className="w-12 h-12 object-cover rounded-md border border-gray-200"
                                                    />
                                                </div>
                                            ) : (
                                                <FileText size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{doc.documentName}</p>
                                            <p className="text-xs text-gray-500">{new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {doc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                    <UploadIcon size={18} className="text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Upload Files</h2>
                </CardHeader>
                <CardBody className="space-y-6">
                    <Select
                        label="Document Name *"
                        placeholder="Select document type"
                        value={documentName}
                        onChange={(value) => setDocumentName(value)}
                        options={requirementOptions}
                    />

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            border-2 border-dashed rounded-xl p-8 text-center transition-colors
                            ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}
                        `}
                    >
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                <UploadIcon size={24} />
                            </div>
                            <p className="text-gray-500">
                                Drop files here or <span className="text-green-600 cursor-pointer hover:underline" onClick={() => document.getElementById('file-upload')?.click()}>click below to browse</span>
                            </p>
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
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-white rounded-lg border border-gray-100 text-green-600">
                                            <FileText size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 justify-center pt-2">
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700 w-auto px-6 text-white"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            Browse Files
                        </Button>
                        <Button
                            className="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 w-auto px-6"
                            disabled={files.length === 0 || !documentName || uploading}
                            onClick={handleUpload}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Uploading...
                                </>
                            ) : (
                                'Upload Files'
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
