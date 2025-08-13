import { useEffect, useState } from 'react'
import { Skeleton } from "@/components/ui/skeleton"

// Smart Loading Skeleton yang auto-hide
export function SmartLoadingSkeleton({ 
  children, 
  isLoading, 
  fallback, 
  minShowTime = 100 
}: { 
  children: React.ReactNode
  isLoading: boolean
  fallback: React.ReactNode
  minShowTime?: number
}) {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [startTime, setStartTime] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true)
      setStartTime(Date.now())
    } else {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minShowTime - elapsed)
      
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowSkeleton(false)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setShowSkeleton(false)
      }
    }
  }, [isLoading, startTime, minShowTime])

  if (showSkeleton) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Quick Loading Skeleton untuk route transitions
export function QuickRouteSkeleton({ 
  children, 
  showSkeleton = false 
}: { 
  children: React.ReactNode
  showSkeleton: boolean
}) {
  if (!showSkeleton) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Quick loading indicator */}
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading State Manager
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [loadingStartTime, setLoadingStartTime] = useState(0)

  const startLoading = () => {
    setIsLoading(true)
    setLoadingStartTime(Date.now())
  }

  const stopLoading = () => {
    setIsLoading(false)
  }

  const getLoadingDuration = () => {
    if (loadingStartTime === 0) return 0
    return Date.now() - loadingStartTime
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    getLoadingDuration
  }
}
