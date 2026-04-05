"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface TourContextType {
  isTourOpen: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  hasSeenTour: boolean;
  resetTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export const TOUR_STEPS = [
  {
    target: "[data-tour='daily-summary']",
    title: "Daily Summary",
    content: "This card shows your progress for today. Complete tasks and habits to fill up your progress bar!",
    placement: "bottom" as const,
  },
  {
    target: "[data-tour='goals']",
    title: "Yearly Goals",
    content: "Set big picture goals for the year. Break them down into monthly and weekly targets.",
    placement: "bottom" as const,
  },
  {
    target: "[data-tour='habits']",
    title: "Habits",
    content: "Build lasting habits by tracking them daily. Streaks show your consistency!",
    placement: "right" as const,
  },
  {
    target: "[data-tour='tasks']",
    title: "Tasks",
    content: "Break down your goals into actionable tasks. Mark them complete when done.",
    placement: "right" as const,
  },
  {
    target: "[data-tour='focus']",
    title: "Focus Timer",
    content: "Use the Pomodoro timer to stay focused. Track your deep work sessions!",
    placement: "left" as const,
  },
  {
    target: "[data-tour='journal']",
    title: "Journal",
    content: "Reflect on your day, track your mood, and connect entries with your tasks.",
    placement: "left" as const,
  },
  {
    target: "[data-tour='partners']",
    title: "Accountability Partners",
    content: "Connect with friends to see each other's progress. Share invite links to team up!",
    placement: "left" as const,
  },
  {
    target: "[data-tour='analytics']",
    title: "Analytics",
    content: "View detailed insights about your productivity patterns and trends.",
    placement: "left" as const,
  },
  {
    target: "[data-tour='calendar']",
    title: "Calendar",
    content: "See all your tasks, habits, and time blocks in a calendar view.",
    placement: "left" as const,
  },
];

export function TourProvider({ children }: { children: ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const seen = localStorage.getItem("planflow_tour_seen");
    setHasSeenTour(!!seen);
    if (!seen) {
      setIsTourOpen(true);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setIsTourOpen(true);
  };

  const endTour = () => {
    setIsTourOpen(false);
    localStorage.setItem("planflow_tour_seen", "true");
    setHasSeenTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem("planflow_tour_seen");
    setHasSeenTour(false);
    setIsTourOpen(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <TourContext.Provider
      value={{
        isTourOpen,
        currentStep,
        startTour,
        endTour,
        nextStep,
        prevStep,
        setStep: setCurrentStep,
        hasSeenTour,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
