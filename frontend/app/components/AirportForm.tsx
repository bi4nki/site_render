'use client';

import herda de `Circle`, que por sua vez herda de `Path`). Ela define o raio do círculo em pixels { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist.

**Possíveis Causas e Soluções:**

1.  **`radius` é uma Opção dentro/leaflet.css';
import L, { LatLngExpression, MapOptions } from 'leaflet';

// ... (código de `pathOptions`?**
    *   No Leaflet.js puro, `radius` é uma opção direta de de correção do ícone como antes) ...
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg `L.circleMarker(latlng, options)`.
    *   Em `react-leaflet`, algumas opções.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', de "Path" (como `color`, `fillColor`, `fillOpacity`) são agrupadas em `pathOptions`.
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9. É *possível*, embora menos comum para `radius` especificamente em `CircleMarker`, que os tipos esperem4/dist/images/marker-shadow.png',
});

export interface MapMarkerData {
  id: number | string;
  latitude: number;
  longitude: number;
  name: string;
 que ele esteja lá.
    *   **Tentativa A:** Mover `radius` para dentro de `path  type: 'hospital' | 'airport' | 'other';
  details?: string;
}

interfaceOptions`.

2.  **Problema Persistente com os Tipos (`@types/react-leaflet`): InteractiveMapProps {
  markers: MapMarkerData[];
  center: LatLngExpression; 
  zoom: number;
  scrollWheelZoom?: boolean; 
  style?: React.CSSProperties;
}

const**
    *   Se a Tentativa A não funcionar, pode ser outro caso onde os tipos não estão perfeitamente alinh markerColors = {
  hospital: 'blue',
  airport: 'red',
  other: 'greenados com as props reais que o componente `react-leaflet` aceita e passa para o Leaflet.js.',
};

export default function InteractiveMap({
  markers,
  center = [-15.78

---
**Tentativa de Solução A: Mover `radius` para `pathOptions`**
---
No8497, -47.879873] as LatLngExpression,
  zoom = 4,
  scrollWheelZoom = true,
  style = { height: '500px seu `frontend/app/components/InteractiveMap.tsx`, modifique o componente `<CircleMarker>`:

```', width: '100%' }
}: InteractiveMapProps) {
  
  if (typeof window === 'undefined') {
    return null; 
  }

  const mapOptions: MapOptions = {typescript jsx
// ... (imports e código anterior como estavam na última versão funcional para TileLayer) ...

export default function Interactive
    center: center,
    zoom: zoom,
    scrollWheelZoom: scrollWheelZoom,
  Map({
  // ... props ...
}: InteractiveMapProps) {
  
  if (typeof window === 'undefined};

  return (
    <MapContainer {...mapOptions} style={style}>
      <TileLayer
') {
    return null; 
  }

  const mapOptions: MapOptions = {
    // ... map        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"Options ...
  };

  return (
    <MapContainer {...mapOptions} style={style}>
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">Open
      />
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude] as LatLngExpression}
          pathOptionsStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <CircleMarker
          ={{ 
            color: markerColors[marker.type] || 'purple', 
            fillColor: markerColors[marker.type] || 'purple', 
            fillOpacity: 0.7,
            radiuskey={marker.id}
          center={[marker.latitude, marker.longitude] as LatLngExpression}
          // pathOptions agora inclui radius
          pathOptions={{ 
            color: markerColors[marker.type] || 'purple: 8 // <<< MOVIDO PARA DENTRO DE pathOptions
          }}
          // radius={8', 
            fillColor: markerColors[marker.type] || 'purple', 
            fillOpacity:} // <<< REMOVIDO DAQUI
        >
          <Popup>
            <strong>{marker.name} 0.7,
            radius: 8 // <--- MOVIDO PARA DENTRO DE pathOptions
          </strong><br />
            Tipo: {marker.type.charAt(0).toUpperCase() + marker.type.}}
          // radius={8} // <--- REMOVIDO DAQUI
        >
          <Popup>slice(1)} <br />
            Lat: {marker.latitude.toFixed(4)}, Lon: {marker.longitude.toFixed(4)}
            {marker.details && <><br />{marker.details}</>}
            <strong>{marker.name}</strong><br />
            Tipo: {marker.type.charAt(0).toUpperCase() + marker.type.slice(1)} <br />
            Lat: {marker.latitude.toFixed(4
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
)}, Lon: {marker.longitude.toFixed(4)}
            {marker.details && <><br />{marker.details}</>}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer}
