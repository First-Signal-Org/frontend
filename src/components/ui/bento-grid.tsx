import React, { useState, useCallback } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  X, 
  Edit3, 
  Link, 
  Type, 
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Maximize2,
  Copy,
  ExternalLink
} from 'lucide-react'

// CSS imports for react-grid-layout
import 'react-grid-layout/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface BentoItem {
  id: string
  type: 'text' | 'url' | 'embed' | 'image'
  title: string
  content: string
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

interface BentoGridProps {
  items: BentoItem[]
  onItemsChange: (items: BentoItem[]) => void
  editable?: boolean
  className?: string
  onAddItem?: (newItem: Omit<BentoItem, 'id' | 'layout'>) => void
  showAddModal?: boolean
  setShowAddModal?: (show: boolean) => void
}

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: Omit<BentoItem, 'id' | 'layout'>) => void
}

function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [type, setType] = useState<BentoItem['type']>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For images and embeds, title is optional, only content is required
    const isTitleRequired = type !== 'image' && type !== 'embed'
    if ((isTitleRequired && !title.trim()) || !content.trim()) return
    
    let finalTitle = title.trim()
    if (!finalTitle) {
      if (type === 'image') {
        finalTitle = 'Image'
      } else if (type === 'embed') {
        finalTitle = 'Video'
      }
    }
    onAdd({ type, title: finalTitle, content })
    setTitle('')
    setContent('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add New Item</CardTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('text')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors",
                    type === 'text' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Type className="w-4 h-4" />
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setType('url')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors",
                    type === 'url' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Link className="w-4 h-4" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setType('embed')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors",
                    type === 'embed' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Maximize2 className="w-4 h-4" />
                  Embed
                </button>
                <button
                  type="button"
                  onClick={() => setType('image')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors",
                    type === 'image' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-muted"
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  Image
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title {(type === 'image' || type === 'embed') && <span className="text-muted-foreground font-normal">(optional)</span>}
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={
                  type === 'image' ? 'Enter title (optional)...' :
                  type === 'embed' ? 'Enter title (optional)...' :
                  'Enter title...'
                }
                required={type !== 'image' && type !== 'embed'}
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                {type === 'text' ? 'Content' : 
                 type === 'url' || type === 'embed' ? 'URL' : 
                 'Image URL'}
              </label>
              {type === 'text' ? (
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                  placeholder="Enter content..."
                  required
                />
              ) : (
                <input
                  id="content"
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={
                    type === 'embed' ? 'Enter YouTube, Vimeo, CodePen, or embed URL...' :
                    type === 'image' ? 'Enter image URL...' :
                    'Enter URL...'
                  }
                  required
                />
              )}
              {type === 'embed' && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>💡 <strong>Tip:</strong> Regular YouTube links will be automatically converted to embed format.</p>
                  <p>Supported: YouTube, Vimeo, CodePen, JSFiddle</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Item
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function BentoItemComponent({ 
  item, 
  onEdit, 
  onDelete, 
  editable 
}: { 
  item: BentoItem
  onEdit: (item: BentoItem) => void
  onDelete: (id: string) => void
  editable: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [editContent, setEditContent] = useState(item.content)

  // Update local state when item changes
  React.useEffect(() => {
    setEditTitle(item.title)
    setEditContent(item.content)
  }, [item.title, item.content])

  // Focus management when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      console.log('Entering edit mode')
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        const titleInput = document.querySelector(`[data-item-id="${item.id}"] input`)
        const contentInput = document.querySelector(`[data-item-id="${item.id}"] textarea, [data-item-id="${item.id}"] input[placeholder*="URL"]`)
        if (titleInput) {
          (titleInput as HTMLInputElement).focus()
        } else if (contentInput) {
          (contentInput as HTMLInputElement | HTMLTextAreaElement).focus()
        }
      }, 50)
    }
  }, [isEditing, item.id])

  // Helper function to convert URLs to embeddable format
  const convertToEmbedUrl = (url: string, type: string): string => {
    if (type !== 'embed') return url;
    
    // YouTube URL conversion
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo URL conversion
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // CodePen URL conversion
    const codepenRegex = /(?:https?:\/\/)?codepen\.io\/([^\/]+)\/pen\/([^\/\?]+)/;
    const codepenMatch = url.match(codepenRegex);
    if (codepenMatch) {
      return `https://codepen.io/${codepenMatch[1]}/embed/${codepenMatch[2]}`;
    }
    
    // JSFiddle URL conversion
    const jsfiddleRegex = /(?:https?:\/\/)?jsfiddle\.net\/([^\/]+\/[^\/]+)/;
    const jsfiddleMatch = url.match(jsfiddleRegex);
    if (jsfiddleMatch) {
      return `https://jsfiddle.net/${jsfiddleMatch[1]}/embedded/`;
    }
    
    return url;
  }

  const handleSave = () => {
    console.log('handleSave called')
    // For images and embeds, title is optional, only content is required
    const isTitleRequired = item.type !== 'image' && item.type !== 'embed'
    const isValid = isTitleRequired ? (editTitle.trim() && editContent.trim()) : editContent.trim()
    
    if (isValid) {
      const convertedContent = convertToEmbedUrl(editContent.trim(), item.type);
      let finalTitle = editTitle.trim()
      if (!finalTitle) {
        if (item.type === 'image') {
          finalTitle = 'Image'
        } else if (item.type === 'embed') {
          finalTitle = 'Video'
        }
      }
      console.log('Saving changes:', { title: finalTitle, content: convertedContent })
      onEdit({
        ...item,
        title: finalTitle,
        content: convertedContent
      })
      setIsEditing(false)
    } else {
      console.log('Not saving - missing required fields')
    }
  }

  const handleCancel = () => {
    console.log('handleCancel called')
    setEditTitle(item.title)
    setEditContent(item.content)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content)
  }

  const handleOpenLink = () => {
    if (item.type === 'url' && item.content) {
      window.open(item.content, '_blank')
    }
  }

  const renderEditableTitle = () => {
    console.log('renderEditableTitle called, isEditing:', isEditing)
    if (isEditing) {
      console.log('Rendering title input field')
      return (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent border border-border rounded px-2 py-1 text-sm font-medium leading-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Title..."
          autoFocus
        />
      )
    }

    return (
      <div className="text-sm font-medium leading-none">
        {item.title}
      </div>
    )
  }

  const renderEditableContent = () => {
    console.log('renderEditableContent called, isEditing:', isEditing)
    if (isEditing) {
      console.log('Rendering content input field')
      return (
        <div 
          className="space-y-2 edit-content-wrapper"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {item.type === 'text' ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent border border-border rounded px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="Content..."
              autoFocus
            />
          ) : (
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="URL..."
              autoFocus
            />
          )}
          <div className="flex gap-2 mt-2">
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleSave()
              }}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleCancel()
              }}
              className="px-3 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-1 text-xs text-muted-foreground mt-1">
            <span>Or press Ctrl+Enter to save, Esc to cancel</span>
          </div>
        </div>
      )
    }

    // Removed automatic click-to-edit to prevent conflicts
    // const handleContentClick = () => {
    //   if (editable && item.type !== 'embed') {
    //     setIsEditing(true)
    //   }
    // }

    switch (item.type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.content}
            </p>
          </div>
        )
      
      case 'url':
        return (
          <div className="space-y-2">
            <a
              href={item.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {item.content}
            </a>
            <div className="text-xs text-muted-foreground">
              Click to open in new tab
            </div>
          </div>
        )
      
      case 'embed':
        return (
          <div className="w-full h-full relative overflow-hidden rounded">
            <iframe
              src={item.content}
              title={item.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onError={(e) => {
                console.error('Iframe loading error:', e)
              }}
            />
            {/* Optional title overlay for embeds with meaningful titles */}
            {item.title && item.title !== 'Video' && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
              </div>
            )}
            {/* Fallback message for non-embeddable content */}
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-background/90 p-3 rounded-lg text-center text-sm">
                <p className="font-medium mb-1">Having trouble loading?</p>
                <p className="text-muted-foreground text-xs">
                  Some sites don't allow embedding. Try using YouTube embed URLs instead of regular links.
                </p>
              </div>
            </div>
          </div>
        )
      
      case 'image':
        return (
          <div className="w-full h-full relative overflow-hidden rounded">
            <img
              src={item.content}
              alt={item.title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIgZmlsbD0iY3VycmVudENvbG9yIi8+CjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEwxMiAxNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
              }}
            />
            {/* Optional overlay for better text readability if title exists and is not default */}
            {item.title && item.title !== 'Image' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{item.title}</p>
              </div>
            )}
          </div>
        )
      
      default:
        return <div className="text-sm text-muted-foreground">Unknown content type</div>
    }
  }

  return (
    <Card 
      className={cn(
        "h-full flex flex-col group relative overflow-visible focus:outline-none focus:ring-0 active:outline-none select-none tap-highlight-transparent",
        isEditing && "editing-mode"
      )}
      data-item-id={item.id}
      data-editing={isEditing}
    >
      {/* Floating Buttons - Hidden when editing */}
      {editable && !isEditing && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 no-drag">
          <div className="flex gap-1 no-drag">
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                console.log('Edit button clicked, current isEditing:', isEditing)
                setIsEditing(true)
                console.log('Edit button clicked, setting isEditing to true')
              }}
              className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110 group/btn cursor-pointer relative z-10"
              title="Edit"
              type="button"
              draggable={false}
            >
              <Edit3 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors pointer-events-none" />
            </button>
            
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                console.log('Copy button clicked')
                handleCopy()
              }}
              className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110 group/btn cursor-pointer relative z-10"
              title="Copy"
              type="button"
              draggable={false}
            >
              <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover/btn:text-green-600 dark:group-hover/btn:text-green-400 transition-colors pointer-events-none" />
            </button>
            
            {item.type === 'url' && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  console.log('Open link button clicked')
                  handleOpenLink()
                }}
                className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110 group/btn cursor-pointer relative z-10"
                title="Open Link"
                type="button"
                draggable={false}
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover/btn:text-purple-600 dark:group-hover/btn:text-purple-400 transition-colors pointer-events-none" />
              </button>
            )}
            
            <button
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                console.log('Delete button clicked')
                onDelete(item.id)
              }}
              className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110 group/btn cursor-pointer relative z-10"
              title="Delete"
              type="button"
              draggable={false}
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover/btn:text-red-600 dark:group-hover/btn:text-red-400 transition-colors pointer-events-none" />
            </button>
          </div>
        </div>
      )}
      
      
      {/* Hide header for image and embed cards without meaningful titles */}
      {!((item.type === 'image' && (!item.title || item.title === 'Image')) || 
          (item.type === 'embed' && (!item.title || item.title === 'Video'))) && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium leading-none">
            {renderEditableTitle()}
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="flex-1 pt-0 pb-3">
        {renderEditableContent()}
      </CardContent>
      
      {editable && !isEditing && (
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </Card>
  )
}

export function BentoGrid({ items, onItemsChange, editable = true, className, onAddItem, showAddModal: externalShowAddModal, setShowAddModal: externalSetShowAddModal }: BentoGridProps) {
  const [internalShowAddModal, setInternalShowAddModal] = useState(false)
  
  const showAddModal = externalShowAddModal !== undefined ? externalShowAddModal : internalShowAddModal
  const setShowAddModal = externalSetShowAddModal || setInternalShowAddModal

  const layouts = {
    lg: items.map(item => ({
      i: item.id,
      x: item.layout.x,
      y: item.layout.y,
      w: item.layout.w,
      h: item.layout.h,
      minW: 1,
      minH: 1
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
      const item: BentoItem = {
        ...newItem,
        id,
        layout: {
          x: 0,
          y: 0,
          w: newItem.type === 'embed' ? 6 : newItem.type === 'text' ? 3 : 2,
          h: newItem.type === 'text' ? 3 : newItem.type === 'embed' ? 4 : 2
        }
      }
      
      onItemsChange([...items, item])
    }
  }

  const handleEditItem = (updatedItem: BentoItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    )
    onItemsChange(updatedItems)
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    onItemsChange(updatedItems)
  }


  return (
    <div className={cn("w-full", className)}>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 6, md: 4, sm: 3, xs: 2, xxs: 1 }}
        rowHeight={80}
        onLayoutChange={handleLayoutChange}
        isDraggable={editable}
        isResizable={editable}
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
