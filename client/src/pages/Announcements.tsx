import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal';
import { format } from 'date-fns';
import { Card, CardBody } from '../components/Card';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
    targetProgram: string;
    createdBy?: {
        firstName: string;
        lastName: string;
    };
}

export const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const fetchAnnouncements = async () => {
        setError(''); // Clear previous errors
        try {
            const response = await fetch('/api/announcement', {
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
            const response = await fetch(`/api/announcement/${id}`, {
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-green-700">Announcements</h1>
                    <p className="text-gray-500 mt-1">Broadcast updates to students and coordinators</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus size={18} className="mr-2" />
                    New Announcement
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">Loading announcements...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Megaphone className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">No announcements posted yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {announcements.map((announcement) => (
                        <Card key={announcement._id} className="hover:shadow-md transition-shadow">
                            <CardBody className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${announcement.targetProgram === 'all' ? 'bg-purple-100 text-purple-700' :
                                                    announcement.targetProgram === 'bsit' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {announcement.targetProgram}
                                            </span>
                                            <span className="text-gray-400 text-xs flex items-center">
                                                <Calendar size={12} className="mr-1" />
                                                {format(new Date(announcement.createdAt), 'MMM dd, yyyy h:mm a')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                                        <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(announcement._id)}
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors ml-4"
                                        title="Delete Announcement"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            <CreateAnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAnnouncements}
            />
        </div>
    );
};
