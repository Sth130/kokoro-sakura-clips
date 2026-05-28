import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Heart,
  MessageCircle,
  Send,
  ImagePlus,
  Link2,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
} from "lucide-react";

/* ─── Types ─── */
type Post = {
  id: number;
  nickname: string;
  content: string;
  imageData: string | null;
  videoUrl: string | null;
  likes: number;
  replyCount: number;
  createdAt: string;
};

type Reply = {
  id: number;
  postId: number;
  nickname: string;
  content: string;
  likes: number;
  createdAt: string;
};

/* ─── Helpers ─── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

function extractVideoEmbed(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Niconico
  const nicoMatch = url.match(/nicovideo\.jp\/watch\/(sm\d+)/);
  if (nicoMatch)
    return `https://embed.nicovideo.jp/watch/${nicoMatch[1]}`;

  return null;
}



/* ─── New Post Form ─── */
function NewPostForm({ onSuccess }: { onSuccess: () => void }) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createPost = useMutation({
    mutationFn: async (data: {
      nickname?: string;
      content: string;
      imageData?: string;
      videoUrl?: string;
    }) => {
      const res = await api.community.$post({ json: data });
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setVideoUrl("");
      setImageData(null);
      setImagePreview(null);
      setShowVideoInput(false);
      onSuccess();
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("画像は2MB以内にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageData(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    createPost.mutate({
      nickname: nickname.trim() || undefined,
      content: content.trim(),
      imageData: imageData || undefined,
      videoUrl: videoUrl.trim() || undefined,
    });
  };

  return (
    <div className="bg-[#2A2A2A] rounded-xl border border-white/5 p-5">
      {/* Nickname */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#D4627A]/20 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-[#F8B4C8]" />
        </div>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="ニックネーム（空欄で「名無しさん」）"
          maxLength={30}
          className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
        />
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="こころについて語ろう！対戦感想、好きな衣装、リョナシーンの感想なんでもOK..."
        maxLength={2000}
        rows={3}
        className="w-full bg-[#1A1A1A] rounded-lg px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none resize-none border border-white/5 focus:border-[#D4627A]/30 transition-colors"
      />

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mt-3 inline-block">
          <img
            src={imagePreview}
            alt="プレビュー"
            className="max-h-40 rounded-lg object-cover"
          />
          <button
            onClick={() => {
              setImageData(null);
              setImagePreview(null);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Video URL input */}
      {showVideoInput && (
        <div className="mt-3 flex items-center gap-2">
          <Link2 size={14} className="text-white/30 flex-shrink-0" />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="YouTube / ニコニコ動画 URL"
            className="flex-1 bg-[#1A1A1A] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none border border-white/5 focus:border-[#D4627A]/30"
          />
          <button
            onClick={() => {
              setShowVideoInput(false);
              setVideoUrl("");
            }}
            className="text-white/30 hover:text-white/60"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Video embed preview */}
      {videoUrl && extractVideoEmbed(videoUrl) && (
        <div className="mt-3 rounded-lg overflow-hidden aspect-video max-h-48">
          <iframe
            src={extractVideoEmbed(videoUrl)!}
            className="w-full h-full"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2 rounded-lg text-white/30 hover:text-[#F8B4C8] hover:bg-white/5 transition-colors"
            title="画像を添付"
          >
            <ImagePlus size={18} />
          </button>
          <button
            onClick={() => setShowVideoInput(!showVideoInput)}
            className="p-2 rounded-lg text-white/30 hover:text-[#F8B4C8] hover:bg-white/5 transition-colors"
            title="動画リンクを追加"
          >
            <Link2 size={18} />
          </button>
          <span className="text-[11px] text-white/15 ml-1">
            {content.length}/2000
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || createPost.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-[#D4627A] text-white text-sm rounded-full hover:bg-[#C04060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {createPost.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          投稿する
        </button>
      </div>
    </div>
  );
}

/* ─── Reply Section ─── */
function RepliesSection({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");

  const repliesQuery = useQuery({
    queryKey: ["replies", postId],
    queryFn: async () => {
      const res = await api.community[":id"].replies.$get({
        param: { id: String(postId) },
      });
      return (await res.json()) as { replies: Reply[] };
    },
  });

  const createReply = useMutation({
    mutationFn: async (data: { nickname?: string; content: string }) => {
      const res = await api.community[":id"].replies.$post({
        param: { id: String(postId) },
        json: data,
      });
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const likeReply = useMutation({
    mutationFn: async (replyId: number) => {
      const res = await api.community[":id"].replies[":replyId"].like.$post({
        param: { id: String(postId), replyId: String(replyId) },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
    },
  });

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      {/* Reply list */}
      {repliesQuery.isLoading ? (
        <div className="flex items-center gap-2 text-white/20 text-xs py-2">
          <Loader2 size={12} className="animate-spin" /> 読み込み中...
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {repliesQuery.data?.replies.map((reply) => (
            <div
              key={reply.id}
              className="flex gap-2 pl-2 border-l-2 border-[#D4627A]/10"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#F8B4C8]">
                    {reply.nickname}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {timeAgo(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-white/70 mt-0.5 break-all whitespace-pre-wrap">
                  {reply.content}
                </p>
              </div>
              <button
                onClick={() => likeReply.mutate(reply.id)}
                className="flex items-center gap-1 text-[10px] text-white/20 hover:text-[#F8B4C8] transition-colors flex-shrink-0 self-start mt-1"
              >
                <Heart size={10} />
                {reply.likes > 0 && reply.likes}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="名前"
          maxLength={30}
          className="w-20 bg-[#1A1A1A] rounded-lg px-2 py-1.5 text-xs text-white/70 placeholder:text-white/20 outline-none border border-white/5 flex-shrink-0"
        />
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="返信を書く..."
          maxLength={500}
          className="flex-1 bg-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs text-white/70 placeholder:text-white/20 outline-none border border-white/5 focus:border-[#D4627A]/30"
          onKeyDown={(e) => {
            if (e.key === "Enter" && content.trim()) {
              createReply.mutate({
                nickname: nickname.trim() || undefined,
                content: content.trim(),
              });
            }
          }}
        />
        <button
          onClick={() => {
            if (content.trim()) {
              createReply.mutate({
                nickname: nickname.trim() || undefined,
                content: content.trim(),
              });
            }
          }}
          disabled={!content.trim() || createReply.isPending}
          className="p-1.5 rounded-lg text-white/30 hover:text-[#F8B4C8] disabled:opacity-30 transition-colors"
        >
          {createReply.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Post Card ─── */
function PostCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [liked, setLiked] = useState(false);

  const likePost = useMutation({
    mutationFn: async () => {
      const res = await api.community[":id"].like.$post({
        param: { id: String(post.id) },
      });
      return res.json();
    },
    onSuccess: () => {
      setLiked(true);
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const embedUrl = post.videoUrl ? extractVideoEmbed(post.videoUrl) : null;

  return (
    <div className="bg-[#2A2A2A] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4627A] to-[#C9A96E] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {post.nickname.charAt(0)}
        </div>
        <div>
          <span className="text-sm font-medium text-white/90">
            {post.nickname}
          </span>
          <p className="text-[11px] text-white/25">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-all">
        {post.content}
      </p>

      {/* Image */}
      {post.imageData && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img
            src={post.imageData}
            alt="投稿画像"
            className="max-w-full max-h-80 object-contain rounded-lg"
          />
        </div>
      )}

      {/* Video embed */}
      {embedUrl && (
        <div className="mt-3 rounded-lg overflow-hidden aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        <button
          onClick={() => likePost.mutate()}
          disabled={liked}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked
              ? "text-[#F8B4C8]"
              : "text-white/30 hover:text-[#F8B4C8]"
          }`}
        >
          <Heart size={16} className={liked ? "fill-current" : ""} />
          <span>{post.likes}</span>
        </button>

        <button
          onClick={() => setShowReplies(!showReplies)}
          className="flex items-center gap-1.5 text-sm text-white/30 hover:text-[#C9A96E] transition-colors"
        >
          <MessageCircle size={16} />
          <span>{post.replyCount}</span>
          {showReplies ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
        </button>
      </div>

      {/* Replies */}
      {showReplies && <RepliesSection postId={post.id} />}
    </div>
  );
}

/* ─── Main Community Section ─── */
const INITIAL_POST_COUNT = 5;

export default function CommunitySection() {
  const queryClient = useQueryClient();
  const [showAllPosts, setShowAllPosts] = useState(false);

  const postsQuery = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const res = await api.community.$get();
      return (await res.json()) as { posts: Post[] };
    },
  });

  const allPosts = postsQuery.data?.posts ?? [];
  const visiblePosts = showAllPosts ? allPosts : allPosts.slice(0, INITIAL_POST_COUNT);
  const hiddenCount = allPosts.length - INITIAL_POST_COUNT;

  return (
    <section
      id="community"
      className="relative py-24 px-6 bg-[#1A1A1A] text-white overflow-hidden"
    >
      {/* Transitions — top blends from Gallery (light), bottom has no gradient since SNS is also dark */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#FFF9F5] to-transparent z-10" />

      {/* Decorative */}
      <div className="absolute top-1/3 left-0 w-72 h-72 bg-[#D4627A]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 w-56 h-56 bg-[#C9A96E]/5 rounded-full blur-3xl" />

      <div className="max-w-2xl mx-auto relative z-10 pt-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-display text-sm tracking-[0.4em] text-[#C9A96E] mb-3">
            COMMUNITY
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-glow-pink">
            コミュニティ
          </h2>
          <div className="h-[1px] w-[60px] mx-auto mt-4 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
          <p className="font-sans text-sm text-white/40 mt-4">
            こころファン同士で語り合おう ─ 匿名で気軽に投稿できます
          </p>
        </div>

        {/* New post form */}
        <div className="mb-8">
          <NewPostForm
            onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: ["community-posts"],
              })
            }
          />
        </div>

        {/* Posts */}
        {postsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-white/30">
            <Loader2 size={24} className="animate-spin mr-3" />
            読み込み中...
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🌸</div>
            <p className="text-white/30 text-sm">
              まだ投稿がありません。最初の投稿をしてみよう！
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Show more / Show less button */}
            {hiddenCount > 0 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllPosts(!showAllPosts)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2A2A2A] border border-white/10 text-white/50 text-sm rounded-full hover:border-[#D4627A]/30 hover:text-[#F8B4C8] transition-all"
                >
                  {showAllPosts ? (
                    <>コメントを折りたたむ <ChevronUp size={14} /></>
                  ) : (
                    <>もっとコメントを見る（残り{hiddenCount}件） <ChevronDown size={14} /></>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
