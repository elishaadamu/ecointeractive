import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ProjectPopup from "./ProjectPopup";

function MapView({ addComment, comments }) {
  const [geoData, setGeoData] = useState(null);
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    fetch("/projects.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        if (data && data.features && data.features.length > 0) {
          const allCoords = data.features.map((f) => f.geometry.coordinates);
          const minLat = Math.min(...allCoords.map((c) => c[1]));
          const maxLat = Math.max(...allCoords.map((c) => c[1]));
          const minLng = Math.min(...allCoords.map((c) => c[0]));
          const maxLng = Math.max(...allCoords.map((c) => c[0]));
          setBounds([
            [minLat, minLng],
            [maxLat, maxLng],
          ]);
        }
      });
  }, []);

  if (!bounds) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer bounds={bounds} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {geoData &&
        geoData.features.map((feature, i) => (
          <Marker
            key={i}
            position={[
              feature.geometry.coordinates[1],
              feature.geometry.coordinates[0],
            ]}
          >
            <Tooltip>Project ID: {feature.properties.project_id}</Tooltip>
            <Popup>
              <ProjectPopup
                project={feature.properties}
                addComment={addComment}
                comments={comments}
              />
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

export default MapView;
