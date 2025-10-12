import { useCallback, useEffect, useMemo, useState } from 'react';

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetId: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
};

export type TutorialOverlayProps = {
  steps: TutorialStep[];
  onClose: () => void;
  variantLabel: string;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const DEFAULT_PADDING = 16;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function getSpotlightRect(target: HTMLElement | null, padding: number): SpotlightRect | null {
  if (!target) {
    return null;
  }
  const rect = target.getBoundingClientRect();
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

function useSpotlight(step: TutorialStep | undefined) {
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const updateSpotlight = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!step) {
      setSpotlight(null);
      return;
    }
    const padding = step.spotlightPadding ?? DEFAULT_PADDING;
    const target = document.querySelector<HTMLElement>(
      `[data-tutorial-target="${step.targetId}"]`
    );
    setSpotlight(getSpotlightRect(target, padding));
  }, [step]);

  useEffect(() => {
    updateSpotlight();
  }, [updateSpotlight]);

  useEffect(() => {
    if (typeof window === 'undefined' || !step) {
      return;
    }
    const padding = step.spotlightPadding ?? DEFAULT_PADDING;
    const target = document.querySelector<HTMLElement>(
      `[data-tutorial-target="${step.targetId}"]`
    );
    if (!target || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      setSpotlight(getSpotlightRect(target, padding));
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (typeof window === 'undefined' || !step) {
      return;
    }
    const handle = () => updateSpotlight();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, { passive: true });
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle);
    };
  }, [step, updateSpotlight]);

  return spotlight;
}

function TutorialOverlay({ steps, onClose, variantLabel }: TutorialOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const spotlight = useSpotlight(step);
  const totalSteps = steps.length;

  useEffect(() => {
    setStepIndex(0);
  }, [steps]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setStepIndex((index) => Math.min(index + 1, totalSteps - 1));
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setStepIndex((index) => Math.max(index - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, totalSteps]);

  const spotlightSegments = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!spotlight) {
      return {
        top: { height: viewportHeight, width: viewportWidth, top: 0, left: 0 },
        bottom: null,
        left: null,
        right: null
      };
    }

    const topHeight = Math.max(0, spotlight.top);
    const bottomTop = spotlight.top + spotlight.height;
    const bottomHeight = Math.max(0, viewportHeight - bottomTop);
    const leftWidth = Math.max(0, spotlight.left);
    const rightLeft = spotlight.left + spotlight.width;
    const rightWidth = Math.max(0, viewportWidth - rightLeft);

    return {
      top: { height: topHeight, width: viewportWidth, top: 0, left: 0 },
      bottom: bottomHeight
        ? { height: bottomHeight, width: viewportWidth, top: bottomTop, left: 0 }
        : null,
      left: leftWidth
        ? { height: spotlight.height, width: leftWidth, top: spotlight.top, left: 0 }
        : null,
      right: rightWidth
        ? { height: spotlight.height, width: rightWidth, top: spotlight.top, left: rightLeft }
        : null
    };
  }, [spotlight]);

  const calloutStyle = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      } as const;
    }
    if (!spotlight) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      } as const;
    }
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = spotlight.left + spotlight.width / 2;
    const centerY = spotlight.top + spotlight.height / 2;

    switch (step?.placement) {
      case 'top': {
        const top = clamp(spotlight.top - margin, 16, viewportHeight - 16);
        const left = clamp(centerX, 180, viewportWidth - 180);
        return { top: `${top}px`, left: `${left}px`, transform: 'translate(-50%, -100%)' } as const;
      }
      case 'left': {
        const top = clamp(centerY, 120, viewportHeight - 120);
        const left = clamp(spotlight.left - margin, 16, viewportWidth - 16);
        return { top: `${top}px`, left: `${left}px`, transform: 'translate(-100%, -50%)' } as const;
      }
      case 'right': {
        const top = clamp(centerY, 120, viewportHeight - 120);
        const left = clamp(spotlight.left + spotlight.width + margin, 16, viewportWidth - 16);
        return { top: `${top}px`, left: `${left}px`, transform: 'translate(0, -50%)' } as const;
      }
      case 'bottom':
      default: {
        const top = clamp(spotlight.top + spotlight.height + margin, 16, viewportHeight - 16);
        const left = clamp(centerX, 180, viewportWidth - 180);
        return { top: `${top}px`, left: `${left}px`, transform: 'translate(-50%, 0)' } as const;
      }
    }
  }, [spotlight, step?.placement]);

  if (!step) {
    return null;
  }

  const handleNext = () => {
    setStepIndex((index) => {
      if (index >= totalSteps - 1) {
        onClose();
        return index;
      }
      return Math.min(index + 1, totalSteps - 1);
    });
  };

  const handlePrevious = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label={`${variantLabel} tutorial`}>
      <div className="tutorial-overlay-layer" aria-hidden="true">
        {spotlightSegments?.top && (
          <div
            className="tutorial-scrim"
            style={{
              top: `${spotlightSegments.top.top}px`,
              left: `${spotlightSegments.top.left}px`,
              width: `${spotlightSegments.top.width}px`,
              height: `${spotlightSegments.top.height}px`
            }}
          />
        )}
        {spotlightSegments?.bottom && (
          <div
            className="tutorial-scrim"
            style={{
              top: `${spotlightSegments.bottom.top}px`,
              left: `${spotlightSegments.bottom.left}px`,
              width: `${spotlightSegments.bottom.width}px`,
              height: `${spotlightSegments.bottom.height}px`
            }}
          />
        )}
        {spotlightSegments?.left && (
          <div
            className="tutorial-scrim"
            style={{
              top: `${spotlightSegments.left.top}px`,
              left: `${spotlightSegments.left.left}px`,
              width: `${spotlightSegments.left.width}px`,
              height: `${spotlightSegments.left.height}px`
            }}
          />
        )}
        {spotlightSegments?.right && (
          <div
            className="tutorial-scrim"
            style={{
              top: `${spotlightSegments.right.top}px`,
              left: `${spotlightSegments.right.left}px`,
              width: `${spotlightSegments.right.width}px`,
              height: `${spotlightSegments.right.height}px`
            }}
          />
        )}
        {spotlight && (
          <div
            className="tutorial-spotlight"
            style={{
              top: `${spotlight.top}px`,
              left: `${spotlight.left}px`,
              width: `${spotlight.width}px`,
              height: `${spotlight.height}px`
            }}
          />
        )}
      </div>
      <div className="tutorial-callout" style={calloutStyle}>
        <div className="tutorial-step-label">
          Step {stepIndex + 1} of {totalSteps}
        </div>
        <h2 className="tutorial-step-title">{step.title}</h2>
        <p className="tutorial-step-description">{step.description}</p>
        <div className="tutorial-actions">
          <button type="button" className="ghost" onClick={onClose}>
            End tutorial
          </button>
          <div className="tutorial-progress-buttons">
            <button type="button" className="secondary" onClick={handlePrevious} disabled={stepIndex === 0}>
              Back
            </button>
            <button type="button" className="primary" onClick={handleNext}>
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
