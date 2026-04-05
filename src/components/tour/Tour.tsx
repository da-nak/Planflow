"use client";

import { useEffect, useState, useRef } from "react";
import { useTour, TOUR_STEPS } from "@/lib/tour/TourContext";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

export function Tour() {
  const { isTourOpen, currentStep, nextStep, prevStep, endTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTourOpen) return;

    const step = TOUR_STEPS[currentStep];
    const findTarget = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        setPosition(step.placement);
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    window.addEventListener("resize", findTarget);
    return () => window.removeEventListener("resize", findTarget);
  }, [isTourOpen, currentStep]);

  if (!isTourOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const getTooltipStyle = () => {
    if (!targetRect || !tooltipRef.current) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 16;
    const offset = 8;

    let style: React.CSSProperties = {};

    switch (position) {
      case "bottom":
        style = {
          top: targetRect.bottom + offset,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
        break;
      case "top":
        style = {
          top: targetRect.top - tooltipRect.height - offset,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
        break;
      case "left":
        style = {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - tooltipRect.width - offset,
          transform: "translateY(-50%)",
        };
        break;
      case "right":
        style = {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + offset,
          transform: "translateY(-50%)",
        };
        break;
    }

    if (style.top !== undefined) {
      style.top = Math.max(padding, Math.min(style.top as number, window.innerHeight - tooltipRect.height - padding));
    }
    if (style.left !== undefined) {
      style.left = Math.max(padding, Math.min(style.left as number, window.innerWidth - tooltipRect.width - padding));
    }

    return style;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={endTour}
      />

      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: "8px",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 1), 0 0 20px rgba(59, 130, 246, 0.3)",
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className="fixed z-50 w-80 bg-background-secondary border border-border rounded-xl shadow-2xl p-4"
        style={getTooltipStyle()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{step.title}</h3>
          </div>
          <button
            onClick={endTour}
            className="p-1 rounded hover:bg-background-tertiary transition-colors"
          >
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <p className="text-sm text-foreground-secondary mb-4">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-background-tertiary transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors flex items-center gap-1"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function TourTrigger() {
  const { startTour, hasSeenTour } = useTour();

  if (hasSeenTour) {
    return (
      <button
        onClick={startTour}
        className="fixed bottom-4 right-4 z-30 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover transition-colors"
        title="Take the tour"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    );
  }

  return null;
}
