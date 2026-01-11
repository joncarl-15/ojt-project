import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AssignStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AssignStudentModal: React.FC<AssignStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [students, setStudents] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [coordinators, setCoordinators] = useState<any[]>([]);

    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedCoordinator, setSelectedCoordinator] = useState('');
    const [status, setStatus] = useState('scheduled');

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setIsFetching(true);
        try {
            const [studentsRes, companiesRes, coordinatorsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/user/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ role: 'student' })
                }),
                fetch(`${API_BASE_URL}/company`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/user/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ role: 'coordinator' })
                })
            ]);

            const studentsData = await studentsRes.json();
            const companiesData = await companiesRes.json();
            const coordinatorsData = await coordinatorsRes.json();

            // Filter only unassigned students
            setStudents(Array.isArray(studentsData) ? studentsData.filter((s: any) => !s.metadata?.company) : []);
            setCompanies(Array.isArray(companiesData) ? companiesData : []);
            setCoordinators(Array.isArray(coordinatorsData) ? coordinatorsData : []);

        } catch (err) {
            console.error("Failed to fetch data", err);
            setError("Failed to load data");
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/user/assign-company`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedStudent,
                    companyId: selectedCompany,
                    coordinatorId: selectedCoordinator,
                    status: status,
                    deploymentDate: new Date()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to assign student');
            }

            onSuccess();
            onClose();
            setSelectedStudent('');
            setSelectedCompany('');
            setSelectedCoordinator('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Student to Company">
            {isFetching ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-green-600" size={32} />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                    <div>
                        <Select
                            label="Select Student"
                            value={selectedStudent}
                            onChange={(value) => setSelectedStudent(value)}
                            required
                            placeholder="-- Select Student --"
                            options={students.map(s => ({
                                value: s._id,
                                label: `${s.userName} (${s.email})`
                            }))}
                        />
                        <p className="text-xs text-gray-500 mt-1 ml-1">Only unassigned students are listed.</p>
                    </div>

                    <Select
                        label="Select Company"
                        value={selectedCompany}
                        onChange={(value) => setSelectedCompany(value)}
                        required
                        placeholder="-- Select Company --"
                        options={companies.map(c => ({
                            value: c._id,
                            label: c.name
                        }))}
                    />

                    <Select
                        label="Select Coordinator"
                        value={selectedCoordinator}
                        onChange={(value) => setSelectedCoordinator(value)}
                        required
                        placeholder="-- Select Coordinator --"
                        options={coordinators.map(c => ({
                            value: c._id,
                            label: c.userName
                        }))}
                    />

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
                            Assign Student
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};
