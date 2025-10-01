import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import Navbar from './Navbar';
import InfoContainer from './InfoContainer';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);

  return null;
}
function DrawRectangle({ onRegionSelect, isEnabled }) {
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const map = useMap();
  
  useEffect(() => {
    if (isEnabled) {
      map.getContainer().style.cursor = 'crosshair';
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      if (map.tap) map.tap.disable();
    } else {
      map.getContainer().style.cursor = '';
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.tap) map.tap.enable();
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  }, [isEnabled, map]);

  useMapEvents({
    mousedown: (e) => {
      if (!isEnabled) return;
      setStartPoint([e.latlng.lat, e.latlng.lng]);
      setIsDrawing(true);
    },
    mousemove: (e) => {
      if (!isEnabled) return;
      if (isDrawing && startPoint) {
        setCurrentPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
    mouseup: (e) => {
      if (!isEnabled) return;
      if (isDrawing && startPoint) {
        const endPoint = [e.latlng.lat, e.latlng.lng];
        const bounds = [startPoint, endPoint];
        onRegionSelect(bounds);
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    },
  });
  
  if (isDrawing && startPoint && currentPoint && isEnabled) {
    return <Rectangle bounds={[startPoint, currentPoint]} pathOptions={{ color: 'blue', fillOpacity: 0.2 }} />;
  }
  return null;
}

const MapComponent = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionInfo, setRegionInfo] = useState(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const mapRef = useRef(null);
  const defaultCenter = [23.8103, 90.4125];
  const defaultZoom = 13;
  const provider = new OpenStreetMapProvider();

  const handleSearch = async (query) => {
    try {
      const results = await provider.search({ query });
      if (results && results.length > 0) {
        const { x, y, label } = results[0];
        setSearchedLocation({
          center: [y, x],
          zoom: 13,
          label: label
        });
      } else {
        alert('Location not found. Please try another search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search location. Please try again.');
    }
  };
  const handleZoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() + 1);
    }
  };
  const handleZoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() - 1);
    }
  };

  const toggleDrawMode = () => {
    setIsDrawMode(!isDrawMode);
  };

  const handleRegionSelect = (bounds) => {
    setSelectedRegion(bounds);
    const [[lat1, lng1], [lat2, lng2]] = bounds;
    const centerLat = (lat1 + lat2) / 2;
    const centerLng = (lng1 + lng2) / 2;
    const latDiff = Math.abs(lat1 - lat2);
    const lngDiff = Math.abs(lng1 - lng2);
    
    setRegionInfo({
      center: [centerLat, centerLng],
      bounds: bounds,
      latDiff: latDiff.toFixed(6),
      lngDiff: lngDiff.toFixed(6),
    });
    console.log('Selected Region:', {
      bounds,
      center: [centerLat, centerLng],
    });
    setIsDrawMode(false);
  };

  const clearSelection = () => {
    setSelectedRegion(null);
    setRegionInfo(null);
  };

  return (
    <div className="w-full h-screen relative">
      <Navbar
        onSearch={handleSearch}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleDrawMode={toggleDrawMode}
        isDrawMode={isDrawMode}
        onClearSelection={clearSelection}
      />
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {searchedLocation && (
          <MapController 
            center={searchedLocation.center} 
            zoom={searchedLocation.zoom} 
          />
        )}

        <DrawRectangle 
          onRegionSelect={handleRegionSelect} 
          isEnabled={isDrawMode}
        />
        {selectedRegion && (
          <Rectangle 
            bounds={selectedRegion} 
            pathOptions={{ color: 'red', fillOpacity: 0.3, weight: 2 }} 
          />
        )}
        {regionInfo && (
          <Marker position={regionInfo.center}>
            <Popup>
              <div className="text-sm">
                <strong>Selected Region Center</strong><br />
                Lat: {regionInfo.center[0].toFixed(6)}<br />
                Lng: {regionInfo.center[1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
        {searchedLocation && (
          <Marker position={searchedLocation.center}>
            <Popup>
              <div className="text-sm">
                <strong>{searchedLocation.label}</strong>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <InfoContainer regionInfo={regionInfo} onClose={clearSelection} />
    </div>
  );
};

export default MapComponent;
