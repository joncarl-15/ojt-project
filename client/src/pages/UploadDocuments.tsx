import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Upload as UploadIcon, FileText, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UploadDocuments: React.FC = () => {
    const [documentName, setDocumentName] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const { user, token } = useAuth();
    const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchDocuments();
        }
    }, [user]);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`/api/document/student/${user?._id}`, {
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

    const handleUpload = async () => {
        if (!files.length || !documentName) return;

        const formData = new FormData();
        formData.append('student', user?._id || '');
        formData.append('documentName', documentName);
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/document', {
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

    const requiredDocuments = [
        "Registration form",
        "School ID",
        "Notarized Parent Consent",
        "Memorandum of agreement"
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                    <UploadIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
                    <p className="text-gray-500">Upload your files — drag and drop or browse manually</p>
                </div>
            </div>

            <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Required Documents (bsba)</h2>
                </CardHeader>
                <CardBody>
                    <ul className="space-y-2">
                        {requiredDocuments.map((doc, index) => (
                            <li key={index} className="flex items-center gap-2 text-gray-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                {doc}
                            </li>
                        ))}
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
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{doc.documentName}</p>
                                            <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
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
                    <Input
                        label="Document Name *"
                        placeholder="e.g., School ID, Birth Certificate, etc."
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
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
                            disabled={files.length === 0 || !documentName}
                            onClick={handleUpload}
                        >
                            Upload Files
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};
