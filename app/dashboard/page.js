// app/dashboard/page.jsx
"use client";

import { useState } from "react";
import PostForm from "../components/PostForm";


export default function DashboardPage() {
  const [posts, setPosts] = useState([]);

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">Schedule a Post</h1>
      <PostForm onAdd={addPost} />
      {/* <PostList posts={posts} /> */}
    </div>
  );
}
