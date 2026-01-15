import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Upload as UploadIcon, Download, Search, User, FileText, RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';

import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface ArchivedUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    archivedAt: string;
}

interface ArchivedDocument {
    _id: string;
    documentName: string;
    student: {
        firstName: string;
        lastName: string;
    };
    status: string;
    archivedAt: string;
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

export const Archives: React.FC = () => {
    // ... existing state ...
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
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center flex-wrap gap-4"
            >
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-slate-200 to-gray-100 rounded-2xl shadow-sm">
                            <Archive className="text-slate-600" size={24} />
                        </div>
                        Archive
                    </h1>
                    <p className="text-slate-500 mt-1 ml-1 font-medium text-sm">Manage deleted records and data recovery</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300">
                        <UploadIcon size={18} /> Import
                    </Button>
                    <Button variant="primary" onClick={handleExport} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-200">
                        <Download size={18} /> Export
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-black/5">
                        <div className="border-b border-slate-100 overflow-x-auto bg-white/50">
                            <div className="flex px-6 pt-4 gap-8 min-w-max">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-[3px] whitespace-nowrap px-1 ${activeTab === tab.id
                                            ? 'border-slate-800 text-slate-800'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                        <span className={`px-2 py-0.5 rounded-full text-xs transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="max-w-md relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    placeholder="Search archives..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-sm transition-all"
                                />
                            </div>
                        </div>

                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                {isLoading ? (
                                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                        <Loader2 className="animate-spin mb-2" size={24} />
                                        Loading archives...
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                                {(activeTab === 'students' || activeTab === 'coordinators') ? (
                                                    <>
                                                        <th className="px-6 py-4 rounded-tl-lg">Name</th>
                                                        <th className="px-6 py-4">Email</th>
                                                        <th className="px-6 py-4">Role</th>
                                                        <th className="px-6 py-4">Archived At</th>
                                                        <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
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
                                        <AnimatePresence mode='wait'>
                                            <motion.tbody
                                                key={activeTab} // Key forces re-render and animation on tab switch
                                                variants={container}
                                                initial="hidden"
                                                animate="show"
                                                exit="hidden"
                                                className="divide-y divide-slate-50"
                                            >
                                                {(activeTab === 'students' || activeTab === 'coordinators') ? (
                                                    filteredUsers.length === 0 ? (
                                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No records found</td></tr>
                                                    ) : (
                                                        filteredUsers.map(user => (
                                                            <motion.tr
                                                                key={user._id}
                                                                variants={item}
                                                                className="hover:bg-slate-50/60 transition-colors group"
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-slate-700">{user.firstName} {user.lastName}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500 text-sm">{user.email}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                                                        {user.role}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-400 text-sm">{user.archivedAt ? format(new Date(user.archivedAt), 'MMM d, yyyy') : '-'}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end gap-2 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleRestore(user._id, 'user')}
                                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                                            title="Restore"
                                                                        >
                                                                            <RotateCcw size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteForever(user._id, 'user')}
                                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                                            title="Delete Forever"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        ))
                                                    )
                                                ) : (
                                                    filteredDocuments.length === 0 ? (
                                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No records found</td></tr>
                                                    ) : (
                                                        filteredDocuments.map(doc => (
                                                            <motion.tr
                                                                key={doc._id}
                                                                variants={item}
                                                                className="hover:bg-slate-50/60 transition-colors group"
                                                            >
                                                                <td className="px-6 py-4 font-bold text-slate-700">{doc.documentName}</td>
                                                                <td className="px-6 py-4 text-slate-500 text-sm">{doc.student ? `${doc.student.firstName} ${doc.student.lastName}` : 'Unknown'}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`capitalize px-2 py-0.5 rounded text-xs font-bold border ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : doc.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                        }`}>
                                                                        {doc.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-400 text-sm">{doc.archivedAt ? format(new Date(doc.archivedAt), 'MMM d, yyyy') : '-'}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end gap-2 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleRestore(doc._id, 'document')}
                                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                                            title="Restore"
                                                                        >
                                                                            <RotateCcw size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteForever(doc._id, 'document')}
                                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                                            title="Delete Forever"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        ))
                                                    )
                                                )}
                                            </motion.tbody>
                                        </AnimatePresence>
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
                </motion.div>
            </motion.div>
        </div>
    );
};
