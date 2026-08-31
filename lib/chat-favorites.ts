"use client";

import { kvGet, kvSet } from "@/lib/kv-db";

export type ChatFavoriteType = "text" | "image" | "voice" | "combined";

export type ChatFavoriteItem = {
  id: string;
  type: ChatFavoriteType;
  characterId?: string;
  characterName: string;
  characterAvatar?: string;
  content: string;
  mediaUrl?: string;
  mediaDuration?: number;
  createdAt: string;
  originalMessageId?: string;
  originalSessionId?: string;
  combinedMessages?: Array<{
    senderName: string;
    avatar?: string;
    role: "user" | "assistant";
    content: string;
    mediaType?: string;
    mediaUrl?: string;
  }>;
};

const FAVORITES_STORAGE_KEY = "chat_favorites_items_v1";
export const FAVORITES_UPDATED_EVENT = "chat-favorites-updated";

export function loadChatFavorites(): ChatFavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = kvGet(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load chat favorites", e);
    return [];
  }
}

export function saveChatFavorites(items: ChatFavoriteItem[]): void {
  if (typeof window === "undefined") return;
  try {
    kvSet(FAVORITES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: { count: items.length } }));
  } catch (e) {
    console.error("Failed to save chat favorites", e);
  }
}

export function addChatFavorite(item: Omit<ChatFavoriteItem, "id" | "createdAt">): ChatFavoriteItem {
  const all = loadChatFavorites();
  const newItem: ChatFavoriteItem = {
    ...item,
    id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  saveChatFavorites([newItem, ...all]);
  return newItem;
}

export function removeChatFavorite(id: string): void {
  const all = loadChatFavorites();
  saveChatFavorites(all.filter(item => item.id !== id));
}
