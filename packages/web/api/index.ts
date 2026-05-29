import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { eq, desc, sql } from "drizzle-orm";

export const config = {
  runtime: "nodejs",
};

// ─── Schema (inline to avoid import issues) ───
const communityPosts = sqliteTable("community_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nickname: text("nickname").notNull().default("名無しさん"),
  content: text("content").notNull(),
  imageData: text("image_data"),
  videoUrl: text("video_url"),
  likes: integer("likes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

const communityReplies = sqliteTable("community_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  nickname: text("nickname").notNull().default("名無しさん"),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── DB ───
const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema: { communityPosts, communityReplies } });

// ─── Spam Filter ───
const NG_WORDS = [
  // 広告・スパム系
  "http://", "bit.ly", "goo.gl", "tinyurl", "副業", "稼げる", "稼ぎ方",
  "出会い系", "アダルト", "カジノ", "パチンコ必勝", "情報商材",
  "LINE追加", "LINE@", "DMください", "フォロバ100",
  // 英語スパム
  "buy now", "click here", "free money", "crypto airdrop", "earn money",
];

const RATE_LIMIT_MAP = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1分
const RATE_LIMIT_MAX = 5; // 1分に5回まで

function isSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return NG_WORDS.some((w) => lower.includes(w.toLowerCase()));
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = RATE_LIMIT_MAP.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  RATE_LIMIT_MAP.set(ip, recent);
  return false;
}

function getClientIP(c: any): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

// ─── App ───
const app = new Hono()
  .basePath("/api")
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ status: "ok" }, 200))

  // Get all posts with reply counts
  .get("/community", async (c) => {
    const posts = await db
      .select()
      .from(communityPosts)
      .orderBy(desc(communityPosts.createdAt));

    const replyCounts = await db
      .select({
        postId: communityReplies.postId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(communityReplies)
      .groupBy(communityReplies.postId);

    const replyCountMap = new Map(replyCounts.map((r) => [r.postId, r.count]));
    const postsWithCounts = posts.map((p) => ({
      ...p,
      replyCount: replyCountMap.get(p.id) || 0,
    }));

    return c.json({ posts: postsWithCounts }, 200);
  })

  // Create a new post
  .post("/community", async (c) => {
    const ip = getClientIP(c);
    if (isRateLimited(ip)) {
      return c.json({ error: "投稿が多すぎます。少し待ってからお試しください" }, 429);
    }

    const body = await c.req.json<{
      nickname?: string;
      content: string;
      imageData?: string;
      videoUrl?: string;
    }>();

    if (!body.content || body.content.trim().length === 0) {
      return c.json({ error: "内容を入力してください" }, 400);
    }
    if (body.content.length > 2000) {
      return c.json({ error: "2000文字以内で入力してください" }, 400);
    }
    if (body.imageData && body.imageData.length > 2_800_000) {
      return c.json({ error: "画像は2MB以内にしてください" }, 400);
    }
    if (isSpam(body.content) || (body.nickname && isSpam(body.nickname))) {
      return c.json({ error: "不適切な内容が含まれています" }, 400);
    }

    const [post] = await db
      .insert(communityPosts)
      .values({
        nickname: body.nickname?.trim() || "名無しさん",
        content: body.content.trim(),
        imageData: body.imageData || null,
        videoUrl: body.videoUrl?.trim() || null,
      })
      .returning();

    return c.json({ post: { ...post, replyCount: 0 } }, 201);
  })

  // Like a post
  .post("/community/:id/like", async (c) => {
    const id = Number(c.req.param("id"));
    const [post] = await db
      .update(communityPosts)
      .set({ likes: sql`${communityPosts.likes} + 1` })
      .where(eq(communityPosts.id, id))
      .returning();

    if (!post) return c.json({ error: "投稿が見つかりません" }, 404);
    return c.json({ likes: post.likes }, 200);
  })

  // Get replies for a post
  .get("/community/:id/replies", async (c) => {
    const id = Number(c.req.param("id"));
    const replies = await db
      .select()
      .from(communityReplies)
      .where(eq(communityReplies.postId, id))
      .orderBy(communityReplies.createdAt);

    return c.json({ replies }, 200);
  })

  // Create a reply
  .post("/community/:id/replies", async (c) => {
    const ip = getClientIP(c);
    if (isRateLimited(ip)) {
      return c.json({ error: "投稿が多すぎます。少し待ってからお試しください" }, 429);
    }

    const postId = Number(c.req.param("id"));
    const body = await c.req.json<{
      nickname?: string;
      content: string;
    }>();

    if (!body.content || body.content.trim().length === 0) {
      return c.json({ error: "内容を入力してください" }, 400);
    }
    if (body.content.length > 500) {
      return c.json({ error: "500文字以内で入力してください" }, 400);
    }
    if (isSpam(body.content) || (body.nickname && isSpam(body.nickname))) {
      return c.json({ error: "不適切な内容が含まれています" }, 400);
    }

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));

    if (!post) return c.json({ error: "投稿が見つかりません" }, 404);

    const [reply] = await db
      .insert(communityReplies)
      .values({
        postId,
        nickname: body.nickname?.trim() || "名無しさん",
        content: body.content.trim(),
      })
      .returning();

    return c.json({ reply }, 201);
  })

  // Like a reply
  .post("/community/:id/replies/:replyId/like", async (c) => {
    const replyId = Number(c.req.param("replyId"));
    const [reply] = await db
      .update(communityReplies)
      .set({ likes: sql`${communityReplies.likes} + 1` })
      .where(eq(communityReplies.id, replyId))
      .returning();

    if (!reply) return c.json({ error: "返信が見つかりません" }, 404);
    return c.json({ likes: reply.likes }, 200);
  });

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
