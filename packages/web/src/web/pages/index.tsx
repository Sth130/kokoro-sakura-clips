import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Sparkles,
  Send,
  Clock,
  Trash2,
  Edit3,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Loader2,
  Calendar,
  RefreshCw,
  Image as ImageIcon,
  X,
  Bot,
  MessageSquare,
} from "lucide-react";

type Tweet = {
  id: number;
  content: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  errorMessage: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  isAutoPost: boolean | null;
  createdAt: string;
};

type KokoroImage = {
  name: string;
  label: string;
};

function SakuraBackground() {
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    duration: `${8 + Math.random() * 8}s`,
    size: 8 + Math.random() * 10,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="sakura-petal absolute text-pink-300/30"
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            fontSize: `${petal.size}px`,
          }}
        >
          🌸
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    draft: { icon: <FileText size={12} />, label: "下書き", cls: "bg-gray-100 text-gray-600" },
    scheduled: { icon: <Clock size={12} />, label: "予約済み", cls: "bg-blue-100 text-blue-700" },
    posted: { icon: <CheckCircle size={12} />, label: "投稿済み", cls: "bg-green-100 text-green-700" },
    failed: { icon: <XCircle size={12} />, label: "失敗", cls: "bg-red-100 text-red-700" },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

function ImagePicker({
  images,
  selected,
  onSelect,
}: {
  images: KokoroImage[];
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
        <ImageIcon size={12} /> 画像を選択（こころ DOA5LR）
      </p>
      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <button
            key={img.name}
            onClick={() => onSelect(selected === img.name ? null : img.name)}
            className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
              selected === img.name
                ? "border-pink-500 ring-2 ring-pink-300 scale-[1.02]"
                : "border-transparent hover:border-pink-200"
            }`}
          >
            <img
              src={`/kokoro-images/${img.name}`}
              alt={img.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] py-0.5 text-center">
              {img.label}
            </div>
            {selected === img.name && (
              <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-0.5">
                <CheckCircle size={10} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TweetCard({
  tweet,
  onPost,
  onDelete,
  onEdit,
  isPosting,
}: {
  tweet: Tweet;
  onPost: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (tweet: Tweet) => void;
  isPosting: boolean;
}) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white rounded-xl border border-pink-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {tweet.imageUrl && (
          <img
            src={tweet.imageUrl}
            alt="Kokoro"
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{tweet.content}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {tweet.isAutoPost && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                  <Bot size={10} />自動
                </span>
              )}
              <StatusBadge status={tweet.status} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-pink-50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDate(tweet.createdAt)}</span>
              {tweet.scheduledAt && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Calendar size={10} />{formatDate(tweet.scheduledAt)}
                </span>
              )}
              {tweet.errorMessage && (
                <span className="flex items-center gap-1 text-red-500" title={tweet.errorMessage}>
                  <AlertCircle size={10} />エラー
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {(tweet.status === "draft" || tweet.status === "failed") && (
                <>
                  <button onClick={() => onEdit(tweet)} className="p-1.5 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-500 transition-colors" title="編集">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onPost(tweet.id)} disabled={isPosting} className="p-1.5 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-500 transition-colors disabled:opacity-50" title="今すぐ投稿">
                    {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </>
              )}
              {tweet.status !== "posted" && (
                <button onClick={() => onDelete(tweet.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="削除">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [generatedTweets, setGeneratedTweets] = useState<string[]>([]);
  const [editingContent, setEditingContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "scheduled" | "posted" | "failed">("all");
  const [postingId, setPostingId] = useState<number | null>(null);

  const tweetsQuery = useQuery({
    queryKey: ["tweets"],
    queryFn: async () => {
      const res = await api.tweets.$get();
      return (await res.json()) as { tweets: Tweet[] };
    },
  });

  const imagesQuery = useQuery({
    queryKey: ["images"],
    queryFn: async () => {
      const res = await api.images.$get();
      return (await res.json()) as { images: KokoroImage[] };
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt?: string; count?: number }) => {
      const res = await api.generate.$post({ json: data });
      return (await res.json()) as { tweets: string[] };
    },
    onSuccess: (data) => setGeneratedTweets(data.tweets),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { content: string; scheduledAt?: string; imageName?: string }) => {
      const res = await api.tweets.$post({ json: data });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });

  const postMutation = useMutation({
    mutationFn: async (id: number) => {
      setPostingId(id);
      const res = await api.tweets[":id"].post.$post({ param: { id: String(id) } });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tweets"] }); setPostingId(null); },
    onError: () => { queryClient.invalidateQueries({ queryKey: ["tweets"] }); setPostingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.tweets[":id"].$delete({ param: { id: String(id) } });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; scheduledAt?: string }) => {
      const { id, ...body } = data;
      const res = await api.tweets[":id"].$put({ param: { id: String(id) }, json: body });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tweets"] }); setEditingId(null); setEditingContent(""); },
  });

  const quickPostMutation = useMutation({
    mutationFn: async (data: { prompt?: string; withImage?: boolean }) => {
      const res = await api["quick-post"].$post({ json: data });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tweets"] }),
  });

  const handleGenerate = () => {
    generateMutation.mutate({ prompt: prompt || undefined, count: 3 });
  };

  const handleSaveTweet = (content: string) => {
    saveMutation.mutate({
      content,
      scheduledAt: scheduleDate || undefined,
      imageName: selectedImage || undefined,
    });
    setGeneratedTweets((prev) => prev.filter((t) => t !== content));
  };

  const handleEdit = (tweet: Tweet) => {
    setEditingId(tweet.id);
    setEditingContent(tweet.content);
  };

  const filteredTweets = tweetsQuery.data?.tweets.filter((t) => activeTab === "all" || t.status === activeTab) || [];

  const tabs = [
    { key: "all" as const, label: "すべて" },
    { key: "draft" as const, label: "下書き" },
    { key: "scheduled" as const, label: "予約済み" },
    { key: "posted" as const, label: "投稿済み" },
    { key: "failed" as const, label: "失敗" },
  ];

  const stats = tweetsQuery.data?.tweets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen relative">
      <SakuraBackground />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            🌸 こころ Tweet Bot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">DOA5LR こころの魅力を自動発信</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              毎日18:00 自動投稿ON
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
              <MessageSquare size={10} />
              自動リプライON
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "下書き", count: stats.draft || 0, color: "bg-gray-50 text-gray-700" },
            { label: "予約", count: stats.scheduled || 0, color: "bg-blue-50 text-blue-700" },
            { label: "投稿済", count: stats.posted || 0, color: "bg-green-50 text-green-700" },
            { label: "失敗", count: stats.failed || 0, color: "bg-red-50 text-red-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
              <div className="text-2xl font-bold">{s.count}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Generate Section */}
        <div className="bg-white rounded-xl border border-pink-100 p-5 shadow-sm mb-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-pink-500" />
            ツイート生成
          </h2>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="テーマを指定（空欄でランダム）"
              className="flex-1 px-3 py-2 rounded-lg border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {generateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              生成
            </button>
            <button
              onClick={() => quickPostMutation.mutate({ prompt: prompt || undefined, withImage: true })}
              disabled={quickPostMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-400 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
              title="AI生成+画像付きで即投稿"
            >
              {quickPostMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              即投稿
            </button>
          </div>

          {/* Schedule & Image */}
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-pink-400" />
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-pink-100 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {scheduleDate && (
              <button onClick={() => setScheduleDate("")} className="text-xs text-muted-foreground hover:text-red-400">
                クリア
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {scheduleDate ? "予約投稿モード" : "下書き保存モード"}
            </span>
          </div>

          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-pink-50 rounded-lg">
              <img src={`/kokoro-images/${selectedImage}`} alt="Selected" className="w-10 h-10 rounded object-cover" />
              <span className="text-xs text-pink-600 flex-1">画像付きで投稿</span>
              <button onClick={() => setSelectedImage(null)} className="text-pink-400 hover:text-pink-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Image Picker */}
          {imagesQuery.data && (
            <ImagePicker
              images={imagesQuery.data.images}
              selected={selectedImage}
              onSelect={setSelectedImage}
            />
          )}

          {/* Generated tweets */}
          {generatedTweets.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-muted-foreground font-medium">生成結果（クリックで保存）:</p>
              {generatedTweets.map((tweet, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-pink-50/50 border border-pink-100 text-sm cursor-pointer hover:bg-pink-50 transition-colors group"
                  onClick={() => handleSaveTweet(tweet)}
                >
                  <div className="flex items-start gap-2">
                    {selectedImage && (
                      <img src={`/kokoro-images/${selectedImage}`} alt="Kokoro" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                    )}
                    <p className="whitespace-pre-wrap flex-1">{tweet}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Send size={10} />
                    クリックして{scheduleDate ? "予約保存" : "下書き保存"}
                    {selectedImage && " (画像付き)"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {quickPostMutation.isSuccess && (
            <div className="mt-3 p-2 rounded-lg bg-green-50 text-green-700 text-xs flex items-center gap-1">
              <CheckCircle size={12} /> 画像付きで即投稿が完了しました！
            </div>
          )}
          {quickPostMutation.isError && (
            <div className="mt-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-1">
              <XCircle size={12} /> 投稿に失敗しました
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className="bg-white rounded-xl border border-pink-100 p-5 shadow-sm mb-6">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Edit3 size={16} className="text-pink-500" /> ツイート編集
            </h2>
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none bg-pink-50/30"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${editingContent.length > 280 ? "text-red-500" : "text-muted-foreground"}`}>
                {editingContent.length}/280
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(null); setEditingContent(""); }} className="px-3 py-1.5 text-sm rounded-lg border border-pink-100 hover:bg-pink-50">
                  キャンセル
                </button>
                <button
                  onClick={() => updateMutation.mutate({ id: editingId, content: editingContent })}
                  disabled={updateMutation.isPending || editingContent.length > 280}
                  className="px-3 py-1.5 text-sm rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "保存"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automation Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-4 mb-6">
          <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Bot size={16} className="text-purple-500" /> 自動化設定
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-purple-700 mb-1">📅 毎日自動投稿</div>
              <p className="text-muted-foreground">18:00 (JST) にAI生成+こころ画像付きで自動投稿</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-blue-700 mb-1">💬 自動リプライ</div>
              <p className="text-muted-foreground">メンションに5分ごとにAIが自動返信（50%で画像付き）</p>
            </div>
          </div>
        </div>

        {/* Tweet List */}
        <div className="bg-white rounded-xl border border-pink-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <FileText size={16} className="text-pink-500" /> ツイート一覧
            </h2>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["tweets"] })}
              className="p-1.5 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-500 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-pink-500 text-white"
                    : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tweets */}
          {tweetsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={20} className="animate-spin mr-2" /> 読み込み中...
            </div>
          ) : filteredTweets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Sparkles size={24} className="mx-auto mb-2 text-pink-300" />
              ツイートがありません。上の「生成」ボタンで作成しましょう！
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTweets.map((tweet) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  onPost={(id) => postMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onEdit={handleEdit}
                  isPosting={postingId === tweet.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
