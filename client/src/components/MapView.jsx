import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ProjectPopup from "./ProjectPopup";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  const downloadAllProjectsData = () => {
    if (!geoData || !geoData.features || geoData.features.length === 0) {
      toast.error("No project data available to download.");
      return;
    }

    const dataToDownload = geoData.features.map(
      (feature) => feature.properties
    );

    const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AllProjects");
    XLSX.writeFile(workbook, `all_projects_data.xlsx`);
    toast.success("All project data downloaded successfully!");
  };

  if (!bounds) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer bounds={bounds} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <button
        onClick={downloadAllProjectsData}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          padding: "8px 12px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Download All Projects
      </button>
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
      <ToastContainer position="bottom-right" autoClose={3000} />
    </MapContainer>
  );
}

export default MapView;
