// components/PostList.jsx
"use client";

export default function PostList({ posts }) {
  return (
    <div>
      <h2>Scheduled Posts</h2>
      {posts.length === 0 ? (
        <p>No posts scheduled yet.</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                listStyle: "none",
                marginBottom: "1.5rem",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <strong>
                {new Date(post.scheduledAt).toLocaleString()}
              </strong>
              <p className='mt-1 whitespace-pre-line'>{post.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
