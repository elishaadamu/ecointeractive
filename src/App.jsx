import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import MapView from "./components/MapView";
import AdminLogin from "./components/AdminLogin";
import CommentsTable from "./components/CommentsTable";
import ProjectsTable from "./components/ProjectsTable";
import ProjectsTableIndex from "./components/ProjectsTableIndex";
import Header from "./components/Header";
import { MultiSelect } from "react-multi-select-component";
import GeoJSONManager from "./components/GeoJSONManager";
import "./components/FormElements.css";

function App() {
  const [comments, setComments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  ); // New state for admin status
  const navigate = useNavigate(); // For redirection after login
  const [projectTypes, setProjectTypes] = useState([]);
  const [selectedProjectType, setSelectedProjectType] = useState("All");
  const [selectedYearProgrammed, setSelectedYearProgrammed] = useState("All");
  const [selectedFundingSource, setSelectedFundingSource] = useState("All");
  const [selectedProjectTitle, setSelectedProjectTitle] = useState([]);
  const [selectedFundingLayer, setSelectedFundingLayer] = useState("All");
  const [fundingSources, setFundingSources] = useState([]);
  const [projectTitle, setProjectTitle] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [currentGeoDataFilename, setCurrentGeoDataFilename] = useState(null); // New state for active GeoJSON filename
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeProjectLayers, setActiveProjectLayers] = useState([
    "Roadway",
    "Transit",
    "Bike/Ped",
  ]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/comments"
        );
        setComments(response.data);
        console.log("Fetched comments:", response.data);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      }
    };
    fetchComments();

    const fetchActiveGeoJSON = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/geojson/active"
        ); // Fetch active GeoJSON from backend
        setGeoData(response.data.geojsonData);
        setCurrentGeoDataFilename(response.data.filename);

        const data = response.data.geojsonData;
        const types = [
          ...new Set(
            data.features.map((feature) => feature.properties.project_type)
          ),
        ];
        setProjectTypes(["All", ...types]);

        const titles = [
          ...new Set(
            data.features.map((feature) => feature.properties.project_title)
          ),
        ].map((title) => ({ label: title, value: title }));
        setProjectTitle([...titles]);

        const sources = [
          ...new Set(
            data.features.map((feature) => feature.properties.product)
          ),
        ];
        setFundingSources(["All", ...sources.filter(Boolean)]); // filter out null/undefined

        const yearsProgrammed = [
          ...new Set(
            data.features
              .map((feature) => feature.properties.year)
              .filter(Boolean) // Filter out null, undefined, 0, false, ""
              .map(String)
          ),
        ].sort();
        setYears(["All", ...yearsProgrammed]);
      } catch (err) {
        console.error("Failed to fetch active GeoJSON data:", err);
        // Fallback to local projects.geojson if backend fails or no active file is set
        fetch(`${window.location.origin}/projects.geojson`)
          .then((res) => res.json())
          .then((data) => {
            setGeoData(data);
            setCurrentGeoDataFilename('projects.geojson');
            const types = [
              ...new Set(
                data.features.map((feature) => feature.properties.project_type)
              ),
            ];
            setProjectTypes(["All", ...types]);

            const titles = [
              ...new Set(
                data.features.map((feature) => feature.properties.project_title)
              ),
            ].map((title) => ({ label: title, value: title }));
            setProjectTitle([...titles]);

            const sources = [
              ...new Set(
                data.features.map((feature) => feature.properties.product)
              ),
            ];
            setFundingSources(["All", ...sources.filter(Boolean)]);

            const yearsProgrammed = [
              ...new Set(
                data.features
                  .map((feature) => feature.properties.year)
                  .filter(Boolean)
                  .map(String)
              ),
            ].sort();
            setYears(["All", ...yearsProgrammed]);
          })
          .catch((fallbackErr) =>
            console.error("Failed to fetch fallback project data:", fallbackErr)
          );
      }
    };

    fetchActiveGeoJSON();
  }, []);

  const addComment = async (comment) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/api/comments",
        comment
      );
      console.log("Comment added:", response);
      setComments([...comments, response.data]);
      Swal.fire({
        icon: "success",
        title: "Comment Added!",
        text: "Your comment has been successfully submitted.",
        timer: 1500,
        showConfirmButton: false,
      });
      Swal.fire({
        icon: "success",
        title: "Comment Added!",
        text: "Your comment has been successfully submitted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to add comment:", err);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "There was an error submitting your comment. Please try again.",
      });
    }
  };

  const handleProjectTypeChange = (event) => {
    setSelectedProjectType(event.target.value);
  };

  const handleYearProgrammedChange = (event) => {
    setSelectedYearProgrammed(event.target.value);
  };

  const handleProjectTitleChange = (selectedOptions) => {
    setSelectedProjectTitle(selectedOptions);
  };

  const handleFundingSourceChange = (event) => {
    setSelectedFundingSource(event.target.value);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  const [years, setYears] = useState([]);

  const filteredGeoData = geoData
    ? {
        ...geoData,
        features: geoData.features.filter((feature) => {
          const matchesProjectType =
            selectedProjectType === "All" ||
            feature.properties.project_type === selectedProjectType;
          const matchesYearProgrammed =
            selectedYearProgrammed === "All" ||
            String(feature.properties.year) === selectedYearProgrammed;
          const matchesFundingSource =
            selectedFundingSource === "All" ||
            feature.properties.product === selectedFundingSource;
          const matchesFundingLayer =
            selectedFundingLayer === "All" ||
            feature.properties.product === selectedFundingLayer;

          const matchesProjectTitle =
            selectedProjectTitle.length === 0 ||
            selectedProjectTitle.some(
              (selected) =>
                selected.value === "All" ||
                feature.properties.project_title === selected.value
            );

          return (
            matchesProjectType &&
            matchesYearProgrammed &&
            matchesFundingSource &&
            matchesFundingLayer &&
            matchesProjectTitle
          );
        }),
      }
    : null;

  return (
    <div
      className="app-container"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <Header
        isAdmin={isAdmin}
        handleLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <Routes>
        <Route
          path="/login"
          element={<AdminLogin setIsAdmin={setIsAdmin} navigate={navigate} />}
        />
        <Route
          path="/comments"
          element={
            isAdmin ? (
              <CommentsTable comments={comments} setComments={setComments} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projects"
          element={
            isAdmin ? (
              <ProjectsTable geoData={geoData} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/geojson-manager"
          element={
            isAdmin ? (
              <GeoJSONManager
                setGeoData={setGeoData}
                currentGeoDataFilename={currentGeoDataFilename}
                setCurrentGeoDataFilename={setCurrentGeoDataFilename}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            <div
              className="app-content_2"
              style={{ display: "flex", flex: 1, position: "relative" }}
            >
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  display: "none",
                  "@media (max-width: 768px)": {
                    // Apply styles only on mobile
                    display: "block",
                    position: "absolute",
                    top: "10px",
                    left: isSidebarOpen ? "310px" : "10px",
                    zIndex: 1000,
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "8px",
                    cursor: "pointer",
                    transition: "left 0.3s",
                  },
                }}
              >
                {isSidebarOpen ? "✕" : "☰"}
              </button>
              <aside
                className="asidebar"
                style={{
                  padding: "20px", // Keep padding
                  borderRight: "1px solid #e7e7e7",
                  overflowY: "auto",
                  background: "white",
                  "@media (max-width: 768px)": {
                    position: "absolute",
                    left: isSidebarOpen ? "0" : "-100%",
                    top: 0,
                    bottom: 0,
                    width: "300px !important",
                    padding: "15px",
                    zIndex: 999,
                    transition: "left 0.3s ease",
                    boxShadow: isSidebarOpen
                      ? "2px 0 5px rgba(0,0,0,0.1)"
                      : "none",
                  },
                }}
              >
                <div
                  onClick={() => setIsLayersOpen(!isLayersOpen)}
                  style={{
                    display: "none",
                    "@media (max-width: 768px)": {
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    },
                  }}
                >
                  <h3 style={{ margin: 0, marginRight: "10px" }}>
                    Project Layers
                  </h3>
                  <span
                    style={{
                      fontSize: "1.2em",
                      transform: isLayersOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.3s",
                    }}
                  >
                    ▸
                  </span>
                </div>
                <h3
                  style={{
                    margin: "0 0 10px 0",
                    "@media (max-width: 768px)": {
                      display: "none",
                    },
                  }}
                >
                  Funding Sources
                </h3>
                <div
                  style={{
                    marginBottom: "20px",
                    "@media (max-width: 768px)": {
                      maxHeight: isLayersOpen ? "1000px" : "0",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-in-out",
                    },
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                      fontSize: "0.9em",
                    }}
                  >
                    <input
                      type="radio"
                      id="all-funding"
                      name="funding-source"
                      value="All"
                      checked={selectedFundingLayer === "All"}
                      onChange={(e) =>
                        setSelectedFundingLayer(e.target.value)
                      }
                      style={{
                        marginRight: "10px",
                        width: "15px",
                        height: "15px",
                      }}
                    />
                    <label htmlFor="all-funding">All</label>
                  </div>
                  {fundingSources
                    .filter((source) => source !== "All")
                    .map((source) => (
                      <div
                        key={source}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "10px",
                          fontSize: "0.9em",
                        }}
                      >
                        <input
                          type="radio"
                          id={`funding-${source}`}
                          name="funding-source"
                          value={source}
                          checked={selectedFundingLayer === source}
                          onChange={(e) =>
                            setSelectedFundingLayer(e.target.value)
                          }
                          style={{
                            marginRight: "10px",
                            width: "15px",
                            height: "15px",
                          }}
                        />

                        <label htmlFor={`funding-${source}`}>{source}</label>
                      </div>
                    ))}
                </div>

                <div className="section-header">
                  <div
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    style={{
                      display: "none",
                      "@media (max-width: 768px)": {
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "10px",
                      },
                    }}
                  >
                    <h3 style={{ margin: 0, marginRight: "10px" }}>
                      Project Filters
                    </h3>
                    <span
                      style={{
                        fontSize: "1.2em",
                        transform: isFiltersOpen ? "rotate(90deg)" : "none",
                        transition: "transform 0.3s",
                      }}
                    >
                      ▸
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      "@media (max-width: 768px)": {
                        display: "none",
                      },
                    }}
                  >
                    Project Filters
                  </h3>
                </div>
                <div
                  className="filters-container"
                  style={{
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap", // Keep flex wrap
                    "@media (max-width: 768px)": {
                      flexDirection: "column",
                      maxHeight: isFiltersOpen ? "1000px" : "0",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-in-out",
                      display: "flex",
                    },
                  }}
                >
                  <div
                    style={{
                      width: "30%",
                      marginBottom: "10px",
                      "@media (max-width: 768px)": {
                        width: "100%",
                        marginBottom: "15px",
                      },
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                    >
                      Project Type
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                      value={selectedProjectType}
                      onChange={handleProjectTypeChange}
                    >
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      width: "30%",
                      marginBottom: "10px",
                      "@media (max-width: 768px)": {
                        width: "100%",
                        marginBottom: "15px",
                      },
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                    >
                      Project Name
                    </label>
                    <MultiSelect
                      options={projectTitle}
                      value={selectedProjectTitle}
                      onChange={handleProjectTitleChange}
                      labelledBy="Project Name"
                    />
                  </div>
                  <div
                    style={{
                      width: "30%",
                      marginBottom: "10px",

                      "@media (max-width: 768px)": {
                        width: "100%",
                        marginBottom: "15px",
                      },
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                    >
                      Year Programmed
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "8px",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        color: "#555",
                      }}
                      value={selectedYearProgrammed}
                      onChange={handleYearProgrammedChange}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <ProjectsTableIndex
                    geoData={filteredGeoData}
                    selectedProjectType={selectedProjectType}
                    selectedYearProgrammed={selectedYearProgrammed}
                    selectedFundingSource={selectedFundingSource}
                    selectedProjectTitle={selectedProjectTitle}
                  />
                </div>
              </aside>

              <main
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  "@media (max-width: 768px)": {
                    // Apply styles only on mobile
                    marginLeft: isSidebarOpen ? "0px" : 0,
                    zIndex: 0, // Ensure map is rendered under the sidebar
                    width: isSidebarOpen ? "calc(100% - 300px)" : "100%",
                    transition: "margin-left 0.3s ease, width 0.3s ease",
                  },
                }}
              >
                <div style={{ flex: 1 }}>
                  <MapView
                    addComment={addComment}
                    comments={comments}
                    selectedProjectType={selectedProjectType}
                    geoData={filteredGeoData}
                    activeProjectLayers={activeProjectLayers}
                    selectedYearProgrammed={selectedYearProgrammed}
                    selectedFundingSource={selectedFundingSource}
                    selectedProjectTitle={selectedProjectTitle}
                    selectedFundingLayer={selectedFundingLayer}
                    isAdmin={isAdmin} // Pass isAdmin prop
                  />
                </div>
              </main>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
export default App;