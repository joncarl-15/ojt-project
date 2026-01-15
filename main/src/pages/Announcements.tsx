import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal'; // Assumption, will verify

interface Announcement {
    _id: string;
    title: string;
    content: string;
    targetProgram: string;
    createdAt: string;
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const Announcements: React.FC = () => {
    // ... existing state ...
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    // ... existing functions ...
    const fetchAnnouncements = async () => {
        setError(''); // Clear previous errors
        try {
            const response = await fetch(`${API_BASE_URL}/announcement`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to fetch announcements');
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/announcement/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete announcement');
            fetchAnnouncements();
        } catch (err: any) {
            alert(err.message);
        }
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
                    <h1 className="text-2xl font-extrabold text-amber-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-sm">
                            <Megaphone className="text-amber-600" size={24} />
                        </div>
                        Announcements
                    </h1>
                    <p className="text-amber-700 mt-1 ml-1 font-medium text-sm">Broadcast updates to students and coordinators</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 border-none px-6 rounded-lg transition-all hover:scale-105 active:scale-95 text-sm font-bold gap-2">
                    <Plus size={20} />
                    New Announcement
                </Button>
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 shadow-sm"
                >
                    {error}
                </motion.div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-amber-600">
                    <p className="font-medium animate-pulse">Loading announcements...</p>
                </div>
            ) : announcements.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-100"
                >
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="text-amber-300" size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-amber-900">No announcements posted yet</h3>
                    <p className="text-amber-600 mt-1">Create your first announcement to get started.</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4"
                >
                    {announcements.map((announcement) => (
                        <motion.div key={announcement._id} variants={item}>
                            <Card className="hover:shadow-xl transition-all duration-300 shadow-md bg-white group overflow-hidden border border-slate-200 border-l-4 border-l-orange-500">
                                <CardBody className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm ${announcement.targetProgram === 'all' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    announcement.targetProgram === 'bsit' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                        'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                    {announcement.targetProgram}
                                                </span>
                                                <span className="text-slate-400 text-xs flex items-center font-medium">
                                                    <Calendar size={12} className="mr-1" />
                                                    {format(new Date(announcement.createdAt), 'MMM dd, yyyy • h:mm a')}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">{announcement.title}</h3>
                                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">{announcement.content}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(announcement._id)}
                                            className="text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-rose-500 transition-all shadow-sm"
                                            title="Delete Announcement"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <CreateAnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAnnouncements}
            />
        </div>
    );
};
