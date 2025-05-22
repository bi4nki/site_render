'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, MapContainerProps } from 'react-leaflet'; // Importar MapContainerProps
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression, PointExpression } from 'leaflet'; // LatLngExpression é bom, PointExpression pode ser útil para outros

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

// Usar Partial<MapContainerProps> para props que MapContainer aceita, 
// e adicionar as nossas personalizadas.
interface InteractiveMapProps extends Partial<Omit<MapContainerProps, 'children' | 'style'>> {
  markers: MapMarkerData[];
  initialCenter?: LatLngExpression; // Renomeado para evitar conflito e ser mais explícito
  initialZoom?: number;           // Renomeado
  mapStyle?: React.CSSProperties; // Renomeado para evitar conflito com HTML style
}

const markerColors = {
  hospital: 'blue',
  airport: 'red',
  other: 'green',
};

export default function InteractiveMap({
  markers,
  initialCenter = [-15.788497, -47.879873] as LatLngExpression,
  initialZoom = 4,
  mapStyle = { height: '500px', width: '100%' },
  ...restOfMapContainerProps // Captura outras props válidas de MapContainer
}: InteractiveMapProps) {
  
  if (typeof window === 'undefined') {
    return null; 
  }

  return (
    // Passar as props renomeadas para as props corretas do MapContainer
    <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        scrollWheelZoom={restOfMapContainerProps.scrollWheelZoom ?? true} // Usa o default ou o que foi passado
        style={mapStyle}
        {...restOfMapContainerProps} // Espalha quaisquer outras props válidas
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude] as LatLngExpression}
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
