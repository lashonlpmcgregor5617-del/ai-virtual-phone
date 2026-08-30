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

    // 点击事件（非拖拽）：执行逐级返回
    if (dt < 400) {
      // 1. 尝试找到当前页面顶层的返回按钮并模拟点击（如聊天室返回、子设置返回等）
      const backButtons = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.page-back-btn, [aria-label="返回"], button.chat-room-back-btn, .header-back, .ui-back-btn'
        )
      );

      // 找一个可见的返回按钮
      const visibleBackBtn = backButtons.reverse().find((btn) => {
        const style = window.getComputedStyle(btn);
        return style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null;
      });

      if (visibleBackBtn) {
        visibleBackBtn.click();
      } else {
        // 2. 如果没有子级返回按钮，则退出当前应用返回桌面
        onCloseApp();
      }
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
