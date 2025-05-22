'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet'; // <--- IMPORTAR LatLngExpression

// ... (código de correção do ícone como antes) ...
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapMarkerData {
  id: number | string;
  latitude: number;
  longitude: number;
  name: string;
  type: 'hospital' | 'airport' | 'other';
  details?: string;
}

interface InteractiveMapProps {
  markers: MapMarkerData[];
  center?: LatLngExpression; // <--- USAR LatLngExpression AQUI
  zoom?: number;
  style?: React.CSSProperties;
}

const markerColors = {
  hospital: 'blue',
  airport: 'red',
  other: 'green',
};

export default function InteractiveMap({
  markers,
  center = [-15.788497, -47.879873] as LatLngExpression, // <--- CAST PARA LatLngExpression NO DEFAULT
  zoom = 4,
  style = { height: '500px', width: '100%' }
}: InteractiveMapProps) {
  
  if (typeof window === 'undefined') {
    return null; 
  }

  // Certifique-se de que 'center' é realmente do tipo LatLngExpression
  // O cast no default value e na prop type deve ser suficiente.

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={style}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude] as LatLngExpression} // <--- CAST AQUI TAMBÉM
          pathOptions={{ color: markerColors[marker.type] || 'purple', fillColor: markerColors[marker.type] || 'purple', fillOpacity: 0.7 }}
          radius={8}
        >
          <Popup>
            <strong>{marker.name}</strong><br />
            Tipo: {marker.type.charAt(0).toUpperCase() + marker.type.slice(1)} <br />
            Lat: {marker.latitude.toFixed(4)}, Lon: {marker.longitude.toFixed(4)}
            {marker.details && <><br />{marker.details}</>}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
