import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"
import { TOUR_STEPS } from "../../lib/tourSteps"

interface TourContextValue {
  active: boolean
  stepIndex: number
  start: () => void
  next: () => void
  prev: () => void
  stop: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const value: TourContextValue = {
    active,
    stepIndex,
    start: () => {
      setStepIndex(0)
      setActive(true)
    },
    next: () => setStepIndex((i) => Math.min(TOUR_STEPS.length - 1, i + 1)),
    prev: () => setStepIndex((i) => Math.max(0, i - 1)),
    stop: () => setActive(false),
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error("useTour must be used within TourProvider")
  return ctx
}
