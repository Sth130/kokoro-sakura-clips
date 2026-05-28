import cron from "node-cron";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, lte, and } from "drizzle-orm";
import {
  postTweet,
  uploadMedia,
  getRandomKokoroImagePath,
  replyToTweet,
  getRecentMentions,
} from "./twitter";
import { generateTweet, generateReply } from "./ai";

let schedulerStarted = false;
let lastMentionId: string | undefined;

export function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // ============================
  // 1. Check scheduled tweets every minute
  // ============================
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const pendingTweets = await db
        .select()
        .from(schema.tweets)
        .where(
          and(
            eq(schema.tweets.status, "scheduled"),
            lte(schema.tweets.scheduledAt, now)
          )
        );

      for (const tweet of pendingTweets) {
        let mediaId: string | null = null;

        // Upload image if tweet has an attached image
        if (tweet.imagePath) {
          mediaId = await uploadMedia(tweet.imagePath);
        }

        const result = await postTweet(tweet.content, mediaId);

        if (result.success) {
          await db
            .update(schema.tweets)
            .set({ status: "posted", postedAt: new Date() })
            .where(eq(schema.tweets.id, tweet.id));
          console.log(`[Scheduler] Posted tweet #${tweet.id}`);
        } else {
          await db
            .update(schema.tweets)
            .set({ status: "failed", errorMessage: result.error || "Unknown error" })
            .where(eq(schema.tweets.id, tweet.id));
          console.error(`[Scheduler] Failed tweet #${tweet.id}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("[Scheduler] Error:", error);
    }
  });

  // ============================
  // 2. Daily auto-post at 18:00 JST (= 09:00 UTC)
  // ============================
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] Daily 18:00 JST auto-post triggered");
    try {
      // Generate tweet with AI
      const content = await generateTweet();

      // Pick random Kokoro image and upload
      const imagePath = getRandomKokoroImagePath();
      const mediaId = await uploadMedia(imagePath);

      const result = await postTweet(content, mediaId);

      // Save to DB
      const imgName = imagePath.split("/").pop() || null;
      await db.insert(schema.tweets).values({
        content,
        status: result.success ? "posted" : "failed",
        postedAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
        imagePath: imagePath,
        isAutoPost: true,
      });

      if (result.success) {
        console.log("[Scheduler] Daily auto-post success:", content.substring(0, 50));
      } else {
        console.error("[Scheduler] Daily auto-post failed:", result.error);
      }
    } catch (error) {
      console.error("[Scheduler] Daily auto-post error:", error);
    }
  });

  // ============================
  // 3. Auto-reply to mentions every 5 minutes
  // ============================
  cron.schedule("*/5 * * * *", async () => {
    try {
      const { tweets: mentions, newestId } = await getRecentMentions(lastMentionId);

      if (newestId) {
        lastMentionId = newestId;
      }

      for (const mention of mentions) {
        console.log(`[Scheduler] Replying to mention: ${mention.id}`);

        // Generate a reply using AI
        const replyText = await generateReply(mention.text);

        // Optionally attach a Kokoro image (50% chance)
        let mediaId: string | null = null;
        if (Math.random() > 0.5) {
          const imagePath = getRandomKokoroImagePath();
          mediaId = await uploadMedia(imagePath);
        }

        const result = await replyToTweet(replyText, mention.id, mediaId);

        if (result.success) {
          console.log(`[Scheduler] Replied to ${mention.id}`);
        } else {
          console.error(`[Scheduler] Reply failed to ${mention.id}: ${result.error}`);
        }

        // Rate limit protection - wait 2 seconds between replies
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("[Scheduler] Auto-reply error:", error);
    }
  });

  console.log("[Scheduler] Started:");
  console.log("  - Scheduled tweets: every minute");
  console.log("  - Daily auto-post: 18:00 JST");
  console.log("  - Auto-reply: every 5 minutes");
}
