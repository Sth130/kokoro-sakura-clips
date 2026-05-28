import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, sql } from "drizzle-orm";

export const community = new Hono()
  // Get all posts with reply counts
  .get("/", async (c) => {
    const posts = await db
      .select()
      .from(schema.communityPosts)
      .orderBy(desc(schema.communityPosts.createdAt));

    // Get reply counts for all posts
    const replyCounts = await db
      .select({
        postId: schema.communityReplies.postId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(schema.communityReplies)
      .groupBy(schema.communityReplies.postId);

    const replyCountMap = new Map(replyCounts.map((r) => [r.postId, r.count]));

    const postsWithCounts = posts.map((p) => ({
      ...p,
      replyCount: replyCountMap.get(p.id) || 0,
    }));

    return c.json({ posts: postsWithCounts }, 200);
  })

  // Create a new post
  .post("/", async (c) => {
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

    // Limit image size to ~2MB base64
    if (body.imageData && body.imageData.length > 2_800_000) {
      return c.json({ error: "画像は2MB以内にしてください" }, 400);
    }

    const [post] = await db
      .insert(schema.communityPosts)
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
  .post("/:id/like", async (c) => {
    const id = Number(c.req.param("id"));
    const [post] = await db
      .update(schema.communityPosts)
      .set({ likes: sql`${schema.communityPosts.likes} + 1` })
      .where(eq(schema.communityPosts.id, id))
      .returning();

    if (!post) return c.json({ error: "投稿が見つかりません" }, 404);
    return c.json({ likes: post.likes }, 200);
  })

  // Get replies for a post
  .get("/:id/replies", async (c) => {
    const id = Number(c.req.param("id"));
    const replies = await db
      .select()
      .from(schema.communityReplies)
      .where(eq(schema.communityReplies.postId, id))
      .orderBy(schema.communityReplies.createdAt);

    return c.json({ replies }, 200);
  })

  // Create a reply
  .post("/:id/replies", async (c) => {
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

    // Check post exists
    const [post] = await db
      .select()
      .from(schema.communityPosts)
      .where(eq(schema.communityPosts.id, postId));

    if (!post) return c.json({ error: "投稿が見つかりません" }, 404);

    const [reply] = await db
      .insert(schema.communityReplies)
      .values({
        postId,
        nickname: body.nickname?.trim() || "名無しさん",
        content: body.content.trim(),
      })
      .returning();

    return c.json({ reply }, 201);
  })

  // Like a reply
  .post("/:id/replies/:replyId/like", async (c) => {
    const replyId = Number(c.req.param("replyId"));
    const [reply] = await db
      .update(schema.communityReplies)
      .set({ likes: sql`${schema.communityReplies.likes} + 1` })
      .where(eq(schema.communityReplies.id, replyId))
      .returning();

    if (!reply) return c.json({ error: "返信が見つかりません" }, 404);
    return c.json({ likes: reply.likes }, 200);
  });
