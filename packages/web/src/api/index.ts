import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq, desc } from "drizzle-orm";
import { generateTweet, generateMultipleTweets } from "./lib/ai";
import { postTweet, uploadMedia, getRandomKokoroImagePath } from "./lib/twitter";
import { startScheduler } from "./lib/scheduler";
import { community } from "./routes/community";
import path from "path";
import fs from "fs";

// Start the scheduler
startScheduler();

// List available Kokoro images
const KOKORO_IMAGES = [
  { name: "kokoro-kimono.jpg", label: "着物 (海)" },
  { name: "kokoro-sakura.jpg", label: "桜の下" },
  { name: "kokoro-valentine.jpg", label: "バレンタイン" },
  { name: "kokoro-main.jpg", label: "メイン" },
  { name: "kokoro-fullbody.jpg", label: "全身 (着物)" },
  { name: "kokoro-shrine.jpg", label: "巫女" },
  { name: "kokoro-sad.jpg", label: "悲しい顔" },
  { name: "kokoro-halloween.jpg", label: "ハロウィン" },
];

const app = new Hono()
  .basePath("api")
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ status: "ok" }, 200))

  // Get available Kokoro images
  .get("/images", (c) => {
    return c.json({ images: KOKORO_IMAGES }, 200);
  })

  // Generate tweet(s) with AI
  .post("/generate", async (c) => {
    try {
      const body = await c.req.json<{ prompt?: string; count?: number }>();
      const count = body.count || 1;

      let tweets: string[];
      if (count === 1) {
        const tweet = await generateTweet(body.prompt);
        tweets = [tweet];
      } else {
        tweets = await generateMultipleTweets(count, body.prompt);
      }

      return c.json({ tweets }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  })

  // Save tweet as draft or scheduled
  .post("/tweets", async (c) => {
    try {
      const body = await c.req.json<{
        content: string;
        scheduledAt?: string;
        imageName?: string;
      }>();
      const status = body.scheduledAt ? "scheduled" : "draft";
      const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

      let imagePath: string | null = null;
      let imageUrl: string | null = null;
      if (body.imageName) {
        imagePath = path.resolve(
          process.cwd(),
          "public",
          "kokoro-images",
          body.imageName
        );
        imageUrl = `/kokoro-images/${body.imageName}`;
      }

      const [tweet] = await db
        .insert(schema.tweets)
        .values({
          content: body.content,
          status,
          scheduledAt,
          imagePath,
          imageUrl,
        })
        .returning();

      return c.json({ tweet }, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  })

  // Get all tweets
  .get("/tweets", async (c) => {
    const tweets = await db
      .select()
      .from(schema.tweets)
      .orderBy(desc(schema.tweets.createdAt));
    return c.json({ tweets }, 200);
  })

  // Update tweet
  .put("/tweets/:id", async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const body = await c.req.json<{
        content?: string;
        scheduledAt?: string;
        status?: string;
        imageName?: string;
      }>();

      const updateData: any = {};
      if (body.content !== undefined) updateData.content = body.content;
      if (body.scheduledAt !== undefined)
        updateData.scheduledAt = new Date(body.scheduledAt);
      if (body.status !== undefined) updateData.status = body.status;
      if (body.imageName !== undefined) {
        updateData.imagePath = path.resolve(
          process.cwd(),
          "public",
          "kokoro-images",
          body.imageName
        );
        updateData.imageUrl = `/kokoro-images/${body.imageName}`;
      }

      const [tweet] = await db
        .update(schema.tweets)
        .set(updateData)
        .where(eq(schema.tweets.id, id))
        .returning();

      return c.json({ tweet }, 200);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  })

  // Delete tweet
  .delete("/tweets/:id", async (c) => {
    const id = Number(c.req.param("id"));
    await db.delete(schema.tweets).where(eq(schema.tweets.id, id));
    return c.json({ success: true }, 200);
  })

  // Post tweet immediately
  .post("/tweets/:id/post", async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const [tweet] = await db
        .select()
        .from(schema.tweets)
        .where(eq(schema.tweets.id, id));

      if (!tweet) return c.json({ error: "Tweet not found" }, 404);

      // Upload image if exists
      let mediaId: string | null = null;
      if (tweet.imagePath && fs.existsSync(tweet.imagePath)) {
        mediaId = await uploadMedia(tweet.imagePath);
      }

      const result = await postTweet(tweet.content, mediaId);

      if (result.success) {
        const [updated] = await db
          .update(schema.tweets)
          .set({ status: "posted", postedAt: new Date() })
          .where(eq(schema.tweets.id, id))
          .returning();
        return c.json({ tweet: updated }, 200);
      } else {
        const [updated] = await db
          .update(schema.tweets)
          .set({ status: "failed", errorMessage: result.error })
          .where(eq(schema.tweets.id, id))
          .returning();
        return c.json({ error: result.error, tweet: updated }, 500);
      }
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  })

  // Quick post (generate + post immediately with image)
  .post("/quick-post", async (c) => {
    try {
      const body = await c.req.json<{ prompt?: string; withImage?: boolean }>();
      const content = await generateTweet(body.prompt);

      let mediaId: string | null = null;
      let imagePath: string | null = null;
      let imageUrl: string | null = null;

      if (body.withImage !== false) {
        imagePath = getRandomKokoroImagePath();
        imageUrl = `/kokoro-images/${imagePath.split("/").pop()}`;
        mediaId = await uploadMedia(imagePath);
      }

      const result = await postTweet(content, mediaId);

      const status = result.success ? "posted" : "failed";
      const [tweet] = await db
        .insert(schema.tweets)
        .values({
          content,
          status,
          postedAt: result.success ? new Date() : null,
          errorMessage: result.error || null,
          imagePath,
          imageUrl,
        })
        .returning();

      if (result.success) {
        return c.json({ tweet }, 200);
      } else {
        return c.json({ error: result.error, tweet }, 500);
      }
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  })

  // Community routes
  .route("/community", community);

export type AppType = typeof app;
export default app;
