import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { LocationMap } from './LocationMap';
import { isPointInPolygon } from '../utils/geometry';

interface TimeLoggerProps {
    className?: string;
}

export const TimeLogger: React.FC<TimeLoggerProps> = ({ className }) => {
    const { user, token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [todayRecord, setTodayRecord] = useState<any | null>(null);

    // Geolocation & Map State
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // [Lat, Lng]
    const [companyDetails, setCompanyDetails] = useState<any | null>(null);
    const [isInsideZone, setIsInsideZone] = useState<boolean>(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(true);

    const [retryTrigger, setRetryTrigger] = useState(0);

    const watchIdRef = useRef<number | null>(null);
    const latestLocationRef = useRef<[number, number] | null>(null);
    useEffect(() => { latestLocationRef.current = userLocation; }, [userLocation]);

    // Broadcast location logic
    const broadcastLocation = async (lat: number, lng: number) => {
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/user/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ lat, lng })
            });
        } catch (e) {
            console.warn("Location broadcast failed", e);
        }
    };

    // Interval broadcast
    useEffect(() => {
        const interval = setInterval(() => {
            if (latestLocationRef.current) {
                broadcastLocation(latestLocationRef.current[0], latestLocationRef.current[1]);
            }
        }, 5000); // 5 seconds interval
        return () => clearInterval(interval);
    }, [token]);

    // Immediate broadcast on first valid location
    const [hasInitialBroadcast, setHasInitialBroadcast] = useState(false);
    useEffect(() => {
        if (userLocation && !hasInitialBroadcast) {
            broadcastLocation(userLocation[0], userLocation[1]);
            setHasInitialBroadcast(true);
        }
    }, [userLocation, hasInitialBroadcast, token]);

    useEffect(() => {
        fetchTodayRecord();
        fetchCompanyDetails();

        // Start watching location
        // We use watchPosition to get continuous updates (high accuracy)
        if (navigator.geolocation) {
            // Clear existing watch if any (cleanup handles this too but safe to be explicit before new watch)
            if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLocation: [number, number] = [latitude, longitude];
                    setUserLocation(newLocation);
                    setIsFetchingLocation(false);
                    setLocationError(null);
                },
                (error) => {
                    console.error("Location watch error", error);
                    let msg = "Location error.";
                    if (error.code === 1) msg = "Location access denied. Please enable GPS.";
                    else if (error.code === 2) msg = "Location unavailable. Check GPS signal.";
                    else if (error.code === 3) msg = "Location request timed out. Retrying...";

                    setLocationError(msg);
                    setIsFetchingLocation(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 1000
                }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser");
            setIsFetchingLocation(false);
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [token, retryTrigger]); // Re-run on retryTrigger

    // ...

    const handleRetryLocation = () => {
        setIsFetchingLocation(true);
        setLocationError(null);
        setRetryTrigger(prev => prev + 1);
    };

    // ... inside render:

    {
        locationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{locationError}</span>
                </div>
                <Button
                    onClick={handleRetryLocation}
                    className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 h-auto text-xs font-semibold shadow-sm"
                    variant="ghost"
                >
                    Enable / Retry GPS
                </Button>
            </div>
        )
    }

    // Check if inside zone whenever location or zone changes
    useEffect(() => {
        if (userLocation && companyDetails?.safeZone?.coordinates) {
            // GeoJSON is [Lng, Lat], userLocation is [Lat, Lng]
            const point: [number, number] = [userLocation[1], userLocation[0]];
            const isInside = isPointInPolygon(point, companyDetails.safeZone.coordinates);
            setIsInsideZone(isInside);
        } else if (userLocation && !companyDetails?.safeZone) {
            // ... (unchanged logic)
            setIsInsideZone(true);
        }
    }, [userLocation, companyDetails]);


    const fetchCompanyDetails = async () => {
        // If user has company ID, fetch details to get safeZone
        const companyId = user?.metadata?.company;
        const idToFetch = typeof companyId === 'object' ? (companyId as any)._id : companyId;

        if (idToFetch) {
            try {
                const response = await fetch(`${API_BASE_URL}/company/${idToFetch}`);
                if (response.ok) {
                    const data = await response.json();
                    setCompanyDetails(data);
                }
            } catch (error) {
                console.error("Failed to fetch company details", error);
            }
        }
    };

    const fetchTodayRecord = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/dtr/my-records`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const today = new Date().toDateString();
                const record = data.find((r: any) => new Date(r.date).toDateString() === today);
                setTodayRecord(record);
            }
        } catch (error) {
            console.error("Failed to fetch records", error);
        }
    };

    const handleTimeIn = async () => {
        setIsLoading(true);
        setLocationError(null);
        setStatus(null);

        try {
            if (!userLocation) {
                throw new Error("Waiting for location...");
            }

            // Client-side check (double check)
            if (companyDetails?.safeZone && !isInsideZone) {
                throw new Error("You are outside the designated Safe Zone. Please move closer to your company.");
            }

            const coordinates = [userLocation[1], userLocation[0]]; // [Lng, Lat]

            const response = await fetch(`${API_BASE_URL}/dtr/time-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ coordinates })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setTodayRecord(data.dtr);
            } else {
                setLocationError(data.message || "Failed to Time In");
            }

        } catch (error: any) {
            setLocationError(error.message || "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeOut = async () => {
        setIsLoading(true);
        setLocationError(null);
        setStatus(null);

        try {
            // For time out, we might relax the zone check, request says "time in tab... show map"
            // Usually you can time out anywhere or same restriction.
            // dtrController doesn't strictly enforce safe zone on time out yet, but records location.
            // We'll just send current location.
            let coordinates = null;
            if (userLocation) {
                coordinates = [userLocation[1], userLocation[0]];
            }

            const response = await fetch(`${API_BASE_URL}/dtr/time-out`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ coordinates })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('out-success');
                setTodayRecord(data.dtr);
            } else {
                setLocationError(data.message || "Failed to Time Out");
            }
        } catch (error: any) {
            setLocationError(error.message || "An error occurred during Time Out.");
        } finally {
            setIsLoading(false);
        }
    };

    const companyName = companyDetails?.name || "Assigned Company";

    return (
        <div className={`bg-white rounded-2xl shadow-lg border border-slate-100 p-6 ${className}`}>
            {/* ... header unchanged ... */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-teal-600" size={20} />
                        Attendance
                    </h3>
                    <p className="text-sm text-slate-500">Log your daily attendance</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800 font-mono">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {locationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{locationError}</span>
                    </div>
                    <Button
                        onClick={handleRetryLocation}
                        className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 h-auto text-xs font-semibold shadow-sm w-full sm:w-auto"
                        variant="ghost"
                    >
                        Enable / Retry GPS
                    </Button>
                </div>
            )}

            {status === 'success' && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>Time In successful! Have a great day.</span>
                </div>
            )}

            {/* Map Visualization */}
            {companyDetails?.safeZone && (
                <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden relative">
                    <LocationMap
                        initialSafeZone={companyDetails.safeZone}
                        readOnly={true}
                        userLocation={userLocation || undefined}
                        height="16rem"
                        zoneLabel={companyDetails.safeZoneLabel || companyDetails.name || "Safe Zone"}
                    />

                    {/* Status overlay */}
                    <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-semibold flex items-center gap-2">
                        {isFetchingLocation ? (
                            <>
                                <RefreshCw size={12} className="animate-spin text-slate-500" />
                                <span className="text-slate-600">Locating...</span>
                            </>
                        ) : isInsideZone ? (
                            <>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-emerald-700">Inside Zone</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-700">Outside Zone</span>
                            </>
                        )}
                    </div>
                </div>
            )}


            <div className="flex flex-col gap-3">
                {!todayRecord ? (
                    <Button
                        onClick={handleTimeIn}
                        isLoading={isLoading}
                        disabled={isLoading || (!!companyDetails?.safeZone && !isInsideZone) || !userLocation}
                        className={`w-full shadow-lg py-3 text-lg font-bold transition-all
                            ${(isLoading || (!!companyDetails?.safeZone && !isInsideZone) || !userLocation)
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-teal-200'
                            }`}
                    >
                        <MapPin size={20} className="mr-2" />
                        {companyDetails?.safeZone && !isInsideZone && userLocation ? "Get Closer to Time In" : "TIME IN"}
                    </Button>
                ) : !todayRecord.timeOut ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-center">
                            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider">Timed In At</p>
                            <p className="text-xl font-bold text-teal-800 font-mono">
                                {new Date(todayRecord.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <Button
                            onClick={handleTimeOut}
                            isLoading={isLoading}
                            variant="secondary"
                            className="w-full border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                        >
                            TIME OUT
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                        <div className="flex justify-center gap-8">
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase">In</p>
                                <p className="text-lg font-bold text-slate-700 font-mono">
                                    {new Date(todayRecord.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="w-px bg-slate-200"></div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase">Out</p>
                                <p className="text-lg font-bold text-slate-700 font-mono">
                                    {new Date(todayRecord.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-sm font-medium text-emerald-600 flex items-center justify-center gap-1">
                                <CheckCircle2 size={16} />
                                Duty Completed
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-xs text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                    <MapPin size={12} />
                    Target Location: <span className="font-medium">{companyName}</span>
                </p>
            </div>
        </div>
    );
};
