import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Loader2, Pencil, Minus, Users, Map } from 'lucide-react';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { CreateCompanyModal } from '../components/CreateCompanyModal';
import { LiveMapModal } from '../components/LiveMapModal';

interface Company {
    _id: string;
    name: string;
    address: string;
    description: string;
    active?: number;
    total?: number;
    safeZone?: any;
    safeZoneLabel?: string;
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

export const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isLiveMapOpen, setIsLiveMapOpen] = useState(false);
    const [selectedCompanyForLiveMap, setSelectedCompanyForLiveMap] = useState<any>(null);
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
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <div>
                    <h2 className="text-2xl font-extrabold text-amber-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-sm">
                            <Building2 className="text-amber-600" size={24} />
                        </div>
                        Companies
                    </h2>
                    <p className="text-amber-700 mt-1 ml-1 font-medium text-sm">Manage partner companies and internship opportunities</p>
                </div>

                <Button
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-200 border-none flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm font-bold"
                    onClick={() => {
                        setSelectedCompany(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Plus size={20} /> Add Company
                </Button>
            </motion.div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-green-600" size={32} />
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {companies.length > 0 ? companies.map((company) => (
                        <motion.div key={company._id} variants={item}>
                            <Card className="hover:shadow-xl transition-all border-none bg-white/80 backdrop-blur-sm group ring-1 ring-black/5">
                                <CardBody className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-inner">
                                                <Building2 size={28} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-amber-600 transition-colors">{company.name}</h3>
                                                <div className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                                                    {company.address}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 transition-opacity">
                                            <button
                                                className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                                onClick={() => {
                                                    setSelectedCompanyForLiveMap(company);
                                                    setIsLiveMapOpen(true);
                                                }}
                                                title="Live View"
                                            >
                                                <Map size={18} />
                                            </button>
                                            <button
                                                className="text-amber-500 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                                                onClick={() => handleEdit(company)}
                                                title="Edit Company"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                                                onClick={() => handleDelete(company._id)}
                                                title="Delete Company"
                                            >
                                                <Minus size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm mb-6 line-clamp-2 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                                        {company.description}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                        <div className="flex items-center text-slate-500 text-xs font-semibold uppercase tracking-wide">
                                            <Users size={14} className="mr-2 text-amber-500" />
                                            <span>Interns</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">
                                                {company.active || 0} Active
                                            </span>
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                                                {company.total || 0} Total
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    )) : (
                        <div className="col-span-2 text-center text-gray-500 py-8">
                            No companies found
                        </div>
                    )}
                </motion.div>
            )}

            <LiveMapModal
                isOpen={isLiveMapOpen}
                onClose={() => setIsLiveMapOpen(false)}
                company={selectedCompanyForLiveMap}
            />

            <CreateCompanyModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCompany(null);
                }}
                onSuccess={fetchCompanies}
                companyToEdit={selectedCompany}
                existingCompanies={companies}
            />
        </div>
    );
};
