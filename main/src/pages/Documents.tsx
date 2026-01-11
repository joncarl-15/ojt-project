import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, FileText, CheckCircle, XCircle, Trash2, ExternalLink, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Input } from '../components/Input';

interface Student {
    _id: string;
    userName: string;
    firstName: string;
    lastName: string;
    program?: string;
}

interface Document {
    _id: string;
    student: Student | string; // Could be populated or id
    documentName: string;
    documents: string[];
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: string;
    remarks: string;
}

export const Documents: React.FC = () => {
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <FileText className="text-green-700" /> Student Documents
                    </h1>
                    <p className="text-green-600 mt-1">View and manage all uploaded student documents</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <form onSubmit={handleSearch}>
                        <Input
                            icon={<Search size={20} />}
                            placeholder="Search by student name, document name or program..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white"
                        />
                    </form>
                </CardHeader>

                <CardBody className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="animate-spin text-green-600" size={32} />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500">No documents found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-green-50 text-green-800 text-sm font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Document</th>
                                        <th className="px-6 py-4">Uploaded</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {documents.map((doc) => (
                                        <tr key={doc._id} id={`doc-${doc._id}`} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-green-700">{getStudentName(doc.student)}</p>
                                                    <p className="text-xs text-gray-500 uppercase">{getProgram(doc.student)}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    {doc.documents[0] && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.documents[0]) ? (
                                                        <div
                                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => setSelectedImage(doc.documents[0])}
                                                        >
                                                            <img
                                                                src={doc.documents[0]}
                                                                alt="Document Preview"
                                                                className="w-10 h-10 object-cover rounded border border-gray-200 hover:scale-150 transition-transform origin-left"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <FileText size={16} className="text-gray-400" />
                                                    )}
                                                    {doc.documentName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                    ${doc.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        doc.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    } `}>
                                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {doc.documents && doc.documents.length > 0 && (
                                                        <a
                                                            href={doc.documents[0]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="View Document"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </a>
                                                    )}

                                                    <button
                                                        onClick={() => handleStatusUpdate(doc._id, 'approved')}
                                                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(doc._id, 'rejected')}
                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(doc._id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
