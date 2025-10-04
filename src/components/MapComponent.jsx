import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Rectangle, Circle as LeafletCircle, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import Navbar from './Navbar';
import InfoContainer from './InfoContainer';
import ToastContainer from './ToastContainer';
import { useToast } from '../hooks/useToast';

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
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapEventHandler({ onZoomChange, onMapReady }) {
  const map = useMap();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (onMapReady && isInitialMount.current) {
      onMapReady(map);
      isInitialMount.current = false;
    }
  }, [map, onMapReady]);

  useMapEvents({
    zoomend: () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    },
  });

  return null;
}

function DrawShape({ onRegionSelect, isEnabled, selectionMode }) {
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
  }, [isEnabled, selectionMode, map]);

  useMapEvents({
    mousedown: (e) => {
      if (!isEnabled) return;
      setStartPoint([e.latlng.lat, e.latlng.lng]);
      setIsDrawing(true);
    },
    mousemove: (e) => {
      if (!isEnabled || !isDrawing || !startPoint) return;
      setCurrentPoint([e.latlng.lat, e.latlng.lng]);
    },
    mouseup: (e) => {
      if (!isEnabled || !isDrawing || !startPoint) return;

      const endPoint = [e.latlng.lat, e.latlng.lng];

      if (selectionMode === 'rectangle') {
        const bounds = [startPoint, endPoint];
        onRegionSelect(bounds, 'rectangle');
      } else if (selectionMode === 'circle') {
        const centerLat = (startPoint[0] + endPoint[0]) / 2;
        const centerLng = (startPoint[1] + endPoint[1]) / 2;
        const radius = map.distance(startPoint, endPoint) / 2;
        onRegionSelect({ center: [centerLat, centerLng], radius }, 'circle');
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  });

  if (!isEnabled) return null;

  if (selectionMode === 'rectangle' && isDrawing && startPoint && currentPoint) {
    return <Rectangle bounds={[startPoint, currentPoint]} pathOptions={{ color: 'blue', fillOpacity: 0.2 }} />;
  }

  if (selectionMode === 'circle' && isDrawing && startPoint && currentPoint) {
    const centerLat = (startPoint[0] + currentPoint[0]) / 2;
    const centerLng = (startPoint[1] + currentPoint[1]) / 2;
    const radius = map.distance(startPoint, currentPoint) / 2;
    return <LeafletCircle center={[centerLat, centerLng]} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.2 }} />;
  }

  return null;
}

const MapComponent = () => {
  const [leafletMap, setLeafletMap] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedRegionType, setSelectedRegionType] = useState(null);
  const [regionInfo, setRegionInfo] = useState(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState('rectangle');
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { toasts, removeToast, showSuccess, showError, showWarning, showLoading, showOnline, showOffline } = useToast();

  // Refs to prevent duplicate toasts
  const hasShownOffline = useRef(false);
  const hasShownMapLoaded = useRef(false);

  const defaultCenter = [23.8103, 90.4125];
  const defaultZoom = 13;
  const minZoom = 3;
  const maxZoom = 18;
  const provider = new OpenStreetMapProvider();

  // Monitor online/offline status - only show once per state change
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      hasShownOffline.current = false;
      showOnline('Connection restored', 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (!hasShownOffline.current) {
        showOffline('No internet connection', 5000);
        hasShownOffline.current = true;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status only once
    if (!navigator.onLine && !hasShownOffline.current) {
      showOffline('No internet connection', 5000);
      hasShownOffline.current = true;
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array - only run once on mount

  const handleSearch = async (query) => {
    if (!isOnline) {
      showError('Cannot search while offline', 3000);
      return;
    }

    const loadingId = showLoading('Searching location...');

    try {
      const results = await provider.search({ query });
      removeToast(loadingId);

      if (results && results.length > 0) {
        const { x, y, label } = results[0];
        setSearchedLocation({
          center: [y, x],
          zoom: 13,
          label
        });
        showSuccess(`Found: ${label}`, 3000);
      } else {
        showWarning('Location not found. Try a different search term.', 3000);
      }
    } catch (e) {
      console.error(e);
      removeToast(loadingId);
      showError('Failed to search location. Please try again.', 3000);
    }
  };

  const handleZoomIn = () => {
    if (leafletMap && currentZoom < maxZoom) {
      leafletMap.zoomIn();
    } else if (currentZoom >= maxZoom) {
      showWarning('Maximum zoom level reached', 2000);
    }
  };

  const handleZoomOut = () => {
    if (leafletMap && currentZoom > minZoom) {
      leafletMap.zoomOut();
    } else if (currentZoom <= minZoom) {
      showWarning('Minimum zoom level reached', 2000);
    }
  };

  const toggleDrawMode = () => {
    setIsDrawMode(v => {
      const newValue = !v;
      if (newValue) {
        showSuccess(`${selectionMode === 'rectangle' ? 'Rectangle' : 'Circle'} selection mode activated`, 2000);
      }
      return newValue;
    });
  };

  const handleRegionSelect = (data, type) => {
    setSelectedRegion(data);
    setSelectedRegionType(type);

    let bounds, centerLat, centerLng;

    if (type === 'rectangle') {
      bounds = data;
      const [[lat1, lng1], [lat2, lng2]] = data;
      centerLat = (lat1 + lat2) / 2;
      centerLng = (lng1 + lng2) / 2;
    } else if (type === 'circle') {
      const { center, radius } = data;
      centerLat = center[0];
      centerLng = center[1];

      const radiusInDegrees = radius / 111320;
      bounds = [
        [center[0] - radiusInDegrees, center[1] - radiusInDegrees],
        [center[0] + radiusInDegrees, center[1] + radiusInDegrees]
      ];
    }

    setRegionInfo({
      center: [centerLat, centerLng],
      bounds,
      type
    });
    setIsDrawMode(false);
    showSuccess('Region selected successfully', 2000);
  };

  const clearSelection = () => {
    setSelectedRegion(null);
    setSelectedRegionType(null);
    setRegionInfo(null);
    showSuccess('Selection cleared', 2000);
  };

  const handleMapReady = (map) => {
    setLeafletMap(map);
    setCurrentZoom(map.getZoom());

    // Only show map loaded toast once
    if (!hasShownMapLoaded.current) {
      showSuccess('Map loaded successfully', 2000);
      hasShownMapLoaded.current = true;
    }
  };

  const handleZoomChange = (zoom) => {
    setCurrentZoom(zoom);
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Navbar
        onSearch={handleSearch}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleDrawMode={toggleDrawMode}
        isDrawMode={isDrawMode}
        onClearSelection={clearSelection}
        currentZoom={currentZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        selectionMode={selectionMode}
        onSelectionModeChange={setSelectionMode}
        isOnline={isOnline}
      />

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler
          onZoomChange={handleZoomChange}
          onMapReady={handleMapReady}
        />

        {searchedLocation && (
          <MapController
            center={searchedLocation.center}
            zoom={searchedLocation.zoom}
          />
        )}

        <DrawShape
          onRegionSelect={handleRegionSelect}
          isEnabled={isDrawMode}
          selectionMode={selectionMode}
        />

        {selectedRegion && selectedRegionType === 'rectangle' && (
          <Rectangle
            bounds={selectedRegion}
            pathOptions={{ color: 'red', fillOpacity: 0.3, weight: 2 }}
          />
        )}

        {selectedRegion && selectedRegionType === 'circle' && (
          <LeafletCircle
            center={selectedRegion.center}
            radius={selectedRegion.radius}
            pathOptions={{ color: 'red', fillOpacity: 0.3, weight: 2 }}
          />
        )}

        {regionInfo && (
          <Marker position={regionInfo.center}>
            <Popup>
              <div className="text-sm">
                <strong>Selected Region Center</strong><br />
                Lat: {regionInfo.center[0].toFixed(6)}<br />
                Lng: {regionInfo.center[1].toFixed(6)}<br />
                Type: {regionInfo.type}
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

      <InfoContainer
        regionInfo={regionInfo}
        onClose={clearSelection}
      />
    </div>
  );
};

export default MapComponent;