import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { LocationMap } from './LocationMap';

interface CreateCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    companyToEdit?: any; // Using any for flexibility or match the interface
    existingCompanies?: any[];
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ isOpen, onClose, onSuccess, companyToEdit, existingCompanies }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        description: '',
        contactEmail: '',
        contactPerson: '',
        contactPhone: '',
        safeZone: null as any,
        safeZoneLabel: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (isOpen) {
            if (companyToEdit) {
                setFormData({
                    name: companyToEdit.name || '',
                    address: companyToEdit.address || '',
                    description: companyToEdit.description || '',
                    contactEmail: companyToEdit.contactEmail || '',
                    contactPerson: companyToEdit.contactPerson || '',
                    contactPhone: companyToEdit.contactPhone || '',
                    safeZone: companyToEdit.safeZone || null,
                    safeZoneLabel: companyToEdit.safeZoneLabel || ''
                });
            } else {
                setFormData({
                    name: '',
                    address: '',
                    description: '',
                    contactEmail: '',
                    contactPerson: '',
                    contactPhone: '',
                    safeZone: null,
                    safeZoneLabel: ''
                });
            }
        }
    }, [isOpen, companyToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const url = companyToEdit
                ? `${API_BASE_URL}/company`
                : `${API_BASE_URL}/company`;

            const method = companyToEdit ? 'PATCH' : 'POST';

            const body = companyToEdit
                ? { ...formData, _id: companyToEdit._id }
                : formData;

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
                throw new Error(data.message || `Failed to ${companyToEdit ? 'update' : 'create'} company`);
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
        <Modal isOpen={isOpen} onClose={onClose} title={companyToEdit ? "Edit Company" : "Add New Company"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <Input
                    label="Company Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <Input
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                />

                <Input
                    label="Contact Person"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                />

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Contact Email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        required
                    />
                    <Input
                        label="Contact Number"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Safe Zone (Geofence)</label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <LocationMap
                            initialSafeZone={formData.safeZone}
                            onZoneChange={(zone) => setFormData({ ...formData, safeZone: zone })}
                            zoneLabel={formData.safeZoneLabel || formData.name}
                            existingCompanies={existingCompanies}
                        />
                    </div>
                    <p className="text-xs text-gray-500">Draw a polygon to define the area where students can time-in.</p>
                </div>

                <Input
                    label="Safe Zone Label (Optional)"
                    placeholder="e.g. Main Office, Building A (Defaults to Company Name)"
                    value={formData.safeZoneLabel}
                    onChange={(e) => setFormData({ ...formData, safeZoneLabel: e.target.value })}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        {companyToEdit ? 'Update Company' : 'Add Company'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
