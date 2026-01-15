import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Search, Loader2, ExternalLink, CheckCircle, XCircle, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardBody } from '../components/Card';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface Student {
    firstName: string;
    lastName: string;
    program?: string;
}

interface Document {
    _id: string;
    student: Student | string;
    documentName: string;
    documents: string[];
    status: string;
    uploadedAt: string;
}

// Animation Variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
};

export const Documents: React.FC = () => {
    // ... existing state ...
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    // const { token } = useAuth(); // Handled later

    const fetchDocuments = async (query = '') => {
        setIsLoading(true);
        try {
            const endpoint = query ? `${API_BASE_URL}/document/search` : `${API_BASE_URL}/document`;
            const method = query ? 'POST' : 'GET';
            const body = query ? JSON.stringify({ query }) : undefined;

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch documents');

            setDocuments(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const [searchParams] = useSearchParams();
    const { user, token } = useAuth(); // Destructure user from useAuth
    const navigate = useNavigate();

    // Redirect students
    useEffect(() => {
        if (user && user.role === 'student') {
            navigate('/upload-documents', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchDocuments();
    }, [token]);

    // Check for highlight param and scroll/highlight
    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (highlightId && documents.length > 0) {
            const element = document.getElementById(`doc-${highlightId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('bg-yellow-100');
                setTimeout(() => {
                    element.classList.remove('bg-yellow-100');
                }, 3000);
            }
        }
    }, [searchParams, documents]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDocuments(searchQuery);
    };

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
        console.log(`Attempting to ${newStatus} document ${id}`);
        if (!confirm(`Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'reject'} this document?`)) return;

        try {
            const endpoint = newStatus === 'approved'
                ? `${API_BASE_URL}/document/approve/${id}`
                : `${API_BASE_URL}/document/disapprove/${id}`;

            const payload = newStatus === 'rejected'
                ? { remarks: 'Rejected by admin' }
                : {}; // Send empty object for approval to ensure valid JSON body

            console.log(`Sending request to ${endpoint}`, payload);

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            console.log(`Response status: ${response.status}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${newStatus} document`);
            }

            alert(`Document ${newStatus} successfully`);
            fetchDocuments(searchQuery);
        } catch (err: any) {
            console.error('Error updating status:', err);
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to move this document to the archive?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/document/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete document');
            fetchDocuments(searchQuery);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getStudentName = (student: Student | string) => {
        if (typeof student === 'object' && student !== null) {
            return `${student.firstName} ${student.lastName} `;
        }
        return 'Unknown Student';
    };

    const getProgram = (student: Student | string) => {
        if (typeof student === 'object' && student !== null) {
            return student.program || 'N/A';
        }
        return 'N/A';
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
                    <h1 className="text-2xl font-extrabold text-violet-900 flex items-center gap-3">
                        <div className="p-2 bg-violet-50 rounded-2xl shadow-sm">
                            <FileText className="text-violet-600" size={24} />
                        </div>
                        Student Documents
                    </h1>
                    <p className="text-violet-600 mt-1 ml-1 font-medium text-sm">View and manage uploaded student requirements</p>
                </div>
            </motion.div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-black/5">
                    <CardHeader className="bg-white border-b border-violet-100 p-6">
                        <form onSubmit={handleSearch} className="relative max-w-lg w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-violet-400" size={20} />
                            </div>
                            <input
                                placeholder="Search by student name, document name or program..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-violet-200 rounded-xl leading-5 bg-violet-50/30 placeholder-violet-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition-all duration-200"
                            />
                        </form>
                    </CardHeader>

                    <CardBody className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="animate-spin text-violet-600" size={40} />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-16 bg-violet-50/20">
                                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                    <FileText className="text-violet-400" size={40} />
                                </div>
                                <h3 className="text-lg font-semibold text-violet-900">No documents found</h3>
                                <p className="text-violet-500 mt-1">Try adjusting your search query</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-violet-50/80 border-b border-violet-100 text-violet-900 text-xs uppercase tracking-wider font-semibold">
                                            <th className="px-6 py-4 rounded-tl-lg">Student</th>
                                            <th className="px-6 py-4">Document</th>
                                            <th className="px-6 py-4">Uploaded</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                                        </tr>
                                    </thead>
                                    <motion.tbody
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="divide-y divide-violet-50"
                                    >
                                        {documents.map((doc) => (
                                            <motion.tr
                                                key={doc._id}
                                                variants={item}
                                                id={`doc-${doc._id}`}
                                                className="hover:bg-violet-50/40 transition-colors group"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                            {doc.student && typeof doc.student !== 'string' ? doc.student.firstName[0] : 'U'}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-slate-800">{getStudentName(doc.student)}</div>
                                                            <div className="text-xs font-medium text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                                                {getProgram(doc.student)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative group/preview cursor-pointer" onClick={() => setSelectedImage(doc.documents[0])}>
                                                            {doc.documents[0] && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.documents[0]) ? (
                                                                <div className="w-12 h-12 rounded-lg border-2 border-white shadow-sm overflow-hidden relative">
                                                                    <img
                                                                        src={doc.documents[0]}
                                                                        alt="Preview"
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-110"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/10 transition-colors" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center text-violet-500">
                                                                    <FileText size={24} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{doc.documentName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-slate-500">
                                                        {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                                                    </span>
                                                    <div className="text-xs text-slate-400">
                                                        {format(new Date(doc.uploadedAt), 'h:mm a')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm
                                                        ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                            doc.status === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                                'bg-amber-100 text-amber-700 border-amber-200'
                                                        } `}>
                                                        {doc.status === 'approved' && <CheckCircle size={12} className="mr-1.5" />}
                                                        {doc.status === 'rejected' && <XCircle size={12} className="mr-1.5" />}
                                                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2 transition-opacity">
                                                        {doc.documents && doc.documents.length > 0 && (
                                                            <a
                                                                href={doc.documents[0]}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                                title="View Document"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => handleStatusUpdate(doc._id, 'approved')}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(doc._id, 'rejected')}
                                                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>

                                                        <div className="w-px h-8 bg-slate-200 mx-1"></div>

                                                        <button
                                                            onClick={() => handleDelete(doc._id)}
                                                            className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </motion.tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>

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
