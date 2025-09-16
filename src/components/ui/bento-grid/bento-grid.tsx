import { useState, useCallback, useEffect } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import { cn } from '@/lib/utils'
import type { BentoGridProps, BentoItem } from './types'
import { getSizePresets } from './size-presets'
import { BentoItemComponent } from './bento-item'
import { AddItemModal } from './add-item-modal'

// CSS imports for react-grid-layout
import 'react-grid-layout/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

export function BentoGrid({ 
  items, 
  onItemsChange, 
  editable = true, 
  className, 
  onAddItem, 
  showAddModal: externalShowAddModal, 
  setShowAddModal: externalSetShowAddModal 
}: BentoGridProps) {
  const [internalShowAddModal, setInternalShowAddModal] = useState(false)
  const [layoutKey, setLayoutKey] = useState(0)
  
  const showAddModal = externalShowAddModal !== undefined ? externalShowAddModal : internalShowAddModal
  const setShowAddModal = externalSetShowAddModal || setInternalShowAddModal

  // Force re-render when items change to ensure layout updates
  useEffect(() => {
    setLayoutKey(prev => prev + 1)
  }, [items])

  const layouts = {
    lg: items.map(item => ({
      i: item.id,
      x: item.layout.x,
      y: item.layout.y,
      w: item.layout.w,
      h: item.layout.h,
      minW: 1,
      minH: 1,
      static: false // Allow dragging but not resizing
    }))
  }

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!editable) return
    
    const updatedItems = items.map(item => {
      const layoutItem = layout.find(l => l.i === item.id)
      if (layoutItem) {
        return {
          ...item,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        }
      }
      return item
    })
    
    onItemsChange(updatedItems)
  }, [items, onItemsChange, editable])

  const handleAddItem = (newItem: Omit<BentoItem, 'id' | 'layout'>) => {
    if (onAddItem) {
      onAddItem(newItem)
    } else {
      const id = Date.now().toString()
      const size = newItem.size || 'medium'
      const dimensions = getSizePresets(newItem.type, size)
      const item: BentoItem = {
        ...newItem,
        id,
        size,
        layout: {
          x: 0,
          y: 0,
          w: dimensions.w,
          h: dimensions.h
        }
      }
      
      onItemsChange([...items, item])
    }
  }

  const handleEditItem = (updatedItem: BentoItem) => {
    // Ensure the item has a size property
    const itemWithSize = {
      ...updatedItem,
      size: updatedItem.size || 'medium'
    }
    
    const updatedItems = items.map(item => 
      item.id === itemWithSize.id ? itemWithSize : item
    )
    
    console.log('handleEditItem called with:', itemWithSize)
    console.log('Updated items:', updatedItems)
    
    // Force layout refresh when size changes
    if (updatedItem.layout && (updatedItem.layout.w !== items.find(i => i.id === updatedItem.id)?.layout.w || 
        updatedItem.layout.h !== items.find(i => i.id === updatedItem.id)?.layout.h)) {
      setLayoutKey(prev => prev + 1)
    }
    
    onItemsChange(updatedItems)
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    onItemsChange(updatedItems)
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveGridLayout
        key={layoutKey}
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 800, md: 600, sm: 400, xs: 300, xxs: 0 }}
        cols={{ lg: 6, md: 4, sm: 3, xs: 2, xxs: 1 }}
        rowHeight={120}
        onLayoutChange={handleLayoutChange}
        isDraggable={editable}
        isResizable={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {items.map(item => (
          <div key={item.id}>
            <BentoItemComponent
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              editable={editable}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />
    </div>
  )
}
