// lib/chat-layout-tweaks.ts
// 聊天界面精准微调配置：顶栏、底栏、键盘/面板
import { kvGet, kvSet, registerKvMigration } from "./kv-db";

export interface ChatLayoutTweaks {
    // 1. 顶栏微调
    topOffset: number;         // 顶部安全区偏移 (-30px ~ 50px, 默认 0)
    headerHeightDelta: number; // 顶栏高度增减 (-20px ~ 30px, 默认 0)
    titleOffsetY: number;      // 标题/返回键垂直微调 (-15px ~ 15px, 默认 0)

    // 2. 底栏微调
    bottomLift: number;        // 输入栏底部抬升高度 (0px ~ 80px, 默认 0)
    inputPaddingX: number;     // 输入栏两侧留白增减 (-10px ~ 20px, 默认 0)

    // 3. 键盘与扩展面板微调
    panelHeightDelta: number;  // 表情/扩展加号面板高度增减 (-80px ~ 120px, 默认 0)
    keyboardOffset: number;    // 键盘弹起间距微调 (-30px ~ 50px, 默认 0)
}

export const DEFAULT_CHAT_LAYOUT_TWEAKS: ChatLayoutTweaks = {
    topOffset: 0,
    headerHeightDelta: 0,
    titleOffsetY: 0,
    bottomLift: 0,
    inputPaddingX: 0,
    panelHeightDelta: 0,
    keyboardOffset: 0,
};

const STORAGE_KEY = "ai_phone_chat_layout_tweaks_v1";
export const CHAT_LAYOUT_TWEAKS_UPDATED_EVENT = "chat-layout-tweaks-updated";

registerKvMigration(STORAGE_KEY);

export function loadChatLayoutTweaks(sessionId?: string): ChatLayoutTweaks {
    try {
        const raw = kvGet(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_CHAT_LAYOUT_TWEAKS };
        const parsed = JSON.parse(raw);
        // 如果有单 session 覆盖配置（可选扩展），优先读取 session 专属，否则全局
        if (sessionId && parsed.sessions && parsed.sessions[sessionId]) {
            return { ...DEFAULT_CHAT_LAYOUT_TWEAKS, ...parsed.global, ...parsed.sessions[sessionId] };
        }
        return { ...DEFAULT_CHAT_LAYOUT_TWEAKS, ...(parsed.global || parsed) };
    } catch {
        return { ...DEFAULT_CHAT_LAYOUT_TWEAKS };
    }
}

export function saveChatLayoutTweaks(tweaks: Partial<ChatLayoutTweaks>, sessionId?: string): void {
    try {
        const raw = kvGet(STORAGE_KEY);
        let store: { global?: ChatLayoutTweaks; sessions?: Record<string, Partial<ChatLayoutTweaks>> } = {};
        if (raw) {
            try {
                const p = JSON.parse(raw);
                if (p.global || p.sessions) {
                    store = p;
                } else {
                    store = { global: p };
                }
            } catch {
                store = {};
            }
        }
        if (!store.global) store.global = { ...DEFAULT_CHAT_LAYOUT_TWEAKS };

        if (sessionId) {
            if (!store.sessions) store.sessions = {};
            store.sessions[sessionId] = { ...(store.sessions[sessionId] || {}), ...tweaks };
        } else {
            store.global = { ...store.global, ...tweaks };
        }

        kvSet(STORAGE_KEY, JSON.stringify(store));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(CHAT_LAYOUT_TWEAKS_UPDATED_EVENT));
        }
    } catch (e) {
        console.error("Failed to save chat layout tweaks:", e);
    }
}

export function resetChatLayoutTweaks(sessionId?: string): void {
    if (sessionId) {
        try {
            const raw = kvGet(STORAGE_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                if (p.sessions && p.sessions[sessionId]) {
                    delete p.sessions[sessionId];
                    kvSet(STORAGE_KEY, JSON.stringify(p));
                }
            }
        } catch { /* ignore */ }
    } else {
        kvSet(STORAGE_KEY, JSON.stringify({ global: { ...DEFAULT_CHAT_LAYOUT_TWEAKS } }));
    }
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CHAT_LAYOUT_TWEAKS_UPDATED_EVENT));
    }
}
