import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
    X,
    ChevronDown,
    ChevronUp,
    Building2,
    Shield,
    Flame,
    Users,
    TrendingUp,
    School,
    Trees,
    Activity,
    AlertCircle,
    Bus,
    Route
} from 'lucide-react';

function InfoContainer({ regionInfo, onClose }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [amenities, setAmenities] = useState({
        hospitals: 0,
        police: 0,
        fireStations: 0,
        schools: 0,
        parks: 0
    });
    const [loading, setLoading] = useState(false);
    const [populationData, setPopulationData] = useState(null);
    const [areaKm2, setAreaKm2] = useState(0);
    const [infraScore, setInfraScore] = useState(0);
    const [transport, setTransport] = useState({
        roadKmTotal: 0,
        roadDensityKmPerKm2: 0,
        transitStops: 0,
    });

    // derive the only value this effect needs
    const bounds = regionInfo?.bounds;

    const calculateArea = () => {
        if (!areaKm2 || isNaN(areaKm2)) return "0.00";
        return areaKm2.toFixed(2);
    };

    const calculateInfraScore = () => {
        if (!infraScore || isNaN(infraScore)) return 0;
        return infraScore;
    };

    useEffect(() => {
        const run = async () => {
            if (!bounds || !Array.isArray(bounds)) return;
            setLoading(true);
            try {
                const res = await invoke('analyze_region', { bounds });
                setAreaKm2(res.area ?? 0);
                setAmenities({
                    hospitals: res.amenities?.hospitals ?? 0,
                    police: res.amenities?.police ?? 0,
                    fireStations: res.amenities?.fireStations ?? 0,
                    schools: res.amenities?.schools ?? 0,
                    parks: res.amenities?.parks ?? 0
                });
                if (res.populationData) {
                    setPopulationData({
                        current: res.populationData.current,
                        growthRate: res.populationData.growthRate,
                        projected5Year: res.populationData.projected5Year,
                        projected10Year: res.populationData.projected10Year
                    });
                } else {
                    setPopulationData(null);
                }
                setInfraScore(res.infraScore ?? 0);
                if (res.transport) {
                    setTransport({
                        roadKmTotal: res.transport.roadKmTotal ?? 0,
                        roadDensityKmPerKm2: res.transport.roadDensityKmPerKm2 ?? 0,
                        transitStops: res.transport.transitStops ?? 0,
                    });
                } else {
                    setTransport({ roadKmTotal: 0, roadDensityKmPerKm2: 0, transitStops: 0 });
                }
            } catch (error) {
                console.error('Error fetching analysis from backend:', error);
                setAmenities({
                    hospitals: 0,
                    police: 0,
                    fireStations: 0,
                    schools: 0,
                    parks: 0
                });
                setPopulationData(null);
                setInfraScore(0);
                setAreaKm2(0);
                setTransport({ roadKmTotal: 0, roadDensityKmPerKm2: 0, transitStops: 0 });
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [bounds]); // depend on the derived value instead of regionInfo

    if (!regionInfo) {
        return null;
    }

    return (
        <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] w-full pointer-events-none"
            style={{
                maxWidth: '1400px',
                paddingLeft: 'clamp(8px, 2vw, 16px)',
                paddingRight: 'clamp(8px, 2vw, 16px)'
            }}
        >
            <div className="pointer-events-auto">
                <div
                    className="bg-white overflow-hidden"
                    style={{
                        borderTopLeftRadius: '28px',
                        borderTopRightRadius: '28px',
                        boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.1), 0 -1px 4px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    <div
                        className="flex items-center justify-between"
                        style={{
                            paddingLeft: 'clamp(16px, 3vw, 24px)',
                            paddingRight: 'clamp(12px, 3vw, 20px)',
                            paddingTop: 'clamp(16px, 3vw, 20px)',
                            paddingBottom: 'clamp(16px, 3vw, 20px)',
                            borderBottom: '1px solid #e5e7eb'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <h3
                                className="font-medium text-gray-900"
                                style={{
                                    fontSize: 'clamp(16px, 3vw, 18px)',
                                    lineHeight: '1.3',
                                    letterSpacing: '-0.01em',
                                    marginBottom: 'clamp(4px, 1vw, 6px)'
                                }}
                            >
                                Urban Planning Analysis
                            </h3>
                            <p
                                className="text-gray-600"
                                style={{
                                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                                    lineHeight: '1.4',
                                    letterSpacing: '0'
                                }}
                            >
                                {regionInfo?.center?.[0]?.toFixed(6) || '0.000000'}°, {regionInfo?.center?.[1]?.toFixed(6) || '0.000000'}° • {calculateArea()} km²
                            </p>
                        </div>
                        <div className="flex items-center" style={{ gap: '4px', marginLeft: '16px' }}>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="hover:bg-gray-100 rounded-full transition-all duration-200"
                                style={{
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="text-gray-700" style={{ width: '20px', height: '20px' }} />
                                ) : (
                                    <ChevronUp className="text-gray-700" style={{ width: '20px', height: '20px' }} />
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="hover:bg-gray-100 rounded-full transition-all duration-200"
                                style={{
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Close"
                            >
                                <X className="text-gray-700" style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>
                    </div>
                    {isExpanded && (
                        <div style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                            {loading ? (
                                <div
                                    className="flex items-center justify-center"
                                    style={{ paddingTop: '64px', paddingBottom: '64px' }}
                                >
                                    <div
                                        className="border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
                                        style={{ width: '40px', height: '40px' }}
                                    ></div>
                                    <p
                                        className="text-gray-600 font-medium"
                                        style={{ marginLeft: '16px', fontSize: '14px' }}
                                    >
                                        Analyzing region data...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl"
                                        style={{
                                            padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)',
                                            marginBottom: 'clamp(16px, 3vw, 24px)',
                                            border: '1px solid #dbeafe'
                                        }}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: 'clamp(12px, 2vw, 0px)' }}>
                                            <div>
                                                <p
                                                    className="font-medium text-gray-700"
                                                    style={{ fontSize: '13px', marginBottom: '4px', letterSpacing: '0.3px' }}
                                                >
                                                    INFRASTRUCTURE READINESS
                                                </p>
                                                <p
                                                    className="text-gray-600"
                                                    style={{ fontSize: '12px', lineHeight: '16px' }}
                                                >
                                                    Based on facility density and urban planning standards
                                                </p>
                                            </div>
                                            <div className="flex items-center" style={{ gap: 'clamp(8px, 2vw, 12px)' }}>
                                                <div
                                                    className={`font-bold ${calculateInfraScore() >= 70 ? 'text-green-600' : calculateInfraScore() >= 40 ? 'text-orange-600' : 'text-red-600'}`}
                                                    style={{ fontSize: 'clamp(28px, 6vw, 36px)', lineHeight: '1', letterSpacing: '-0.02em' }}
                                                >
                                                    {calculateInfraScore()}
                                                </div>
                                                <div
                                                    className="text-gray-500 font-medium"
                                                    style={{ fontSize: 'clamp(14px, 3vw, 16px)', marginTop: 'clamp(4px, 1vw, 8px)' }}
                                                >
                                                    /100
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '28px' }}>
                                        <h4
                                            className="font-medium text-gray-900"
                                            style={{
                                                fontSize: '15px',
                                                marginBottom: '16px',
                                                letterSpacing: '-0.01em'
                                            }}
                                        >
                                            Essential Facilities
                                        </h4>
                                        <div
                                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                                            style={{ gap: 'clamp(8px, 2vw, 12px)' }}
                                        >
                                            <div
                                                className="bg-white rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}
                                            >
                                                <div
                                                    className="flex items-center"
                                                    style={{ marginBottom: '12px', gap: '10px' }}
                                                >
                                                    <div
                                                        className="bg-blue-100 rounded-lg flex items-center justify-center"
                                                        style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                    >
                                                        <Building2 className="text-blue-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span
                                                        className="font-medium text-gray-700"
                                                        style={{ fontSize: '12px', letterSpacing: '0.2px' }}
                                                    >
                                                        Healthcare
                                                    </span>
                                                </div>
                                                <p
                                                    className="font-bold text-gray-900"
                                                    style={{ fontSize: 'clamp(24px, 5vw, 28px)', lineHeight: '1.15', marginBottom: 'clamp(2px, 1vw, 4px)' }}
                                                >
                                                    {amenities.hospitals}
                                                </p>
                                                <p
                                                    className="text-gray-500"
                                                    style={{ fontSize: '11px', lineHeight: '14px' }}
                                                >
                                                    Hospitals & Clinics
                                                </p>
                                            </div>
                                            <div
                                                className="bg-white rounded-xl border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: '16px' }}
                                            >
                                                <div
                                                    className="flex items-center"
                                                    style={{ marginBottom: '12px', gap: '10px' }}
                                                >
                                                    <div
                                                        className="bg-indigo-100 rounded-lg flex items-center justify-center"
                                                        style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                    >
                                                        <Shield className="text-indigo-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span
                                                        className="font-medium text-gray-700"
                                                        style={{ fontSize: '12px', letterSpacing: '0.2px' }}
                                                    >
                                                        Police
                                                    </span>
                                                </div>
                                                <p
                                                    className="font-bold text-gray-900"
                                                    style={{ fontSize: '28px', lineHeight: '32px', marginBottom: '4px' }}
                                                >
                                                    {amenities.police}
                                                </p>
                                                <p
                                                    className="text-gray-500"
                                                    style={{ fontSize: '11px', lineHeight: '14px' }}
                                                >
                                                    Safety Facilities
                                                </p>
                                            </div>
                                            <div
                                                className="bg-white rounded-xl border-2 border-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: '16px' }}
                                            >
                                                <div
                                                    className="flex items-center"
                                                    style={{ marginBottom: '12px', gap: '10px' }}
                                                >
                                                    <div
                                                        className="bg-red-100 rounded-lg flex items-center justify-center"
                                                        style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                    >
                                                        <Flame className="text-red-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span
                                                        className="font-medium text-gray-700"
                                                        style={{ fontSize: '12px', letterSpacing: '0.2px' }}
                                                    >
                                                        Fire
                                                    </span>
                                                </div>
                                                <p
                                                    className="font-bold text-gray-900"
                                                    style={{ fontSize: '28px', lineHeight: '32px', marginBottom: '4px' }}
                                                >
                                                    {amenities.fireStations}
                                                </p>
                                                <p
                                                    className="text-gray-500"
                                                    style={{ fontSize: '11px', lineHeight: '14px' }}
                                                >
                                                    Emergency Services
                                                </p>
                                            </div>
                                            <div
                                                className="bg-white rounded-xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: '16px' }}
                                            >
                                                <div
                                                    className="flex items-center"
                                                    style={{ marginBottom: '12px', gap: '10px' }}
                                                >
                                                    <div
                                                        className="bg-purple-100 rounded-lg flex items-center justify-center"
                                                        style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                    >
                                                        <School className="text-purple-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span
                                                        className="font-medium text-gray-700"
                                                        style={{ fontSize: '12px', letterSpacing: '0.2px' }}
                                                    >
                                                        Education
                                                    </span>
                                                </div>
                                                <p
                                                    className="font-bold text-gray-900"
                                                    style={{ fontSize: '28px', lineHeight: '32px', marginBottom: '4px' }}
                                                >
                                                    {amenities.schools}
                                                </p>
                                                <p
                                                    className="text-gray-500"
                                                    style={{ fontSize: '11px', lineHeight: '14px' }}
                                                >
                                                    Schools
                                                </p>
                                            </div>
                                            <div
                                                className="bg-white rounded-xl border-2 border-green-100 hover:border-green-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: '16px' }}
                                            >
                                                <div
                                                    className="flex items-center"
                                                    style={{ marginBottom: '12px', gap: '10px' }}
                                                >
                                                    <div
                                                        className="bg-green-100 rounded-lg flex items-center justify-center"
                                                        style={{ width: '36px', height: '36px', flexShrink: 0 }}
                                                    >
                                                        <Trees className="text-green-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span
                                                        className="font-medium text-gray-700"
                                                        style={{ fontSize: '12px', letterSpacing: '0.2px' }}
                                                    >
                                                        Parks
                                                    </span>
                                                </div>
                                                <p
                                                    className="font-bold text-gray-900"
                                                    style={{ fontSize: '28px', lineHeight: '32px', marginBottom: '4px' }}
                                                >
                                                    {amenities.parks}
                                                </p>
                                                <p
                                                    className="text-gray-500"
                                                    style={{ fontSize: '11px', lineHeight: '14px' }}
                                                >
                                                    Green Spaces
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {populationData && (
                                        <div style={{ marginBottom: '28px' }}>
                                            <div
                                                className="flex items-center justify-between"
                                                style={{ marginBottom: '12px' }}
                                            >
                                                <h4
                                                    className="font-medium text-gray-900"
                                                    style={{ fontSize: '15px', letterSpacing: '-0.01em' }}
                                                >
                                                    Population Growth Projection
                                                </h4>
                                                <div
                                                    className="bg-blue-50 border border-blue-200 rounded-lg flex items-center"
                                                    style={{ padding: '6px 12px', gap: '6px' }}
                                                >
                                                    <AlertCircle className="text-blue-600" style={{ width: '14px', height: '14px' }} />
                                                    <span
                                                        className="font-medium text-blue-900"
                                                        style={{ fontSize: '11px', letterSpacing: '0.2px' }}
                                                    >
                                                        Area-based Model
                                                    </span>
                                                </div>
                                            </div>
                                            <p
                                                className="text-gray-600"
                                                style={{
                                                    fontSize: '12px',
                                                    lineHeight: '18px',
                                                    marginBottom: '16px'
                                                }}
                                            >
                                                Estimated using <strong>2,500 people/km²</strong> urban density with <strong>2.5% annual growth</strong> (UN methodology)
                                            </p>
                                            <div
                                                className="grid grid-cols-1 md:grid-cols-3"
                                                style={{ gap: 'clamp(10px, 2vw, 12px)' }}
                                            >
                                                <div
                                                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200"
                                                    style={{ padding: 'clamp(16px, 3vw, 20px)' }}
                                                >
                                                    <div
                                                        className="flex items-center"
                                                        style={{ gap: '8px', marginBottom: '12px' }}
                                                    >
                                                        <Users className="text-blue-600" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
                                                        <span
                                                            className="font-semibold text-blue-900"
                                                            style={{ fontSize: '12px', letterSpacing: '0.3px' }}
                                                        >
                                                            CURRENT
                                                        </span>
                                                    </div>
                                                    <p
                                                        className="font-bold text-blue-900"
                                                        style={{ fontSize: 'clamp(26px, 5vw, 32px)', lineHeight: '1.15', marginBottom: 'clamp(4px, 1vw, 6px)' }}
                                                    >
                                                        {populationData.current.toLocaleString()}
                                                    </p>
                                                    <p
                                                        className="text-blue-700"
                                                        style={{ fontSize: '11px', lineHeight: '16px' }}
                                                    >
                                                        Based on {calculateArea()} km² area
                                                    </p>
                                                </div>
                                                <div
                                                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200"
                                                    style={{ padding: 'clamp(16px, 3vw, 20px)' }}
                                                >
                                                    <div
                                                        className="flex items-center"
                                                        style={{ gap: '8px', marginBottom: '12px' }}
                                                    >
                                                        <TrendingUp className="text-purple-600" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
                                                        <span
                                                            className="font-semibold text-purple-900"
                                                            style={{ fontSize: '12px', letterSpacing: '0.3px' }}
                                                        >
                                                            5-YEAR
                                                        </span>
                                                    </div>
                                                    <p
                                                        className="font-bold text-purple-900"
                                                        style={{ fontSize: 'clamp(26px, 5vw, 32px)', lineHeight: '1.15', marginBottom: 'clamp(4px, 1vw, 6px)' }}
                                                    >
                                                        {populationData.projected5Year.toLocaleString()}
                                                    </p>
                                                    <p
                                                        className="text-purple-700"
                                                        style={{ fontSize: '11px', lineHeight: '16px' }}
                                                    >
                                                        +{((populationData.projected5Year - populationData.current) / populationData.current * 100).toFixed(1)}% projected growth
                                                    </p>
                                                </div>
                                                <div
                                                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200"
                                                    style={{ padding: 'clamp(16px, 3vw, 20px)' }}
                                                >
                                                    <div
                                                        className="flex items-center"
                                                        style={{ gap: '8px', marginBottom: '12px' }}
                                                    >
                                                        <Activity className="text-orange-600" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
                                                        <span
                                                            className="font-semibold text-orange-900"
                                                            style={{ fontSize: '12px', letterSpacing: '0.3px' }}
                                                        >
                                                            10-YEAR
                                                        </span>
                                                    </div>
                                                    <p
                                                        className="font-bold text-orange-900"
                                                        style={{ fontSize: 'clamp(26px, 5vw, 32px)', lineHeight: '1.15', marginBottom: 'clamp(4px, 1vw, 6px)' }}
                                                    >
                                                        {populationData.projected10Year.toLocaleString()}
                                                    </p>
                                                    <p
                                                        className="text-orange-700"
                                                        style={{ fontSize: '11px', lineHeight: '16px' }}
                                                    >
                                                        {populationData.growthRate}% annual growth rate
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '4px' }}>
                                        <div
                                            className="flex items-center justify-between"
                                            style={{ marginBottom: '12px' }}
                                        >
                                            <h4
                                                className="font-medium text-gray-900"
                                                style={{ fontSize: '15px', letterSpacing: '-0.01em' }}
                                            >
                                                Transportation Network
                                            </h4>
                                            <div
                                                className="bg-blue-50 border border-blue-200 rounded-lg flex items-center"
                                                style={{ padding: '6px 12px', gap: '6px' }}
                                            >
                                                <AlertCircle className="text-blue-600" style={{ width: '14px', height: '14px' }} />
                                                <span
                                                    className="font-medium text-blue-900"
                                                    style={{ fontSize: '11px', letterSpacing: '0.2px' }}
                                                >
                                                    OSM-derived metrics
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className="grid grid-cols-1 md:grid-cols-3"
                                            style={{ gap: 'clamp(10px, 2vw, 12px)' }}
                                        >
                                            <div
                                                className="bg-white rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}
                                            >
                                                <div className="flex items-center" style={{ marginBottom: '12px', gap: '10px' }}>
                                                    <div className="bg-blue-100 rounded-lg flex items-center justify-center" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                                                        <Route className="text-blue-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span className="font-medium text-gray-700" style={{ fontSize: '12px', letterSpacing: '0.2px' }}>
                                                        Road Length
                                                    </span>
                                                </div>
                                                <p className="font-bold text-gray-900" style={{ fontSize: 'clamp(24px, 5vw, 28px)', lineHeight: '1.15', marginBottom: 'clamp(2px, 1vw, 4px)' }}>
                                                    {transport.roadKmTotal.toFixed(1)} km
                                                </p>
                                                <p className="text-gray-500" style={{ fontSize: '11px', lineHeight: '14px' }}>
                                                    Total within area
                                                </p>
                                            </div>
                                            <div
                                                className="bg-white rounded-xl border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}
                                            >
                                                <div className="flex items-center" style={{ marginBottom: '12px', gap: '10px' }}>
                                                    <div className="bg-indigo-100 rounded-lg flex items-center justify-center" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                                                        <Route className="text-indigo-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span className="font-medium text-gray-700" style={{ fontSize: '12px', letterSpacing: '0.2px' }}>
                                                        Road Density
                                                    </span>
                                                </div>
                                                <p className="font-bold text-gray-900" style={{ fontSize: 'clamp(24px, 5vw, 28px)', lineHeight: '1.15', marginBottom: 'clamp(2px, 1vw, 4px)' }}>
                                                    {transport.roadDensityKmPerKm2.toFixed(2)} km/km²
                                                </p>
                                                <p className="text-gray-500" style={{ fontSize: '11px', lineHeight: '14px' }}>
                                                    Network intensity
                                                </p>
                                            </div>
                                            <div
                                                className="bg-white rounded-xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}
                                            >
                                                <div className="flex items-center" style={{ marginBottom: '12px', gap: '10px' }}>
                                                    <div className="bg-purple-100 rounded-lg flex items-center justify-center" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                                                        <Bus className="text-purple-600" style={{ width: '20px', height: '20px' }} strokeWidth={2.5} />
                                                    </div>
                                                    <span className="font-medium text-gray-700" style={{ fontSize: '12px', letterSpacing: '0.2px' }}>
                                                        Transit Stops
                                                    </span>
                                                </div>
                                                <p className="font-bold text-gray-900" style={{ fontSize: 'clamp(24px, 5vw, 28px)', lineHeight: '1.15', marginBottom: 'clamp(2px, 1vw, 4px)' }}>
                                                    {transport.transitStops}
                                                </p>
                                                <p className="text-gray-500" style={{ fontSize: '11px', lineHeight: '14px' }}>
                                                    Bus & rail access points
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InfoContainer;