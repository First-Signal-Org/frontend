import { cn } from '@/lib/utils'
import type { BentoItem, BentoSize } from './types'

interface SizeDockProps {
  item: BentoItem
  onSizeChange: (size: BentoSize) => void
  editable: boolean
  isEditing: boolean
}

export function SizeDock({ item, onSizeChange, editable, isEditing }: SizeDockProps) {
  if (!editable || isEditing) return null

  return (
    <div 
      className={cn(
        "absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200",
        item.type === 'image' ? "z-[60]" : "z-50"
      )}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseUp={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseMove={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onDragStart={(e) => {
        e.preventDefault()
        e.stopPropagation()
        return false
      }}
      onDrag={(e) => {
        e.preventDefault()
        e.stopPropagation()
        return false
      }}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="flex items-center gap-2 bg-black/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-xl border border-white/10"
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onDragStart={(e) => {
          e.preventDefault()
          return false
        }}
      >
        {(['xs', 'small', 'medium', 'large', 'xl'] as BentoSize[]).map((size) => (
          <button
            key={size}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseUp={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              console.log(`Changing size from ${item.size} to ${size}`)
              onSizeChange(size)
            }}
            onDragStart={(e) => {
              e.preventDefault()
              e.stopPropagation()
              return false
            }}
            className={cn(
              "transition-all duration-200 hover:scale-110 flex items-center justify-center cursor-pointer select-none",
              item.size === size 
                ? "text-white" 
                : "text-white/60 hover:text-white"
            )}
            title={`${size} size`}
            draggable={false}
          >
            <div 
              className={cn(
                "border-2 border-current rounded-full transition-all pointer-events-none select-none",
                size === 'xs' && "w-1.5 h-1.5",
                size === 'small' && "w-2.5 h-2.5",
                size === 'medium' && "w-4 h-2.5", 
                size === 'large' && "w-5 h-3",
                size === 'xl' && "w-2 h-6",
                item.size === size && "bg-current"
              )}
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
