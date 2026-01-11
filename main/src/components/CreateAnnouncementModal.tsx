import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface CreateAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetProgram: 'all'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token, user } = useAuth();

    React.useEffect(() => {
        if (user?.role === 'coordinator' && user.program) {
            setFormData(prev => ({ ...prev, targetProgram: user.program! }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/announcement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create announcement');
            }

            onSuccess();
            onClose();
            setFormData({ title: '', content: '', targetProgram: 'all' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Post Announcement">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <Input
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Schedule Update"
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Content</label>
                    <textarea
                        className="block w-full rounded-xl border-gray-200 bg-gray-50/50 shadow-sm 
                        focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 
                        transition-all duration-200 ease-in-out
                        placeholder:text-gray-400 px-4 py-3"
                        rows={4}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                        placeholder="Write your announcement here..."
                    />
                </div>

                <Select
                    label="Target Audience"
                    value={formData.targetProgram}
                    onChange={(value) => setFormData({ ...formData, targetProgram: value })}
                    options={[
                        { value: 'all', label: 'All Programs' },
                        { value: 'bsit', label: 'BSIT' },
                        { value: 'bsba', label: 'BSBA' }
                    ]}
                    disabled={user?.role === 'coordinator'}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Post Announcement
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
