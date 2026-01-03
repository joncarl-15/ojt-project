import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    role: 'student' | 'coordinator';
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess, role }) => {
    const [formData, setFormData] = useState({
        userName: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        program: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, role })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user');
            }

            onSuccess();
            onClose();
            setFormData({ userName: '', password: '', email: '', firstName: '', lastName: '', program: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Create New ${role.charAt(0).toUpperCase() + role.slice(1)}`}>
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

                <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Create User
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
