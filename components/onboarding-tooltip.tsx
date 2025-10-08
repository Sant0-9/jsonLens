"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, X, ChevronRight, ChevronLeft } from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  target: string
  position: "top" | "bottom" | "left" | "right"
  action?: {
    label: string
    onClick: () => void
  }
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to JSONLens!",
    description: "This is your command palette. Press Cmd+K anytime to access all features quickly.",
    target: "[data-command-palette]",
    position: "bottom"
  },
  {
    id: "import-data",
    title: "Import JSON Data",
    description: "Drag and drop a JSON file here, paste JSON text, or use the file picker to get started.",
    target: "[data-import-area]",
    position: "top"
  },
  {
    id: "view-switcher",
    title: "Switch Views",
    description: "Use these buttons to switch between different ways of viewing your JSON data.",
    target: "[data-view-switcher]",
    position: "bottom"
  },
  {
    id: "status-bar",
    title: "Status Information",
    description: "The status bar shows information about your current dataset and any errors.",
    target: "[data-status-bar]",
    position: "top"
  }
]

export function OnboardingTooltip() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem("jsonlens-onboarding-completed")
    if (completed === "true") {
      setIsCompleted(true)
    }
  }, [])

  useEffect(() => {
    // Auto-start onboarding after a short delay if not completed
    if (!isCompleted && !isActive) {
      const timer = setTimeout(() => {
        // Check if the first step's target element exists before starting
        const firstTarget = document.querySelector(onboardingSteps[0].target)
        if (firstTarget) {
          setIsActive(true)
        } else {
          // If first element doesn't exist, skip onboarding entirely
          handleComplete()
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, isActive])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsActive(false)
    setIsCompleted(true)
    localStorage.setItem("jsonlens-onboarding-completed", "true")
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsActive(true)
    setIsCompleted(false)
    localStorage.removeItem("jsonlens-onboarding-completed")
  }

  const currentStepData = onboardingSteps[currentStep]
  const targetElement = typeof window !== 'undefined'
    ? document.querySelector(currentStepData.target)
    : null

  // If target element is missing, advance safely after paint to avoid render-loop
  useEffect(() => {
    if (!isActive) return
    if (targetElement) return
    
    // Add a longer delay and check multiple times before advancing
    const checkElement = () => {
      const element = document.querySelector(currentStepData.target)
      if (element) return
      
      // If still no element after multiple checks, advance
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep((s) => s + 1)
      } else {
        handleComplete()
      }
    }
    
    // Check immediately, then after 100ms, then after 500ms
    const timeout1 = setTimeout(checkElement, 100)
    const timeout2 = setTimeout(checkElement, 500)
    
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [isActive, targetElement, currentStep, currentStepData.target])

  if (isCompleted || !isActive) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRestart}
                className="h-10 w-10"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Show help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Click to restart the tour</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  if (!targetElement) {
    return null
  }

  const rect = targetElement.getBoundingClientRect()
  const position = currentStepData.position

  const getTooltipStyle = () => {
    const baseStyle = {
      position: "fixed" as const,
      zIndex: 9999,
      maxWidth: "300px"
    }

    switch (position) {
      case "top":
        return {
          ...baseStyle,
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%) translateY(-100%)"
        }
      case "bottom":
        return {
          ...baseStyle,
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)"
        }
      case "left":
        return {
          ...baseStyle,
          top: rect.top + rect.height / 2,
          left: rect.left - 10,
          transform: "translateY(-50%) translateX(-100%)"
        }
      case "right":
        return {
          ...baseStyle,
          top: rect.top + rect.height / 2,
          left: rect.right + 10,
          transform: "translateY(-50%)"
        }
      default:
        return baseStyle
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight target element */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)"
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-background border rounded-lg shadow-lg p-4"
        style={getTooltipStyle()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{currentStepData.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <Button
              size="sm"
              onClick={currentStepData.action.onClick}
              className="w-full"
            >
              {currentStepData.action.label}
            </Button>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} of {onboardingSteps.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 px-3"
              >
                {currentStep === onboardingSteps.length - 1 ? "Finish" : "Next"}
                {currentStep < onboardingSteps.length - 1 && (
                  <ChevronRight className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
