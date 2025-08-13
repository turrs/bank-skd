import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteLoadingBar() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)

    // Quick progress animation
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 20
      })
    }, 20)

    // Hide loading bar quickly
    const hideTimer = setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 100)

    return () => {
      clearInterval(timer)
      clearTimeout(hideTimer)
    }
  }, [location.pathname])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div 
        className="h-1 bg-blue-600 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
