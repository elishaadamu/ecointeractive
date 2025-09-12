import React, { useState } from "react";
import Swal from "sweetalert2";

function CommentForm({ projectId, addComment }) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newComment = {
      projectId,
      name,
      comment,
      timestamp: new Date().toISOString(),
    };

    addComment(newComment);

    await Swal.fire({
      icon: "success",
      title: "Comment Submitted!",
      text: "Your comment has been successfully added.",
      showConfirmButton: false,
      timer: 1500,
    });

    setName("");
    setComment("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <textarea
          placeholder="Your comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "5px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>
      <button
        type="submit"
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Submit Comment
      </button>
    </form>
  );
}

export default CommentForm;
