'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression, MapOptions } from 'leaflet'; // Importar MapOptions

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

// Definir as props que queremos passar explicitamente para MapContainer
// e as nossas props personalizadas.
interface InteractiveMapProps {
  markers: MapMarkerData[];
  center: LatLngExpression; // Usar LatLngExpression diretamente
  zoom: number;
  scrollWheelZoom?: boolean; // Tornar opcional, com default abaixo
  style?: React.CSSProperties;
  // Outras props específicas do MapContainer que você queira controlar
  // podem ser adicionadas aqui, ex: minZoom, maxZoom, etc.
  // Veja a documentação do react-leaflet para MapOptions/MapContainerProps
}

const markerColors = {
  hospital: 'blue',
  airport: 'red',
  other: 'green',
};

export default function InteractiveMap({
  markers,
  center = [-15.788497, -47.879873] as LatLngExpression, // Default com cast
  zoom = 4,
  scrollWheelZoom = true, // Default explícito
  style = { height: '500px', width: '100%' }
}: InteractiveMapProps) {
  
  if (typeof window === 'undefined') {
    return null; 
  }

  // Construir o objeto de opções para MapContainer
  // Isso ajuda o TypeScript a entender melhor o que está sendo passado.
  const mapOptions: MapOptions = {
    center: center,
    zoom: zoom,
    scrollWheelZoom: scrollWheelZoom,
    // Você pode adicionar outras opções do Leaflet aqui se necessário
    // Ex: preferCanvas: true
  };

  return (
    <MapContainer {...mapOptions} style={style}> {/* Espalhar as mapOptions e passar style separadamente */}
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
