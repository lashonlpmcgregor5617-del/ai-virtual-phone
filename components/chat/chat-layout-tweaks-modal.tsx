"use client";

import React, { useState, useEffect } from "react";
import { X, RotateCcw, Sliders, Check } from "lucide-react";
import { Slider } from "@/components/ui/form";
import {
    ChatLayoutTweaks,
    DEFAULT_CHAT_LAYOUT_TWEAKS,
    loadChatLayoutTweaks,
    saveChatLayoutTweaks,
    resetChatLayoutTweaks,
    CHAT_LAYOUT_TWEAKS_UPDATED_EVENT,
} from "@/lib/chat-layout-tweaks";

interface ChatLayoutTweaksModalProps {
    sessionId?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ChatLayoutTweaksModal({ sessionId, isOpen, onClose }: ChatLayoutTweaksModalProps) {
    const [tweaks, setTweaks] = useState<ChatLayoutTweaks>(() => loadChatLayoutTweaks(sessionId));
    const [activeTab, setActiveTab] = useState<"top" | "bottom" | "keyboard">("top");

    useEffect(() => {
        if (!isOpen) return;
        setTweaks(loadChatLayoutTweaks(sessionId));
    }, [isOpen, sessionId]);

    if (!isOpen) return null;

    const handleUpdate = (field: keyof ChatLayoutTweaks, val: number) => {
        const next = { ...tweaks, [field]: val };
        setTweaks(next);
        saveChatLayoutTweaks({ [field]: val }, sessionId);
    };

    const handleReset = () => {
        resetChatLayoutTweaks(sessionId);
        setTweaks({ ...DEFAULT_CHAT_LAYOUT_TWEAKS });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none"
            style={{ animation: "fadeIn 0.15s ease-out" }}
        >
            {/* 半透明遮罩 (点击空白关闭) */}
            <div
                className="absolute inset-0 bg-black/25 pointer-events-auto"
                onClick={onClose}
            />

            {/* 抽屉内容区 */}
            <div
                className="relative z-10 w-full max-h-[82vh] bg-[var(--c-card,#1c1c1e)] border-t border-[var(--c-card-border,rgba(255,255,255,0.12))] rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden text-[var(--c-text,#fff)] backdrop-blur-xl"
                style={{
                    animation: "slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                {/* 顶部标题栏 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--c-card-border,rgba(255,255,255,0.08))]">
                    <div className="flex items-center gap-2">
                        <Sliders size={18} className="text-[var(--c-action-blue,#246bfd)]" />
                        <span className="font-semibold text-[14px]">聊天界面微调</span>
                        <span className="text-[11px] text-[var(--c-icon,#888)]">(实时预览)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-full bg-[var(--c-input,rgba(255,255,255,0.08))] text-[var(--c-icon,#aaa)] hover:text-[var(--c-text,#fff)] active:scale-95 transition-all"
                            title="重置为默认值"
                        >
                            <RotateCcw size={13} />
                            <span>重置</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-full bg-[var(--c-input,rgba(255,255,255,0.08))] text-[var(--c-text,#fff)] active:scale-95 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* 分组 Tab */}
                <div className="flex px-4 pt-2 border-b border-[var(--c-card-border,rgba(255,255,255,0.08))] gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("top")}
                        className={`px-3 py-1.5 text-[13px] font-medium rounded-t-lg transition-colors relative ${
                            activeTab === "top"
                                ? "text-[var(--c-action-blue,#246bfd)] border-b-2 border-[var(--c-action-blue,#246bfd)] font-semibold"
                                : "text-[var(--c-icon,#888)] hover:text-[var(--c-text,#fff)]"
                        }`}
                    >
                        顶栏微调
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("bottom")}
                        className={`px-3 py-1.5 text-[13px] font-medium rounded-t-lg transition-colors relative ${
                            activeTab === "bottom"
                                ? "text-[var(--c-action-blue,#246bfd)] border-b-2 border-[var(--c-action-blue,#246bfd)] font-semibold"
                                : "text-[var(--c-icon,#888)] hover:text-[var(--c-text,#fff)]"
                        }`}
                    >
                        底栏微调
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("keyboard")}
                        className={`px-3 py-1.5 text-[13px] font-medium rounded-t-lg transition-colors relative ${
                            activeTab === "keyboard"
                                ? "text-[var(--c-action-blue,#246bfd)] border-b-2 border-[var(--c-action-blue,#246bfd)] font-semibold"
                                : "text-[var(--c-icon,#888)] hover:text-[var(--c-text,#fff)]"
                        }`}
                    >
                        键盘与面板
                    </button>
                </div>

                {/* 滑块调节面板 */}
                <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[50vh]">
                    {activeTab === "top" && (
                        <div className="flex flex-col gap-3">
                            <Slider
                                label="顶部安全区偏移"
                                value={tweaks.topOffset}
                                displayValue={`${tweaks.topOffset > 0 ? "+" : ""}${tweaks.topOffset}px`}
                                min={-30}
                                max={50}
                                step={1}
                                hint="调节顶栏距离屏幕顶部的距离，解决异形屏遮挡或留白过大"
                                onChange={(e) => handleUpdate("topOffset", Number(e.target.value))}
                            />
                            <Slider
                                label="顶栏高度增减"
                                value={tweaks.headerHeightDelta}
                                displayValue={`${tweaks.headerHeightDelta > 0 ? "+" : ""}${tweaks.headerHeightDelta}px`}
                                min={-20}
                                max={30}
                                step={1}
                                hint="调整顶栏本体的上下高度厚度"
                                onChange={(e) => handleUpdate("headerHeightDelta", Number(e.target.value))}
                            />
                            <Slider
                                label="标题与按键上下居中微调"
                                value={tweaks.titleOffsetY}
                                displayValue={`${tweaks.titleOffsetY > 0 ? "+" : ""}${tweaks.titleOffsetY}px`}
                                min={-15}
                                max={15}
                                step={1}
                                hint="微调返回键、角色昵称、右上角图标的垂直位置"
                                onChange={(e) => handleUpdate("titleOffsetY", Number(e.target.value))}
                            />
                        </div>
                    )}

                    {activeTab === "bottom" && (
                        <div className="flex flex-col gap-3">
                            <Slider
                                label="输入栏底部抬升高度"
                                value={tweaks.bottomLift}
                                displayValue={`${tweaks.bottomLift}px`}
                                min={0}
                                max={80}
                                step={1}
                                hint="向上抬高整个输入栏，彻底解决输入框沉底或被小白条遮挡"
                                onChange={(e) => handleUpdate("bottomLift", Number(e.target.value))}
                            />
                            <Slider
                                label="输入栏两侧边距"
                                value={tweaks.inputPaddingX}
                                displayValue={`${tweaks.inputPaddingX > 0 ? "+" : ""}${tweaks.inputPaddingX}px`}
                                min={-10}
                                max={20}
                                step={1}
                                hint="微调输入框距离屏幕左右两侧的间隙"
                                onChange={(e) => handleUpdate("inputPaddingX", Number(e.target.value))}
                            />
                        </div>
                    )}

                    {activeTab === "keyboard" && (
                        <div className="flex flex-col gap-3">
                            <Slider
                                label="表情 / 扩展面板高度"
                                value={tweaks.panelHeightDelta}
                                displayValue={`${tweaks.panelHeightDelta > 0 ? "+" : ""}${tweaks.panelHeightDelta}px`}
                                min={-80}
                                max={120}
                                step={2}
                                hint="调节展开表情包、照片加号菜单时的面板展开高度"
                                onChange={(e) => handleUpdate("panelHeightDelta", Number(e.target.value))}
                            />
                            <Slider
                                label="键盘弹起吸附间隙"
                                value={tweaks.keyboardOffset}
                                displayValue={`${tweaks.keyboardOffset > 0 ? "+" : ""}${tweaks.keyboardOffset}px`}
                                min={-30}
                                max={50}
                                step={1}
                                hint="微调手机软键盘弹起时输入框与键盘顶部的贴合距离"
                                onChange={(e) => handleUpdate("keyboardOffset", Number(e.target.value))}
                            />
                        </div>
                    )}
                </div>

                {/* 底部完成按钮 */}
                <div className="px-4 py-3 border-t border-[var(--c-card-border,rgba(255,255,255,0.08))] flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-1 px-5 py-2 rounded-full bg-[var(--c-action-blue,#246bfd)] text-white text-[13px] font-medium active:scale-95 transition-all shadow-md"
                    >
                        <Check size={16} />
                        <span>完成</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
