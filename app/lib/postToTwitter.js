// lib/postToTwitter.js

export const postToTwitter = async (accessToken, tweetText) => {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: tweetText,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Tweet failed");
  }

  return data;
};
