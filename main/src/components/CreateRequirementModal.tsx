import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface Requirement {
    _id?: string;
    name: string;
    program: 'bsit' | 'bsba';
}

interface CreateRequirementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Requirement | null;
    mode: 'create' | 'edit';
}

export const CreateRequirementModal: React.FC<CreateRequirementModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    mode
}) => {
    const [formData, setFormData] = useState<Requirement>({
        name: '',
        program: 'bsit'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (isOpen && initialData && mode === 'edit') {
            setFormData(initialData);
        } else if (isOpen) {
            setFormData({ name: '', program: 'bsit' });
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const url = `${API_BASE_URL}/requirements`;
            const method = mode === 'create' ? 'POST' : 'PATCH';
            const body = mode === 'create' ? formData : { ...formData, _id: initialData?._id };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save requirement');
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
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? "Add New Requirement" : "Edit Requirement"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Registration Form"
                />

                <Select
                    label="Program"
                    value={formData.program}
                    onChange={(value) => setFormData({ ...formData, program: value as 'bsit' | 'bsba' })}
                    options={[
                        { value: 'bsit', label: 'BSIT' },
                        { value: 'bsba', label: 'BSBA' }
                    ]}
                    required
                />

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {mode === 'create' ? 'Add Requirement' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
