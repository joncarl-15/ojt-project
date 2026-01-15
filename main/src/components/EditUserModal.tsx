import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        firstName: '',
        lastName: '',
        program: '',
    });
    const [assignmentData, setAssignmentData] = useState({
        status: '',
        deploymentDate: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (user) {
            setFormData({
                userName: user.userName || user.username || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                program: user.program || '',
            });
            setAssignmentData({
                status: user.metadata?.status || 'scheduled',
                deploymentDate: user.metadata?.deploymentDate || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ _id: user._id, ...formData })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                    />
                    <Input
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                    />
                </div>

                <Input
                    label="Username"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    required
                />

                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />

                <Select
                    label="Program"
                    value={formData.program}
                    onChange={(value) => setFormData({ ...formData, program: value })}
                    options={[
                        { value: 'bsit', label: 'BSIT' },
                        { value: 'bsba', label: 'BSBA' }
                    ]}
                />

                {user.role === 'student' && user.metadata?.company && (
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Assignment Details</h3>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                                <div className="flex gap-2 mt-2">
                                    {['scheduled', 'deployed', 'completed'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={async () => {
                                                // Optimistic update
                                                setAssignmentData(prev => ({ ...prev, status }));

                                                try {
                                                    const response = await fetch(`${API_BASE_URL}/user/deployment-status`, {
                                                        method: 'PATCH',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({ userId: user._id, status })
                                                    });

                                                    if (response.ok) {
                                                        onSuccess();
                                                    }
                                                } catch (err) {
                                                    console.error("Failed to update status", err);
                                                }
                                            }}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${assignmentData.status === status
                                                    ? 'bg-green-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {assignmentData.deploymentDate && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">
                                        {assignmentData.status === 'scheduled' ? 'Scheduled Date' : 'Deployment Date'}
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                                        value={assignmentData.deploymentDate ? new Date(assignmentData.deploymentDate).toISOString().split('T')[0] : ''}
                                        onChange={async (e) => {
                                            const newDate = e.target.value;
                                            setAssignmentData(prev => ({ ...prev, deploymentDate: newDate }));

                                            try {
                                                const response = await fetch(`${API_BASE_URL}/user/deployment-status`, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        userId: user._id,
                                                        status: assignmentData.status,
                                                        deploymentDate: newDate
                                                    })
                                                });

                                                if (response.ok) {
                                                    onSuccess();
                                                }
                                            } catch (err) {
                                                console.error("Failed to update date", err);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
