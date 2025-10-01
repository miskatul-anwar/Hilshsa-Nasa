import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, MapPin, Building2, Shield, Flame, Users, TrendingUp, School, Trees, Activity, AlertCircle } from 'lucide-react';

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
    //area in km²
    const calculateArea = () => {
        if (!regionInfo || !regionInfo.latDiff || !regionInfo.lngDiff) return "0.00";
        const latDiff = parseFloat(regionInfo.latDiff);
        const lngDiff = parseFloat(regionInfo.lngDiff);
        //calculation (1 degree ≈ 111 km)
        const area = (latDiff * 111) * (lngDiff * 111);
        return area.toFixed(2);
    };
    //OpenStreetMap Overpass API
    useEffect(() => {
        if (!regionInfo || !regionInfo.bounds || !Array.isArray(regionInfo.bounds)) return;
        const fetchAmenities = async () => {
            setLoading(true);
            try {
                const [[lat1, lng1], [lat2, lng2]] = regionInfo.bounds;
                const bbox = `${Math.min(lat1, lat2)},${Math.min(lng1, lng2)},${Math.max(lat1, lat2)},${Math.max(lng1, lng2)}`;
                console.log('Fetching amenities for bbox:', bbox);
                const query = `
                    [out:json][timeout:25];
                    (
                        node["amenity"~"hospital|clinic|doctors|pharmacy"](${bbox});
                        way["amenity"~"hospital|clinic|doctors|pharmacy"](${bbox});
                        relation["amenity"~"hospital|clinic|doctors|pharmacy"](${bbox});
                        
                        node["amenity"="police"](${bbox});
                        way["amenity"="police"](${bbox});
                        
                        node["amenity"="fire_station"](${bbox});
                        way["amenity"="fire_station"](${bbox});
                        
                        node["amenity"="school"](${bbox});
                        way["amenity"="school"](${bbox});
                        relation["amenity"="school"](${bbox});
                        
                        node["leisure"="park"](${bbox});
                        way["leisure"="park"](${bbox});
                        relation["leisure"="park"](${bbox});
                    );
                    out body;
                `;
                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: query
                });
                if (!response.ok) throw new Error('Failed to fetch amenities');
                const data = await response.json();
                console.log('Overpass API response:', data);
                const counts = {
                    hospitals: 0,
                    police: 0,
                    fireStations: 0,
                    schools: 0,
                    parks: 0
                };

                if (data.elements && Array.isArray(data.elements)) {
                    data.elements.forEach(element => {
                        if (element.tags) {
                            const amenity = element.tags.amenity;
                            const leisure = element.tags.leisure;
                            if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors' || amenity === 'pharmacy') {
                                counts.hospitals++;
                            }
                            if (amenity === 'police') counts.police++;
                            if (amenity === 'fire_station') counts.fireStations++;
                            if (amenity === 'school') counts.schools++;
                            if (leisure === 'park') counts.parks++;
                        }
                    });
                }

                console.log('Amenity counts:', counts);
                setAmenities(counts);
                const area = parseFloat(calculateArea());
                if (!isNaN(area) && area > 0) {
                    const estimatedPopulation = Math.round(area * 2500);
                    const growthRate = 2.5; //urban growth rate %
                    
                    setPopulationData({
                        current: estimatedPopulation,
                        growthRate: growthRate,
                        projected5Year: Math.round(estimatedPopulation * Math.pow(1 + growthRate/100, 5)),
                        projected10Year: Math.round(estimatedPopulation * Math.pow(1 + growthRate/100, 10))
                    });
                }

            } catch (error) {
                console.error('Error fetching amenities:', error);
                setAmenities({
                    hospitals: 0,
                    police: 0,
                    fireStations: 0,
                    schools: 0,
                    parks: 0
                });
                setPopulationData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchAmenities();
    }, [regionInfo?.bounds]);
    if (!regionInfo) {
        return null;
    }
    const calculateInfraScore = () => {
        const area = parseFloat(calculateArea());
        if (!area || area === 0 || isNaN(area)) return 0;
        const idealHospitals = 2;
        const idealPolice = 1;
        const idealFire = 1;
        const idealSchools = 5;
        const normalized = area / 10;
        const hospitalScore = Math.min((amenities.hospitals / (idealHospitals * normalized)) * 100, 100);
        const policeScore = Math.min((amenities.police / (idealPolice * normalized)) * 100, 100);
        const fireScore = Math.min((amenities.fireStations / (idealFire * normalized)) * 100, 100);
        const schoolScore = Math.min((amenities.schools / (idealSchools * normalized)) * 100, 100);
        const avgScore = (hospitalScore + policeScore + fireScore + schoolScore) / 4;
        return avgScore.toFixed(0);
    };

    return (
        <div 
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9999] w-full pointer-events-none" 
            style={{ 
                maxWidth: '1400px',
                paddingLeft: '16px', 
                paddingRight: '16px'
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
                            paddingLeft: '24px', 
                            paddingRight: '20px', 
                            paddingTop: '20px', 
                            paddingBottom: '20px',
                            borderBottom: '1px solid #e5e7eb'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <h3 
                                className="font-medium text-gray-900" 
                                style={{ 
                                    fontSize: '18px',
                                    lineHeight: '24px',
                                    letterSpacing: '-0.01em',
                                    marginBottom: '6px'
                                }}
                            >
                                Urban Planning Analysis
                            </h3>
                            <p 
                                className="text-gray-600" 
                                style={{ 
                                    fontSize: '13px',
                                    lineHeight: '18px',
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
                        <div style={{ padding: '24px' }}>
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
                                            padding: '20px 24px',
                                            marginBottom: '24px',
                                            border: '1px solid #dbeafe'
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
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
                                            <div className="flex items-center" style={{ gap: '12px' }}>
                                                <div 
                                                    className={`font-bold ${calculateInfraScore() >= 70 ? 'text-green-600' : calculateInfraScore() >= 40 ? 'text-orange-600' : 'text-red-600'}`}
                                                    style={{ fontSize: '36px', lineHeight: '36px', letterSpacing: '-0.02em' }}
                                                >
                                                    {calculateInfraScore()}
                                                </div>
                                                <div 
                                                    className="text-gray-500 font-medium" 
                                                    style={{ fontSize: '16px', marginTop: '8px' }}
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
                                            className="grid grid-cols-2 sm:grid-cols-5" 
                                            style={{ gap: '12px' }}
                                        >
                                            <div 
                                                className="bg-white rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                                                style={{ padding: '16px' }}
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
                                                    style={{ fontSize: '28px', lineHeight: '32px', marginBottom: '4px' }}
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
                                                className="grid grid-cols-1 sm:grid-cols-3" 
                                                style={{ gap: '12px' }}
                                            >
                                                <div 
                                                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200"
                                                    style={{ padding: '20px' }}
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
                                                        style={{ fontSize: '32px', lineHeight: '36px', marginBottom: '6px' }}
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
                                                    style={{ padding: '20px' }}
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
                                                        style={{ fontSize: '32px', lineHeight: '36px', marginBottom: '6px' }}
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
                                                    style={{ padding: '20px' }}
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
                                                        style={{ fontSize: '32px', lineHeight: '36px', marginBottom: '6px' }}
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