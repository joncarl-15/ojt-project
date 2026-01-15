import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// Fix for default marker icon - wrapped safely
try {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
} catch (e) {
    console.warn("Leaflet icon fix failed", e);
}

// Custom icon for user location
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// ... imports

interface LocationMapProps {
    initialSafeZone?: any;
    onZoneChange?: (zone: any) => void;
    readOnly?: boolean;
    userLocation?: [number, number];
    height?: string;
    className?: string;
    zoneLabel?: string;
    existingCompanies?: any[];
}

// ... GeomanControls ...

const GeomanControls: React.FC<{ onZoneChange?: (zone: any) => void, initialSafeZone: any, readOnly?: boolean, zoneLabel?: string }> = ({ onZoneChange, initialSafeZone, readOnly, zoneLabel }) => {
    const map = useMap();
    const [layer, setLayer] = useState<L.Layer | null>(null);
    const layerRef = React.useRef<L.Layer | null>(null);
    const isInternalUpdate = React.useRef(false);

    // Update label when it changes
    useEffect(() => {
        if (layer && zoneLabel) {
            const l = layer as L.Polygon;
            if (l.bindTooltip) {
                l.unbindTooltip();
                l.bindTooltip(zoneLabel, { permanent: true, direction: 'center', className: 'bg-white px-2 py-1 rounded shadow text-xs font-bold' });
            }
        }
    }, [zoneLabel, layer]);

    // Setup Geoman controls
    useEffect(() => {
        if (!readOnly) {
            // @ts-ignore
            if (map.pm) {
                // @ts-ignore
                map.pm.addControls({
                    position: 'topleft',
                    drawCircle: false,
                    drawCircleMarker: false,
                    drawMarker: false,
                    drawPolyline: false,
                    drawRectangle: true,
                    drawPolygon: true,
                    drawText: false,
                    editMode: true,
                    dragMode: true,
                    cutPolygon: false,
                    removalMode: true
                });

                const handleCreate = (e: any) => {
                    isInternalUpdate.current = true;
                    if (layerRef.current) map.removeLayer(layerRef.current);

                    const shape = e.layer;
                    layerRef.current = shape;
                    setLayer(shape);
                    const geoJson = (shape as any).toGeoJSON();
                    if (onZoneChange) onZoneChange(geoJson.geometry);

                    // Add listeners to the new shape
                    shape.on('pm:edit', (e: any) => {
                        isInternalUpdate.current = true;
                        const updatedGeoJson = (e.layer as any).toGeoJSON();
                        if (onZoneChange) onZoneChange(updatedGeoJson.geometry);
                    });
                    shape.on('pm:dragend', (e: any) => {
                        isInternalUpdate.current = true;
                        const updatedGeoJson = (e.layer as any).toGeoJSON();
                        if (onZoneChange) onZoneChange(updatedGeoJson.geometry);
                    });
                };

                const handleRemove = () => {
                    isInternalUpdate.current = true;
                    layerRef.current = null;
                    setLayer(null);
                    if (onZoneChange) onZoneChange(null);
                };

                map.on('pm:create', handleCreate);
                map.on('pm:remove', handleRemove);

                return () => {
                    map.off('pm:create', handleCreate);
                    map.off('pm:remove', handleRemove);
                    // @ts-ignore
                    if (map.pm) {
                        // @ts-ignore
                        map.pm.removeControls();
                    }
                };
            }
        }
    }, [map, readOnly, onZoneChange]);

    // Handle initialSafeZone changes (External updates)
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }

        // Clear existing layer if any
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
            setLayer(null);
        }

        // Load new initial zone
        if (initialSafeZone) {
            try {
                const geoJsonLayer = L.geoJSON(initialSafeZone, {
                    style: {
                        color: readOnly ? '#10b981' : '#3388ff',
                        fillColor: readOnly ? '#10b981' : '#3388ff',
                        fillOpacity: 0.2
                    }
                });
                const layers = geoJsonLayer.getLayers();
                if (layers.length > 0) {
                    const initLayer = layers[0];
                    initLayer.addTo(map);
                    layerRef.current = initLayer;
                    setLayer(initLayer);

                    // Bind Tooltip if label exists
                    if (zoneLabel) {
                        initLayer.bindTooltip(zoneLabel, {
                            permanent: true,
                            direction: 'center',
                            className: 'font-sans text-xs font-bold bg-white/90 px-2 py-0.5 rounded shadow-sm border border-slate-200 text-slate-700'
                        });
                    }

                    if (!readOnly) {
                        // Make editable
                        // @ts-ignore
                        if ((initLayer as any).pm) (initLayer as any).pm.enable();

                        initLayer.on('pm:edit', (e: any) => {
                            isInternalUpdate.current = true;
                            const updatedGeoJson = (e.layer as any).toGeoJSON();
                            if (onZoneChange) onZoneChange(updatedGeoJson.geometry);
                        });
                        initLayer.on('pm:dragend', (e: any) => {
                            isInternalUpdate.current = true;
                            const updatedGeoJson = (e.layer as any).toGeoJSON();
                            if (onZoneChange) onZoneChange(updatedGeoJson.geometry);
                        });
                    }

                    const bounds = (initLayer as any).getBounds();
                    if (bounds.isValid()) map.fitBounds(bounds);
                }
            } catch (err) {
                console.error("Error loading initial safe zone", err);
            }
        }
    }, [initialSafeZone, map, readOnly, zoneLabel, onZoneChange]); // Added zoneLabel and onZoneChange to deps for completeness

    return null;
};

export const LocationMap: React.FC<LocationMapProps> = ({
    initialSafeZone,
    onZoneChange,
    readOnly,
    userLocation,
    height = '400px',
    className,
    zoneLabel,
    existingCompanies
}) => {
    const [center, setCenter] = useState<[number, number]>([14.5995, 120.9842]); // Manila
    // Capture the initial center for MapContainer initialization only.
    // This ensures MapContainer props remain stable, preventing re-initialization blinking.
    const [initialCenter] = useState<[number, number]>(center);
    const [viewBounds, setViewBounds] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const hasInitialFit = React.useRef(false);

    // Reset initial fit when zone changes (e.g. switching companies)
    useEffect(() => {
        hasInitialFit.current = false;
    }, [initialSafeZone]);

    // Auto-locate on mount if not read-only and no initial zone
    useEffect(() => {
        if (!readOnly && !initialSafeZone && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn("Auto-location failed", error);
                    // Fail silently, user can still search or use button
                }
            );
        }
    }, [readOnly, initialSafeZone]);

    // Update view based on user location and safe zone
    useEffect(() => {
        if (hasInitialFit.current) return;

        if (readOnly && userLocation && initialSafeZone) {
            // Mode: Show Both (Safe Zone + User) - "View together"
            try {
                const layer = L.geoJSON(initialSafeZone);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    // Extend bounds to include user location
                    bounds.extend(userLocation);
                    setViewBounds(bounds);
                    hasInitialFit.current = true;
                } else {
                    setCenter(userLocation);
                    hasInitialFit.current = true;
                }
            } catch (e) {
                console.warn("Failed to calculate combined bounds", e);
                setCenter(userLocation);
                hasInitialFit.current = true;
            }
        } else if (userLocation) {
            // Mode: Follow User only (Fit once)
            setCenter(userLocation);
            hasInitialFit.current = true;
        }
    }, [userLocation, initialSafeZone, readOnly]);

    // Allow updating view when center changes
    const MapController = () => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, map.getZoom() || 13);
        }, [center, map]);

        useEffect(() => {
            if (viewBounds) {
                map.fitBounds(viewBounds);
            }
        }, [viewBounds, map]);
        return null;
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);

        // 1. Try to search in existing companies first
        if (existingCompanies && existingCompanies.length > 0) {
            const lowerQuery = searchQuery.toLowerCase();
            const match = existingCompanies.find(c => c.name?.toLowerCase().includes(lowerQuery));

            if (match && match.safeZone) {
                try {
                    const layer = L.geoJSON(match.safeZone);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        setViewBounds(bounds);
                        setIsSearching(false);
                        return;
                    }
                } catch (e) {
                    console.warn("Failed to parse company safe zone", e);
                }
            }
        }

        // 2. Fallback to OpenStreetMap Nominatim
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, boundingbox } = data[0];
                const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
                setCenter(newCenter);

                if (boundingbox) {
                    // StartLat, EndLat, StartLon, EndLon
                    const bounds = [
                        [boundingbox[0], boundingbox[2]],
                        [boundingbox[1], boundingbox[3]]
                    ];
                    setViewBounds(bounds);
                }
            } else {
                alert('Location not found in maps or existing companies');
            }
        } catch (error) {
            console.error('Search failed', error);
            alert('Failed to search location');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={`space-y-2 flex flex-col ${className || ''}`}>
            {!readOnly && (
                <div className="flex gap-2 shrink-0">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearch();
                            }
                        }}
                        placeholder="Search location (e.g. SM Megamall)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        setCenter([position.coords.latitude, position.coords.longitude]);
                                    },
                                    (error) => {
                                        alert("Error getting location: " + error.message);
                                    }
                                );
                            } else {
                                alert("Geolocation is not supported by this browser.");
                            }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        title="Use My Location"
                    >
                        📍
                    </button>
                </div>
            )}

            <div style={{ height: height, width: '100%', zIndex: 0 }}>
                <MapContainer center={initialCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapController />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <FeatureGroup>
                        <GeomanControls onZoneChange={onZoneChange} initialSafeZone={initialSafeZone} readOnly={readOnly} zoneLabel={zoneLabel} />
                    </FeatureGroup>
                    {userLocation && (
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
            {readOnly && (
                <div className="flex items-center gap-4 text-xs mt-2 shrink-0">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Your Location</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-emerald-500 opacity-50 border border-emerald-600"></div>
                        <span>Safe Zone: <span className="font-bold">{zoneLabel || "Assigned Area"}</span></span>
                    </div>
                </div>
            )}
        </div>
    );
};
