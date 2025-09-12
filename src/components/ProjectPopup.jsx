import React, { useState } from "react";
import CommentForm from "./CommentForm";
import * as XLSX from "xlsx";

function ProjectPopup({ project, addComment, comments }) {
  const [showForm, setShowForm] = useState(false);

  const downloadProjectData = () => {
    const projectComments = comments.filter(
      (c) => c.projectId === project.project_id
    );

    if (projectComments.length === 0) {
      alert("No comments for this project to download.");
      return;
    }

    const dataToDownload = projectComments.map((comment) => ({
      ...project,
      comment_name: comment.name,
      comment_text: comment.comment,
      comment_timestamp: comment.timestamp,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToDownload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ProjectData");
    XLSX.writeFile(workbook, `project_${project.project_id}_data.xlsx`);
  };

  return (
    <div className="project-popup">
      <h3>{project.project_title || "Unnamed Project"}</h3>
      <div className="project-details">
        <p>
          <strong>Cost:</strong> ${project.cost}
        </p>
        <p>
          <strong>Type:</strong> {project.project_type}
        </p>
        <p>
          <strong>Improvement:</strong> {project.improvement}
        </p>
        <p>
          <strong>Locality:</strong> {project.locality}
        </p>
        <p>
          <strong>Product:</strong> {project.product}
        </p>
      </div>

      <div className="popup-buttons">
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "Add Comment"}
        </button>
        <button onClick={downloadProjectData}>Download Project Data</button>
      </div>

      {showForm && (
        <div className="comment-form-container">
          <CommentForm projectId={project.project_id} addComment={addComment} />
        </div>
      )}
    </div>
  );
}

export default ProjectPopup;
