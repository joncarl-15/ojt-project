import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface UpdateStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student: {
        _id: string;
        userName: string;
        metadata?: {
            status?: string;
        };
    } | null;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ isOpen, onClose, onSuccess, student }) => {
    const [status, setStatus] = useState(student?.metadata?.status || 'scheduled');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    // Update local state when student changes
    React.useEffect(() => {
        if (student) {
            setStatus(student.metadata?.status || 'scheduled');
        }
    }, [student]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;

        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/user/deployment-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: student._id,
                    status: status
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update status');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Status: ${student.userName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <Select
                    label="Deployment Status"
                    value={status}
                    onChange={(value) => setStatus(value)}
                    required
                    options={[
                        { value: 'scheduled', label: 'Scheduled' },
                        { value: 'deployed', label: 'Deployed' },
                        { value: 'completed', label: 'Completed' }
                    ]}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Update Status
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
