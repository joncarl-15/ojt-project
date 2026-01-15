import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, RefreshCw, User, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { LocationMap } from '../components/LocationMap';
import { formatDistanceToNow } from 'date-fns';

export const LiveTracking: React.FC = () => {
    const { token } = useAuth();
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch Companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/company`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCompanies(data);
                    if (data.length > 0 && !selectedCompany) {
                        setSelectedCompany(data[0]); // Auto-select first company
                    }
                }
            } catch (error) {
                console.error('Failed to fetch companies', error);
            }
        };
        fetchCompanies();
    }, [token]);

    // Fetch Students (Polling)
    const fetchStudents = async () => {
        if (!selectedCompany?._id || !token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/company/${selectedCompany._id}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch live locations", error);
        }
    };

    useEffect(() => {
        if (selectedCompany) {
            setStudents([]); // Clear prev students
            fetchStudents();
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(fetchStudents, 10000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [selectedCompany, token]);

    const activeStudents = students.filter(s => s.latestLocation?.lat);

    const markers = activeStudents.map(s => ({
        position: [s.latestLocation.lat, s.latestLocation.lng] as [number, number],
        popup: (
            <div className="p-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs ring-2 ring-white shadow-sm">
                        {s.avatar ? <img src={s.avatar} className="w-full h-full rounded-full object-cover" /> : (s.firstName?.[0] || 'U')}
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">{s.firstName} {s.lastName}</p>
                        <p className="text-[10px] text-gray-500">{s.program?.toUpperCase()} Student</p>
                    </div>
                </div>
                <div className="border-t pt-1 mt-1">
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Navigation size={10} />
                        {s.latestLocation.timestamp
                            ? `Updated ${formatDistanceToNow(new Date(s.latestLocation.timestamp), { addSuffix: true })}`
                            : "Recently"}
                    </p>
                </div>
            </div>
        )
    }));

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-indigo-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl shadow-sm">
                            <MapIcon className="text-indigo-600" size={24} />
                        </div>
                        Live Tracking
                    </h2>
                    <p className="text-indigo-700/70 mt-1 ml-1 font-medium text-sm">Real-time location monitoring of interns</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">Company:</span>
                    <select
                        className="bg-transparent text-sm font-semibold text-slate-700 py-1.5 focus:outline-none cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-colors min-w-[200px]"
                        value={selectedCompany?._id || ''}
                        onChange={(e) => {
                            const comp = companies.find(c => c._id === e.target.value);
                            setSelectedCompany(comp);
                        }}
                    >
                        {companies.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                {/* Map Area */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                    <LocationMap
                        readOnly={true}
                        initialSafeZone={selectedCompany?.safeZone}
                        zoneLabel={selectedCompany?.safeZoneLabel || selectedCompany?.name}
                        markers={markers}
                        height="100%"
                        className="h-full w-full"
                    />

                    {/* Floating Info */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 z-[400] text-xs space-y-1">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="font-bold text-slate-700">Status</span>
                            <div className="flex items-center gap-1 text-slate-400">
                                <RefreshCw size={10} className={activeStudents.length > 0 ? "animate-spin" : ""} />
                                <span>{lastUpdated.toLocaleTimeString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100"></span>
                            <span className="text-slate-600">Active Students: <span className="font-bold text-slate-800">{activeStudents.length}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 opacity-50"></span>
                            <span className="text-slate-600">Safe Zone: <span className="font-bold text-slate-800">{selectedCompany?.name || 'N/A'}</span></span>
                        </div>
                    </div>
                </div>

                {/* Sidebar List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <User size={16} className="text-indigo-500" />
                            Active Students
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {activeStudents.length > 0 ? activeStudents.map(student => (
                            <motion.div
                                key={student._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                            {student.avatar ? <img src={student.avatar} className="w-full h-full rounded-full object-cover" /> : (student.firstName?.[0] || 'U')}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                            {student.firstName} {student.lastName}
                                        </h4>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                            <Navigation size={10} />
                                            <span>
                                                {student.latestLocation.timestamp
                                                    ? formatDistanceToNow(new Date(student.latestLocation.timestamp), { addSuffix: true })
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                <p>No active students found in this company.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
