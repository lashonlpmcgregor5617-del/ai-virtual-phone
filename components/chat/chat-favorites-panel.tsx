"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { PageShell } from "@/components/ui/page-shell";
import {
  loadChatFavorites,
  removeChatFavorite,
  FAVORITES_UPDATED_EVENT,
  type ChatFavoriteItem,
  type ChatFavoriteType,
} from "@/lib/chat-favorites";
import {
  Bookmark,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Headphones,
  Image as ImageIcon,
  Layers,
  Pause,
  Play,
  Trash2,
  User,
} from "lucide-react";

type Props = {
  onClose: () => void;
};

export function ChatFavoritesPanel({ onClose }: Props) {
  const [favorites, setFavorites] = useState<ChatFavoriteItem[]>([]);
  const [currentTab, setCurrentTab] = useState<"all" | ChatFavoriteType>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setFavorites(loadChatFavorites());
    const handleUpdate = () => setFavorites(loadChatFavorites());
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleUpdate);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (currentTab === "all") return favorites;
    return favorites.filter((f) => f.type === currentTab);
  }, [favorites, currentTab]);

  const toggleFold = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePlayVoice = (item: ChatFavoriteItem) => {
    if (!item.mediaUrl) return;
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(item.mediaUrl);
    audioRef.current = audio;
    setPlayingId(item.id);
    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  const handleDownload = (item: ChatFavoriteItem) => {
    if (!item.mediaUrl) return;
    const a = document.createElement("a");
    a.href = item.mediaUrl;
    const dateStr = item.createdAt.slice(0, 10);
    if (item.type === "image") {
      a.download = `${item.characterName}_生图_${dateStr}.png`;
    } else if (item.type === "voice") {
      a.download = `${item.characterName}_语音_${dateStr}.mp3`;
    } else {
      a.download = `${item.characterName}_素材_${dateStr}`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <PageShell title="我的收藏" onBack={onClose}>
      <div className="flex flex-col h-full bg-[var(--c-page-body-bg,#f3f4f6)]">
        {/* 顶部标签栏 */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--c-panel,#ffffff)] border-b border-[var(--c-panel-border,rgba(0,0,0,0.06))] overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "全部", icon: Bookmark },
            { id: "text", label: "台词", icon: FileText },
            { id: "image", label: "相册", icon: ImageIcon },
            { id: "voice", label: "语音", icon: Headphones },
            { id: "combined", label: "聊天片段", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-[var(--c-text-title,#18181b)] text-white shadow-sm"
                    : "bg-[var(--c-input,#f4f4f5)] text-[var(--c-text,#71717a)]"
                }`}
                onClick={() => setCurrentTab(tab.id as any)}
              >
                <Icon size={13} strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 列表内容区 */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--c-text,#a1a1aa)] gap-3">
              <Bookmark size={36} strokeWidth={1.2} className="opacity-40" />
              <p className="text-xs">暂无收藏内容，长按聊天消息即可收藏</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              const isVoicePlaying = playingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-[var(--c-panel,#ffffff)] rounded-2xl p-3.5 shadow-sm border border-[var(--c-panel-border,rgba(0,0,0,0.06))] flex flex-col gap-2.5 transition-all"
                >
                  {/* 卡片头部：角色信息 + 操作 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.characterAvatar ? (
                        <img
                          src={item.characterAvatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <User size={15} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[var(--c-text-title,#18181b)] leading-tight">
                          {item.characterName}
                        </span>
                        <span className="text-[10px] text-[var(--c-text,#a1a1aa)]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* 下载按钮 */}
                      {item.mediaUrl && (
                        <button
                          type="button"
                          className="p-1.5 text-[var(--c-text,#71717a)] hover:text-blue-600 rounded-lg hover:bg-black/5"
                          onClick={() => handleDownload(item)}
                          title="下载到手机"
                        >
                          <Download size={15} strokeWidth={1.75} />
                        </button>
                      )}
                      {/* 移除按钮 */}
                      <button
                        type="button"
                        className="p-1.5 text-[var(--c-text,#71717a)] hover:text-red-500 rounded-lg hover:bg-black/5"
                        onClick={() => removeChatFavorite(item.id)}
                        title="移除收藏"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* 卡片主体 */}
                  {item.type === "image" && item.mediaUrl && (
                    <div className="relative rounded-xl overflow-hidden bg-black/5 border border-black/5">
                      <img
                        src={item.mediaUrl}
                        alt=""
                        className="w-full max-h-60 object-contain rounded-xl"
                      />
                    </div>
                  )}

                  {item.type === "voice" && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--c-input,#f4f4f5)]">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow"
                          onClick={() => handlePlayVoice(item)}
                        >
                          {isVoicePlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                        </button>
                        <span className="text-xs text-[var(--c-text-title,#18181b)] font-medium">
                          {isVoicePlaying ? "正在播放..." : "角色原声语音"}
                        </span>
                      </div>
                      {item.mediaDuration && (
                        <span className="text-xs text-[var(--c-text,#71717a)]">
                          {Math.round(item.mediaDuration)}s
                        </span>
                      )}
                    </div>
                  )}

                  {/* 文本内容 */}
                  {item.content && item.type !== "image" && (
                    <div className="flex flex-col gap-1">
                      <p
                        className={`text-xs leading-relaxed text-[var(--c-text-title,#27272a)] whitespace-pre-wrap ${
                          !isExpanded && item.content.length > 120 ? "line-clamp-3" : ""
                        }`}
                      >
                        {item.content}
                      </p>
                      {item.content.length > 120 && (
                        <button
                          type="button"
                          className="text-[11px] text-blue-600 font-medium self-start flex items-center gap-0.5 mt-0.5"
                          onClick={() => toggleFold(item.id)}
                        >
                          {isExpanded ? "收起" : "查看全部"}
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 多选合并转发消息组 */}
                  {item.type === "combined" && item.combinedMessages && (
                    <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[var(--c-input,#f4f4f5)] border border-black/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--c-text,#71717a)]">
                          共 {item.combinedMessages.length} 条对话记录
                        </span>
                        <button
                          type="button"
                          className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5"
                          onClick={() => toggleFold(item.id)}
                        >
                          {isExpanded ? "收起" : "展开记录"}
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-black/5 max-h-64 overflow-y-auto">
                          {item.combinedMessages.map((msg, idx) => (
                            <div key={idx} className="flex flex-col text-xs gap-0.5">
                              <span className="font-medium text-[var(--c-text-title,#18181b)]">
                                {msg.senderName}:
                              </span>
                              <span className="text-[var(--c-text,#3f3f46)] pl-2">
                                {msg.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageShell>
  );
}
