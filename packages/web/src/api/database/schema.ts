import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tweets = sqliteTable("tweets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "posted", "failed"] })
    .notNull()
    .default("draft"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  postedAt: integer("posted_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  imagePath: text("image_path"),
  imageUrl: text("image_url"),
  isAutoPost: integer("is_auto_post", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Community Posts ───
export const communityPosts = sqliteTable("community_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nickname: text("nickname").notNull().default("名無しさん"),
  content: text("content").notNull(),
  imageData: text("image_data"), // base64 encoded image (optional)
  videoUrl: text("video_url"),   // YouTube/Niconico URL (optional)
  likes: integer("likes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Community Replies ───
export const communityReplies = sqliteTable("community_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  nickname: text("nickname").notNull().default("名無しさん"),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
