import React, { useState } from "react";

function CommentForm({ projectId, addComment }) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const newComment = {
      projectId,
      name,
      comment,
      timestamp: new Date().toISOString(),
    };

    addComment(newComment);

    alert("Comment submitted!");
    setName("");
    setComment("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "10px" }}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ display: "block", marginBottom: "5px", width: "100%" }}
      />
      <textarea
        placeholder="Your comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        style={{ display: "block", marginBottom: "5px", width: "100%" }}
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export default CommentForm;
