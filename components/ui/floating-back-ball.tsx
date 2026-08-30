"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";

/**
 * 悬浮虚拟返回键 (Floating Back Button)
 * - 只有在打开应用或进入子页面时才显示；
 * - 尺寸小巧 (~42px 类似 AssistiveTouch)；
 * - 支持在屏幕内自由拖动，长按/拖拽后吸附；
 * - 点击触发历史返回：优先触发当前页面的返回按钮/手势，次之退出当前应用。
 */
export function FloatingBackBall({
  activeApp,
  onCloseApp,
}: {
  activeApp: string | null;
  onCloseApp: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("float_back_ball_pos");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* ignore */
        }
      }
    }
    return { x: 16, y: 160 };
  });

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number; posX: number; posY: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragStartPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pos.x,
      posY: pos.y,
      time: Date.now(),
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartPosRef.current) return;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    if (!isDraggingRef.current && Math.hypot(dx, dy) > 8) {
      isDraggingRef.current = true;
    }
    if (isDraggingRef.current) {
      const nextX = Math.max(8, Math.min(window.innerWidth - 50, dragStartPosRef.current.posX + dx));
      const nextY = Math.max(48, Math.min(window.innerHeight - 80, dragStartPosRef.current.posY + dy));
      setPos({ x: nextX, y: nextY });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStartPosRef.current) return;
    const dt = Date.now() - dragStartPosRef.current.time;
    const wasDragging = isDraggingRef.current;
    dragStartPosRef.current = null;
    isDraggingRef.current = false;

    if (wasDragging) {
      // 拖拽结束：保存位置
      setPos((current) => {
        try {
          localStorage.setItem("float_back_ball_pos", JSON.stringify(current));
        } catch {
          /* ignore */
        }
        return current;
      });
      return;
    }

    // 点击事件（非拖拽）：执行系统级的精准逐级返回
    if (dt < 400) {
      // 1. 优先关闭顶层弹窗/遮罩层 (Modal / Dialog / Drawer / Settings)
      // 包含：界面微调抽屉、聊天设置层 (.chat-settings-layer)、各类全屏设置或弹窗返回按钮
      const visibleModalClose = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.chat-settings-layer .page-back-btn, .modal-close, .dialog-close, [data-modal-close="true"], .modal-overlay button.ui-btn-ghost'
        )
      ).reverse().find(btn => {
        const s = window.getComputedStyle(btn);
        return s.display !== "none" && s.visibility !== "hidden" && btn.offsetParent !== null;
      });

      if (visibleModalClose) {
        visibleModalClose.click();
        return;
      }

      // 2. 如果处于角色聊天室房间（.chat-room-layer 可见的层），精准触发房间顶部的返回按钮
      const activeChatRoom = Array.from(
        document.querySelectorAll<HTMLElement>('.chat-room-layer')
      ).find(layer => {
        const s = window.getComputedStyle(layer);
        return s.display !== "none" && s.visibility !== "hidden" && layer.offsetParent !== null;
      });

      if (activeChatRoom) {
        const roomBackBtn = activeChatRoom.querySelector<HTMLElement>(
          'header .page-back-btn[aria-label="返回"], .page-back-btn'
        );
        if (roomBackBtn) {
          roomBackBtn.click();
          return;
        }
      }

      // 3. 针对子页面容器内部真实的返回按钮（必须带有明确返回语义，且位于 header 内）
      const specificBackBtns = Array.from(
        document.querySelectorAll<HTMLElement>(
          'header .page-back-btn[aria-label="返回"], button[aria-label="返回"]'
        )
      ).reverse().find(btn => {
        // 排除掉右上角的加号按钮（加号按钮带有其他图标，不作为返回按钮）
        const s = window.getComputedStyle(btn);
        return s.display !== "none" && s.visibility !== "hidden" && btn.offsetParent !== null;
      });

      if (specificBackBtns) {
        specificBackBtns.click();
        return;
      }

      // 4. 兜底：退出当前 App 返回桌面
      onCloseApp();
    }
  }, [onCloseApp]);

  // 全局始终展示（所有页面包括主桌面、聊天、查手机等全部常驻）

  return (
    <div
      className="floating-back-ball"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="返回上一级"
    >
      <ChevronLeft size={22} strokeWidth={2.4} />
    </div>
  );
}
