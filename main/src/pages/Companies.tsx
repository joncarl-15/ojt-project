import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, Building2, Users, Minus, Loader2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreateCompanyModal } from '../components/CreateCompanyModal';

interface Company {
    _id: string;
    name: string;
    address: string;
    description: string;
    contactEmail?: string;
    contactPerson?: string;
    contactPhone?: string;
    total?: number;
    active?: number;
}

export const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const { token } = useAuth();

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/company`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setCompanies(data);
            } else {
                setCompanies([]);
            }
        } catch (error) {
            console.error('Failed to fetch companies', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this company?')) return;

        try {
            await fetch(`${API_BASE_URL}/company/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCompanies(companies.filter(c => c._id !== id));
        } catch (error) {
            console.error('Failed to delete company', error);
        }
    };

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <Building2 className="text-green-700" /> Companies
                    </h2>
                    <p className="text-green-600">Manage partner companies and internship opportunities</p>
                </div>

                <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    onClick={() => {
                        setSelectedCompany(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Plus size={20} /> Add Company
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-green-600" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {companies.length > 0 ? companies.map((company) => (
                        <Card key={company._id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                            <CardBody>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{company.name}</h3>
                                            <div className="text-gray-500 text-sm mt-1">
                                                {company.address}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="text-gray-400 hover:text-green-600"
                                            onClick={() => handleEdit(company)}
                                            title="Edit Company"
                                        >
                                            <Pencil size={20} />
                                        </button>
                                        <button
                                            className="text-gray-400 hover:text-red-600"
                                            onClick={() => handleDelete(company._id)}
                                            title="Delete Company"
                                        >
                                            <Minus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                                    {company.description}
                                </p>

                                <div className="flex items-center text-gray-500 text-sm">
                                    <Users size={16} className="mr-2" />
                                    <span>{company.active || 0} active, {company.total || 0} total interns</span>
                                </div>
                            </CardBody>
                        </Card>
                    )) : (
                        <div className="col-span-2 text-center text-gray-500 py-8">
                            No companies found
                        </div>
                    )}
                </div>
            )}

            <CreateCompanyModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCompany(null);
                }}
                onSuccess={fetchCompanies}
                companyToEdit={selectedCompany}
            />
        </div>
    );
};
