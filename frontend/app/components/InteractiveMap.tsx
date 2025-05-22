'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Importar L para ícones personalizados se necessário

// Corrigir problema com ícone padrão do Leaflet no Next.js/Webpack
// (Você pode precisar ajustar os caminhos se seus assets estiverem em outro lugar ou usar um CDN)
// Esta é uma correção comum, mas pode precisar de ajustes dependendo da sua configuração de assets
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
  name: string; // Nome para aparecer no Popup
  type: 'hospital' | 'airport' | 'other'; // Para diferenciar marcadores
  details?: string; // Detalhes adicionais para o Popup
}

interface InteractiveMapProps {
  markers: MapMarkerData[];
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  style?: React.CSSProperties;
}

// Cores para diferentes tipos de marcadores
const markerColors = {
  hospital: 'blue',
  airport: 'red',
  other: 'green',
};

export default function InteractiveMap({
  markers,
  center = [-15.788497, -47.879873], // Ponto central do Brasil (aproximado)
  zoom = 4, // Zoom para ver o Brasil
  style = { height: '500px', width: '100%' }
}: InteractiveMapProps) {
  // Garantir que o componente só renderize no cliente
  if (typeof window === 'undefined') {
    return null; 
  }

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={style}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        // Usar CircleMarker para poder colorir facilmente
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          pathOptions={{ color: markerColors[marker.type] || 'purple', fillColor: markerColors[marker.type] || 'purple', fillOpacity: 0.7 }}
          radius={8} // Tamanho do círculo
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
