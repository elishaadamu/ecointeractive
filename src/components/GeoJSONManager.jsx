import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function GeoJSONManager({ setGeoData, currentGeoDataFilename, setCurrentGeoDataFilename }) {
  const [availableGeoJSONs, setAvailableGeoJSONs] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);

  useEffect(() => {
    const fetchInitialGeoJSONData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/geojson/active');
        setGeoData(response.data.geojsonData);
        setCurrentGeoDataFilename(response.data.filename);
        setSelectedFile(response.data.filename); // Set selected file in dropdown
      } catch (error) {
        console.error('Error fetching initial active GeoJSON data:', error);
        Swal.fire('Error', 'Failed to load initial GeoJSON data.', 'error');
      }
    };

    const fetchAvailableGeoJSONs = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/geojson/list');
        setAvailableGeoJSONs(response.data);
      } catch (error) {
        console.error('Error fetching available GeoJSON files:', error);
        Swal.fire('Error', 'Failed to load available GeoJSON files.', 'error');
      }
    };

    fetchInitialGeoJSONData();
    fetchAvailableGeoJSONs();
  }, [setGeoData, setCurrentGeoDataFilename]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.value);
  };

  const handleSetActiveGeoJSON = async () => {
    if (!selectedFile) {
      Swal.fire('Warning', 'Please select a GeoJSON file.', 'warning');
      return;
    }

    try {
      // Call backend to set the active GeoJSON file
      await axios.post('http://localhost:3001/api/geojson/set-active', { filename: selectedFile }); // Replace with your backend URL

      // Fetch the content of the newly active GeoJSON file and update parent state
      const response = await axios.get('http://localhost:3001/api/geojson/active');
      setGeoData(response.data.geojsonData);
      setCurrentGeoDataFilename(response.data.filename); // Update the filename in parent state

      Swal.fire('Success', `${selectedFile} is now the active GeoJSON file!`, 'success');
    } catch (error) {
      console.error('Error setting active GeoJSON:', error);
      Swal.fire('Error', 'Failed to set active GeoJSON file.', 'error');
    }
  };

  const handleFileChangeForUpload = (event) => {
    setFileToUpload(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!fileToUpload) {
      Swal.fire('Warning', 'Please select a file to upload.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('geojson', fileToUpload);

    try {
      await axios.post('http://localhost:3001/api/geojson/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Swal.fire('Success', `${fileToUpload.name} uploaded successfully!`, 'success');
      setFileToUpload(null); // Clear selected file
      // Optionally, refresh the list of available GeoJSONs
      // fetchAvailableGeoJSONs(); // You might need to move fetchAvailableGeoJSONs out of useEffect or call it directly
    } catch (error) {
      console.error('Error uploading GeoJSON file:', error);
      Swal.fire('Error', 'Failed to upload GeoJSON file.', 'error');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h2>Manage GeoJSON Projects</h2>
      <p>Select a GeoJSON file to make it the active project data for all users.</p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="geojson-select" style={{ display: 'block', marginBottom: '5px' }}>
          Available GeoJSON Files:
        </label>
        <select
          id="geojson-select"
          value={selectedFile}
          onChange={handleFileChange}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1em',
          }}
        >
          <option value="">-- Select a file --</option>
          {availableGeoJSONs.map((filename) => (
            <option key={filename} value={filename}>
              {filename}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSetActiveGeoJSON}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1em',
        }}
      >
        Set as Active GeoJSON
      </button>

      {currentGeoDataFilename && (
        <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
          Currently Active: {currentGeoDataFilename}
        </p>
      )}

      <h2 style={{ marginTop: '40px' }}>Upload New GeoJSON File</h2>
      <p>Select a GeoJSON file from your computer to upload to the server.</p>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".geojson"
          onChange={handleFileChangeForUpload}
          style={{ display: 'block', marginBottom: '10px' }}
        />
        <button
          onClick={handleFileUpload}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1em',
          }}
        >
          Upload GeoJSON
        </button>
      </div>
    </div>
  );
}

export default GeoJSONManager;