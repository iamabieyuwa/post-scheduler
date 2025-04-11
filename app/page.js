// app/page.js
"use client";
import { useState } from "react";
import PostForm from "./components/PostForm";
import PostList from "./components/PostList";

export default function HomePage() {
  const [posts, setPosts] = useState([]);

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <>
      <PostForm onAdd={addPost} />
    </>
  );
}
