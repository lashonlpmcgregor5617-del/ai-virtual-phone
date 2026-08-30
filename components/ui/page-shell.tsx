"use client";

import { useRef, type ReactNode, type Ref } from "react";
import { ChevronLeft } from "lucide-react";

type PageShellProps = {
  title?: ReactNode;
  onBack?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyRef?: Ref<HTMLDivElement>;
};

export function PageShell({ title = "", onBack, leftAction, rightAction, children, footer, className, bodyRef }: PageShellProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  return (
    <div
      className={`page-shell ${className ?? ""}`}
      onTouchStart={(e) => {
        if (!onBack) return;
        const touch = e.touches[0];
        if (!touch) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const relX = touch.clientX - rect.left;
        // 扩展边缘触发区域至 80px，更容易滑出返回手势
        if (relX <= 80) {
          touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        } else {
          touchStartRef.current = null;
        }
      }}
      onTouchEnd={(e) => {
        if (!onBack || !touchStartRef.current) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        const dt = Date.now() - touchStartRef.current.time;
        touchStartRef.current = null;
        // 右滑（从左往右滑动）返回手势：水平位移 > 35px，纵向偏角合理
        if (dx > 35 && dy < Math.max(55, dx * 0.9) && dt < 800) {
          onBack();
        }
      }}
    >
      <header className="page-header" data-ui="header">
        <div className="page-header-safe-area" />
        <div className="page-header-content">
          {onBack ? (
            <button className="page-back-btn" type="button" onClick={onBack} aria-label="返回">
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
          ) : leftAction ? (
            <span>{leftAction}</span>
          ) : (
            <span style={{ width: 40 }} />
          )}
          <span className="page-title">{title}</span>
          <span className="page-header-right">{rightAction ?? <span style={{ width: 40 }} />}</span>
        </div>
      </header>
      <div ref={bodyRef} className="page-body" data-ui="body">
        {children}
      </div>
      {footer}
    </div>
  );
}

/**
 * Floating overlay header for canvas-style pages (e.g. character page).
 * Uses absolute positioning + pointer-events-none so the canvas beneath
 * remains interactive. The back button uses pointer-events-auto.
 */
type PageOverlayHeaderProps = {
  title: ReactNode;
  onBack: () => void;
  rightAction?: ReactNode;
  className?: string;
};

export function PageOverlayHeader({ title, onBack, rightAction, className }: PageOverlayHeaderProps) {
  return (
    <header className={`page-header pointer-events-none absolute top-0 left-0 right-0 z-10 ${className ?? ""}`}>
      <div className="page-header-safe-area" />
      <div className="page-header-content">
        <button className="page-back-btn pointer-events-auto" type="button" onClick={onBack} aria-label="返回">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <span className="page-title">{title}</span>
        <span className="page-header-right pointer-events-auto">{rightAction ?? <span style={{ width: 40 }} />}</span>
      </div>
    </header>
  );
}
