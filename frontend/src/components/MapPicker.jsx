import L from 'leaflet'
import { AttributionControl, CircleMarker, LayersControl, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'

// NASA GIBS: MODIS Terra 8-day NDVI (how green the land is), in the rainy season.
// Shown through the duotone filter, so darker = more vegetation.
const NDVI_DATE = '2025-09-14'
const GIBS_NDVI =
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${NDVI_DATE}` +
  '/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png'

function ClickToPick({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lon: e.latlng.lng }) })
  return null
}

// fill: the map is the whole screen (drag and wheel zoom allowed).
export default function MapPicker({ point, onPick, fill = false }) {
  return (
    <div className={`map-duotone ${fill ? 'absolute inset-0' : 'overflow-hidden rounded-3xl'}`}>
      <MapContainer
        center={[point.lat, point.lon]}
        zoom={fill ? 9 : 8}
        className={fill ? 'h-full w-full' : 'h-72 w-full sm:h-96'}
        scrollWheelZoom={fill}
        attributionControl={false}
        dragging={fill || !L.Browser.mobile}
      >
        <AttributionControl prefix="Leaflet" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name={`NASA MODIS vegetation (Sep ${NDVI_DATE.slice(0, 4)})`}>
            <TileLayer
              url={GIBS_NDVI}
              opacity={0.6}
              maxNativeZoom={9}
              attribution='Vegetation: <a href="https://earthdata.nasa.gov/gibs">NASA GIBS</a>'
            />
          </LayersControl.Overlay>
        </LayersControl>
        <ClickToPick onPick={onPick} />
        <CircleMarker
          center={[point.lat, point.lon]}
          radius={11}
          pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#1e7a44', fillOpacity: 1 }}
        />
      </MapContainer>
    </div>
  )
}
