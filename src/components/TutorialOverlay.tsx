import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import '../styles/TutorialOverlay.css';

export type TutorialStep = {
  id: string;
  targetId: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  padding?: number;
};

type TutorialOverlayProps = {
  steps: TutorialStep[];
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
};

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function TutorialOverlay({ steps, stepIndex, onNext, onPrev, onClose }: TutorialOverlayProps) {
  const step = steps[stepIndex];
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }));
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);

  const padding = step?.padding ?? 16;

  useIsomorphicLayoutEffect(() => {
    if (!step || typeof window === 'undefined') {
      return;
    }

    let frame = 0;

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(`[data-tutorial-id="${step.targetId}"]`);
      const rect = target?.getBoundingClientRect();

      setHighlightRect(() => {
        if (!rect) {
          return null;
        }
        return {
          top: Math.max(0, rect.top - padding),
          left: Math.max(0, rect.left - padding),
          width: rect.width + padding * 2,
          height: rect.height + padding * 2
        };
      });
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateRect);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [step, padding]);

  useEffect(() => {
    if (nextButtonRef.current) {
      nextButtonRef.current.focus();
    }
  }, [stepIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (stepIndex === steps.length - 1) {
          onClose();
        } else {
          onNext();
        }
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (stepIndex > 0) {
          onPrev();
        }
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (stepIndex === steps.length - 1) {
          onClose();
        } else {
          onNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNext, onPrev, stepIndex, steps.length]);

  const fallbackRect: HighlightRect = useMemo(() => {
    const width = viewport.width || 320;
    const height = viewport.height || 320;
    return {
      top: height * 0.2,
      left: width * 0.1,
      width: width * 0.8,
      height: height * 0.6
    };
  }, [viewport.height, viewport.width]);

  const activeRect = highlightRect ?? fallbackRect;
  const topBound = Math.max(0, Math.min(activeRect.top, viewport.height));
  const leftBound = Math.max(0, Math.min(activeRect.left, viewport.width));
  const highlightWidth = Math.min(activeRect.width, Math.max(0, viewport.width - leftBound));
  const highlightHeight = Math.min(activeRect.height, Math.max(0, viewport.height - topBound));

  const highlightStyle: CSSProperties = {
    top: topBound,
    left: leftBound,
    width: highlightWidth,
    height: highlightHeight
  };

  const topOverlayStyle: CSSProperties = {
    top: 0,
    left: 0,
    right: 0,
    height: Math.max(0, topBound)
  };

  const bottomOverlayStyle: CSSProperties = {
    top: topBound + highlightHeight,
    left: 0,
    right: 0,
    bottom: 0
  };

  const leftOverlayStyle: CSSProperties = {
    top: topBound,
    left: 0,
    width: Math.max(0, leftBound),
    height: highlightHeight
  };

  const rightOverlayStyle: CSSProperties = {
    top: topBound,
    left: leftBound + highlightWidth,
    right: 0,
    height: highlightHeight
  };

  const placement = step?.placement ?? 'bottom';

  const clamp = (value: number, min: number, max: number) => {
    if (Number.isNaN(value)) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  };

  const tooltipOffset = 24;
  const tooltipBase: { top: number; left: number; transform: string } = (() => {
    const maxLeft = Math.max(tooltipOffset, viewport.width - tooltipOffset);
    switch (placement) {
      case 'top': {
        const top = clamp(topBound - tooltipOffset, tooltipOffset, viewport.height - tooltipOffset);
        const left = clamp(leftBound + highlightWidth / 2, tooltipOffset, viewport.width - tooltipOffset);
        return { top, left, transform: 'translate(-50%, -100%)' };
      }
      case 'left': {
        const top = clamp(topBound + highlightHeight / 2, tooltipOffset, viewport.height - tooltipOffset);
        const left = clamp(leftBound - tooltipOffset, tooltipOffset, maxLeft);
        return { top, left, transform: 'translate(-100%, -50%)' };
      }
      case 'right': {
        const top = clamp(topBound + highlightHeight / 2, tooltipOffset, viewport.height - tooltipOffset);
        const left = clamp(leftBound + highlightWidth + tooltipOffset, tooltipOffset, viewport.width - tooltipOffset);
        return { top, left, transform: 'translate(0, -50%)' };
      }
      case 'bottom':
      default: {
        const top = clamp(topBound + highlightHeight + tooltipOffset, tooltipOffset, viewport.height - tooltipOffset);
        const left = clamp(leftBound + highlightWidth / 2, tooltipOffset, viewport.width - tooltipOffset);
        return { top, left, transform: 'translate(-50%, 0)' };
      }
    }
  })();

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Shut the Box tutorial">
      <div className="tutorial-shroud" style={topOverlayStyle} aria-hidden="true" />
      <div className="tutorial-shroud" style={bottomOverlayStyle} aria-hidden="true" />
      <div className="tutorial-shroud" style={leftOverlayStyle} aria-hidden="true" />
      <div className="tutorial-shroud" style={rightOverlayStyle} aria-hidden="true" />
      <div className="tutorial-highlight" style={highlightStyle} aria-hidden="true" />
      {step ? (
        <div
          className={`tutorial-tooltip placement-${placement}`}
          style={{ top: tooltipBase.top, left: tooltipBase.left, transform: tooltipBase.transform }}
        >
          <div className="tutorial-meta">Step {stepIndex + 1} of {steps.length}</div>
          <h2 className="tutorial-title">{step.title}</h2>
          <p className="tutorial-description">{step.description}</p>
          <div className="tutorial-actions">
            <button type="button" className="ghost" onClick={onClose}>
              End tutorial
            </button>
            <div className="tutorial-spacer" />
            <button type="button" className="secondary" onClick={onPrev} disabled={stepIndex === 0}>
              Back
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (stepIndex === steps.length - 1) {
                  onClose();
                } else {
                  onNext();
                }
              }}
              ref={nextButtonRef}
            >
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TutorialOverlay;
