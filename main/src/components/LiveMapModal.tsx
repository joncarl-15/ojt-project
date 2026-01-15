import React, { useEffect, useState, useRef } from 'react';
import { Modal } from './Modal';
import { LocationMap } from './LocationMap';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: any;
}

export const LiveMapModal: React.FC<LiveMapModalProps> = ({ isOpen, onClose, company }) => {
    const { token } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStudents = async () => {
        if (!company?._id || !token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/company/${company._id}/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        if (isOpen) {
            fetchStudents();
            intervalRef.current = setInterval(fetchStudents, 10000); // Poll every 10 seconds
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isOpen, company, token]);

    const markers = students
        .filter(s => s.latestLocation && s.latestLocation.lat && s.latestLocation.lng)
        .map(s => ({
            position: [s.latestLocation.lat, s.latestLocation.lng] as [number, number],
            popup: (
                <div className="p-1">
                    <p className="font-bold text-sm">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">
                        {s.latestLocation.timestamp
                            ? `Active ${formatDistanceToNow(new Date(s.latestLocation.timestamp), { addSuffix: true })}`
                            : "Recently"}
                    </p>
                </div>
            )
        }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Live View: ${company?.name || 'Company'}`}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <p>Showing real-time locations of assigned students.</p>
                    <div className="flex items-center gap-2">
                        <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
                        <Button size="sm" variant="ghost" onClick={fetchStudents} className="h-6 w-6 p-0">
                            <RefreshCw size={14} />
                        </Button>
                    </div>
                </div>

                <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-200">
                    <LocationMap
                        readOnly={true}
                        initialSafeZone={company?.safeZone}
                        zoneLabel={company?.safeZoneLabel || company?.name}
                        markers={markers}
                        height="100%"
                    />
                </div>

                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};
