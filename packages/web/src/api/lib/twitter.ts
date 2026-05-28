import OAuth from "oauth-1.0a";
import CryptoJS from "crypto-js";
import fs from "fs";
import path from "path";

function getOAuth() {
  const oauth = new OAuth({
    consumer: {
      key: process.env.X_API_KEY!,
      secret: process.env.X_API_SECRET!,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString: string, key: string) {
      return CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64);
    },
  });

  const token = {
    key: process.env.X_ACCESS_TOKEN!,
    secret: process.env.X_ACCESS_TOKEN_SECRET!,
  };

  return { oauth, token };
}

// Upload image to Twitter (v1.1 media upload)
export async function uploadMedia(imagePath: string): Promise<string | null> {
  try {
    const { oauth, token } = getOAuth();
    const url = "https://upload.twitter.com/1.1/media/upload.json";

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString("base64");

    const requestData = { url, method: "POST" as const };
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const formData = new FormData();
    formData.append("media_data", base64Image);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Twitter] Media upload failed:", errorText);
      return null;
    }

    const data = (await response.json()) as any;
    return data.media_id_string;
  } catch (error: any) {
    console.error("[Twitter] Media upload error:", error.message);
    return null;
  }
}

// Post tweet with optional image
export async function postTweet(
  text: string,
  mediaId?: string | null
): Promise<{ success: boolean; error?: string; tweetId?: string }> {
  try {
    const { oauth, token } = getOAuth();
    const url = "https://api.twitter.com/2/tweets";

    const requestData = { url, method: "POST" as const };
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const body: any = { text };
    if (mediaId) {
      body.media = { media_ids: [mediaId] };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as any)?.detail ||
        (errorData as any)?.title ||
        `HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    const data = (await response.json()) as any;
    return { success: true, tweetId: data?.data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Reply to a tweet
export async function replyToTweet(
  text: string,
  replyToTweetId: string,
  mediaId?: string | null
): Promise<{ success: boolean; error?: string; tweetId?: string }> {
  try {
    const { oauth, token } = getOAuth();
    const url = "https://api.twitter.com/2/tweets";

    const requestData = { url, method: "POST" as const };
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const body: any = {
      text,
      reply: { in_reply_to_tweet_id: replyToTweetId },
    };
    if (mediaId) {
      body.media = { media_ids: [mediaId] };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as any)?.detail ||
        (errorData as any)?.title ||
        `HTTP ${response.status}`;
      return { success: false, error: errorMsg };
    }

    const data = (await response.json()) as any;
    return { success: true, tweetId: data?.data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Search recent mentions
export async function getRecentMentions(
  sinceId?: string
): Promise<{ tweets: any[]; newestId?: string }> {
  try {
    const { oauth, token } = getOAuth();
    let url = "https://api.twitter.com/2/users/me";

    // First get user ID
    const meRequest = { url, method: "GET" as const };
    const meAuth = oauth.toHeader(oauth.authorize(meRequest, token));
    const meRes = await fetch(url, { headers: { ...meAuth } });

    if (!meRes.ok) return { tweets: [] };
    const meData = (await meRes.json()) as any;
    const userId = meData?.data?.id;
    if (!userId) return { tweets: [] };

    // Get mentions
    url = `https://api.twitter.com/2/users/${userId}/mentions?tweet.fields=created_at,author_id,conversation_id&max_results=10`;
    if (sinceId) url += `&since_id=${sinceId}`;

    const mentionsRequest = { url, method: "GET" as const };
    const mentionsAuth = oauth.toHeader(
      oauth.authorize(mentionsRequest, token)
    );
    const mentionsRes = await fetch(url, { headers: { ...mentionsAuth } });

    if (!mentionsRes.ok) {
      const errText = await mentionsRes.text();
      console.error("[Twitter] Mentions fetch failed:", errText);
      return { tweets: [] };
    }

    const mentionsData = (await mentionsRes.json()) as any;
    return {
      tweets: mentionsData?.data || [],
      newestId: mentionsData?.meta?.newest_id,
    };
  } catch (error: any) {
    console.error("[Twitter] Mentions error:", error.message);
    return { tweets: [] };
  }
}

// Get a random Kokoro image path
const KOKORO_IMAGES = [
  "kokoro-kimono.jpg",
  "kokoro-sakura.jpg",
  "kokoro-valentine.jpg",
  "kokoro-main.jpg",
  "kokoro-fullbody.jpg",
  "kokoro-shrine.jpg",
  "kokoro-sad.jpg",
  "kokoro-halloween.jpg",
];

export function getRandomKokoroImagePath(): string {
  const img = KOKORO_IMAGES[Math.floor(Math.random() * KOKORO_IMAGES.length)];
  // Resolve from project root
  return path.resolve(process.cwd(), "public", "kokoro-images", img);
}
