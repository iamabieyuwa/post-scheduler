// utils/refreshTwitterToken.js
export async function refreshTwitterAccessToken(refreshToken) {
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
      client_id: process.env.TWITTER_CLIENT_ID,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(`Failed to refresh token: ${data.error_description || res.status}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // fallback to same token if Twitter doesn’t return a new one
    expires_in: data.expires_in,
  };
}
