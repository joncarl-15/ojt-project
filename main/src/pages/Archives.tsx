import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Search, Archive, User, FileText, RotateCcw, Trash2, Download, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

// Types matched to backend response
interface ArchivedUser {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    role: string;
    program?: string;
    metadata?: {
        company?: {
            name: string;
        };
        coordinator?: {
            firstName: string;
            lastName: string;
        };
        status?: string;
    };
    isArchived: boolean;
    archivedAt: string;
}

interface ArchivedDocument {
    _id: string;
    documentName: string;
    status: string;
    student: {
        firstName: string;
        lastName: string;
        email: string;
        program: string;
    };
    isArchived: boolean;
    archivedAt: string;
    uploadedAt: string;
}

export const Archives: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'students' | 'coordinators' | 'documents'>('students');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<ArchivedUser[]>([]);
    const [documents, setDocuments] = useState<ArchivedDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();

    // Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState('');

    const fetchArchives = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'students' || activeTab === 'coordinators') {
                const response = await fetch(`${API_BASE_URL}/archive/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(Array.isArray(data) ? data : []);
                }
            } else {
                const response = await fetch(`${API_BASE_URL}/archive/documents`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setDocuments(Array.isArray(data) ? data : []);
                }
            }
        } catch (err) {
            console.error('Failed to fetch archives:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArchives();
    }, [token, activeTab]);

    const handleRestore = async (id: string, type: 'user' | 'document') => {
        if (!confirm('Are you sure you want to restore this item?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/archive/restore/${type}/${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchArchives();
            } else {
                alert('Failed to restore item');
            }
        } catch (err) {
            console.error('Failed to restore:', err);
        }
    };

    const handleDeleteForever = async (id: string, type: 'user' | 'document') => {
        if (!confirm('Are you sure you want to delete this item PERMANENTLY? This cannot be undone.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/archive/${type}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchArchives();
            } else {
                alert('Failed to delete item');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/archive/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `archive_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to export:', err);
            alert('Failed to export data');
        }
    };

    const handleImport = async () => {
        try {
            const parsedData = JSON.parse(importData);
            const response = await fetch(`${API_BASE_URL}/archive/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(parsedData)
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Import successful: ${result.results.usersImported} users, ${result.results.documentsImported} documents.`);
                setIsImportModalOpen(false);
                setImportData('');
                fetchArchives();
            } else {
                alert('Import failed: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Invalid JSON data or import error');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setImportData(text);
                }
            };
            reader.readAsText(file);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesTab = activeTab === 'students' ? u.role === 'student' : u.role === 'coordinator';
        const matchesSearch =
            u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const filteredDocuments = documents.filter(d => {
        const matchesSearch =
            d.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.student.lastName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const tabs = [
        { id: 'students', label: 'Archived Students', icon: User, count: users.filter(u => u.role === 'student').length },
        { id: 'coordinators', label: 'Archived Coordinators', icon: User, count: users.filter(u => u.role === 'coordinator').length },
        { id: 'documents', label: 'Archived Documents', icon: FileText, count: documents.length }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <Archive className="text-green-700" /> Archive
                    </h1>
                    <p className="text-green-600 mt-1">Manage deleted records and data recover</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2">
                        <UploadIcon size={16} /> Import Data
                    </Button>
                    <Button variant="primary" onClick={handleExport} className="flex items-center gap-2">
                        <Download size={16} /> Export Data
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="border-b border-gray-100 overflow-x-auto">
                    <div className="flex px-4 sm:px-6 pt-4 gap-6 min-w-max">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                {/* Count is tricky because we fetch per tab group essentially, but let's just show loaded count if available */}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="max-w-md">
                        <Input
                            icon={<Search size={20} />}
                            placeholder="Search archives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white w-full"
                        />
                    </div>
                </div>

                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading archives...</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-green-50 text-green-800 text-sm font-medium">
                                    <tr>
                                        {(activeTab === 'students' || activeTab === 'coordinators') ? (
                                            <>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Archived At</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4">Document Name</th>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Archived At</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(activeTab === 'students' || activeTab === 'coordinators') ? (
                                        filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No records found</td></tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user._id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 font-medium text-green-700">{user.firstName} {user.lastName}</td>
                                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                                    <td className="px-6 py-4 capitalize">{user.role}</td>
                                                    <td className="px-6 py-4 text-gray-500">{user.archivedAt ? format(new Date(user.archivedAt), 'MMM d, yyyy') : '-'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRestore(user._id, 'user')}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Restore"
                                                            >
                                                                <RotateCcw size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteForever(user._id, 'user')}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                title="Delete Forever"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    ) : (
                                        filteredDocuments.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No records found</td></tr>
                                        ) : (
                                            filteredDocuments.map(doc => (
                                                <tr key={doc._id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 font-medium text-green-700">{doc.documentName}</td>
                                                    <td className="px-6 py-4 text-gray-500">{doc.student ? `${doc.student.firstName} ${doc.student.lastName}` : 'Unknown'}</td>
                                                    <td className="px-6 py-4 capitalize">{doc.status}</td>
                                                    <td className="px-6 py-4 text-gray-500">{doc.archivedAt ? format(new Date(doc.archivedAt), 'MMM d, yyyy') : '-'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleRestore(doc._id, 'document')}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Restore"
                                                            >
                                                                <RotateCcw size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteForever(doc._id, 'document')}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                title="Delete Forever"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Import Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Data">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Upload a JSON file containing exported archive data.
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="import-file"
                        />
                        <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center gap-2">
                            <UploadIcon className="text-gray-400" size={32} />
                            <span className="text-sm font-medium text-gray-700">Click to upload JSON</span>
                        </label>
                    </div>
                    {importData && (
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-500 truncate">
                            File loaded. Ready to import.
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleImport} disabled={!importData}>Import</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
