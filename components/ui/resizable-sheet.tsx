'use client'

import * as React from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResizableSheetContextValue {
  width: number
  setWidth: (w: number) => void
  minWidth: number
  maxWidth: number
}

const ResizableSheetContext = React.createContext<ResizableSheetContextValue | null>(null)

const useResizableSheetContext = () => {
  const ctx = React.useContext(ResizableSheetContext)
  if (!ctx) throw new Error('useResizableSheetContext must be used within ResizableSheet')
  return ctx
}

interface ResizableSheetProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  width: number
  onWidthChange: (w: number) => void
}

function ResizableSheet({
  children,
  defaultWidth = 480,
  minWidth = 400,
  maxWidth = Math.floor(window.innerWidth * 0.95),
  width,
  onWidthChange,
}: ResizableSheetProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const startXRef = React.useRef(0)
  const startWidthRef = React.useRef(width)

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startXRef.current = e.clientX
      startWidthRef.current = width
    },
    [width]
  )

  React.useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current - delta))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, minWidth, maxWidth, onWidthChange])

  return (
    <ResizableSheetContext.Provider value={{ width, setWidth: onWidthChange, minWidth, maxWidth }}>
      <div className="relative flex h-full">
        {/* Resize Handle - left edge */}
        <div
          className={cn(
            'group/resize absolute top-0 left-0 z-50 h-full w-1 cursor-ew-resize',
            'flex items-center justify-center',
            'transition-colors duration-150'
          )}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              'flex h-full w-1 items-center justify-center transition-opacity',
              isDragging ? 'opacity-100' : 'opacity-0 group-hover/resize:opacity-100'
            )}
          >
            <div className="bg-primary/50 h-full w-0.5 rounded-full" />
          </div>
        </div>

        {/* Content */}
        <div className="h-full flex-1 overflow-hidden" style={{ width }}>
          {children}
        </div>
      </div>
    </ResizableSheetContext.Provider>
  )
}

export { ResizableSheet, useResizableSheetContext }
