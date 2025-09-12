import React, { useState, useEffect } from "react";
import MapView from "./components/MapView";

function App() {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/comments")
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error("Failed to fetch comments:", err));
  }, []);

  const addComment = (comment) => {
    fetch("http://localhost:3001/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(comment),
    })
      .then((res) => res.json())
      .then((newComment) => {
        setComments([...comments, newComment]);
      })
      .catch((err) => console.error("Failed to add comment:", err));
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapView addComment={addComment} comments={comments} />
    </div>
  );
}

export default App;
