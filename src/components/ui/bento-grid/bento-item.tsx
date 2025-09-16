import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Edit3, Trash2, Copy } from 'lucide-react'
import type { BentoItem, BentoSize } from './types'
import { getSizePresets } from './size-presets'
import { SizeDock } from './size-dock'
import { TextContent, UrlContent, EmbedContent, ImageContent } from './content-renderers'
import { fetchVideoMetadata, isSupportedVideoUrl } from '@/lib/video-metadata'

interface BentoItemProps {
  item: BentoItem
  onEdit: (item: BentoItem) => void
  onDelete: (id: string) => void
  editable: boolean
}

export function BentoItemComponent({ item, onEdit, onDelete, editable }: BentoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [editContent, setEditContent] = useState(item.content)
  const [_, setIsLoadingTitle] = useState(false)
  const [titleWasAutoFetched, setTitleWasAutoFetched] = useState(false)

  // Auto-fetch video titles when content changes for embed type during editing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const fetchTitle = async () => {
      if (isEditing && item.type === 'embed' && editContent.trim() && isSupportedVideoUrl(editContent.trim())) {
        // Only auto-fetch if user hasn't manually entered a title or if it was previously auto-fetched
        if (!editTitle.trim() || editTitle === 'Video' || titleWasAutoFetched) {
          setIsLoadingTitle(true)
          try {
            const metadata = await fetchVideoMetadata(editContent.trim())
            if (metadata?.title) {
              setEditTitle(metadata.title)
              setTitleWasAutoFetched(true)
            }
          } catch (error) {
            console.warn('Failed to fetch video title:', error)
          } finally {
            setIsLoadingTitle(false)
          }
        }
      }
    }

    // Debounce the API call
    if (isEditing && item.type === 'embed' && editContent.trim()) {
      timeoutId = setTimeout(fetchTitle, 1000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [editContent, isEditing, item.type, editTitle, titleWasAutoFetched])

  const handleEditContentChange = (newContent: string) => {
    setEditContent(newContent)
    // Reset auto-fetch flag when content changes
    if (item.type === 'embed') {
      setTitleWasAutoFetched(false)
    }
  }

  const handleSave = () => {
    console.log('handleSave called')
    // For images and embeds, title is optional, only content is required
    const isTitleRequired = item.type !== 'image' && item.type !== 'embed'
    const isValid = isTitleRequired ? (editTitle.trim() && editContent.trim()) : editContent.trim()
    
    if (isValid) {
      let finalTitle = editTitle.trim()
      if (!finalTitle) {
        if (item.type === 'image') {
          finalTitle = 'Image'
        } else if (item.type === 'embed') {
          finalTitle = 'Video'
        }
      }
      
      const updatedItem = { ...item, title: finalTitle, content: editContent.trim() }
      onEdit(updatedItem)
      setTitleWasAutoFetched(false)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    console.log('handleCancel called')
    setEditTitle(item.title)
    setEditContent(item.content)
    setTitleWasAutoFetched(false)
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

  const handleSizeChange = (newSize: BentoSize) => {
    const dimensions = getSizePresets(item.type, newSize)
    const updatedItem = { 
      ...item, 
      size: newSize,
      layout: {
        ...item.layout,
        w: dimensions.w,
        h: dimensions.h
      }
    }
    onEdit(updatedItem)
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
              onChange={(e) => handleEditContentChange(e.target.value)}
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

    // Render content based on type
    switch (item.type) {
      case 'text':
        return <TextContent item={item} isEditing={isEditing} />
      case 'url':
        return <UrlContent item={item} isEditing={isEditing} />
      case 'embed':
        return <EmbedContent item={item} isEditing={isEditing} />
      case 'image':
        return <ImageContent item={item} isEditing={isEditing} />
      default:
        return <div className="text-sm text-muted-foreground">Unknown content type</div>
    }
  }

  return (
    <Card 
      className={cn(
        "h-full flex flex-col group relative overflow-visible focus:outline-none focus:ring-0 active:outline-none select-none tap-highlight-transparent",
        isEditing && "editing-mode",
        item.type === 'image' && "p-0"
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
              }}
              className="w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
              title="Edit"
              draggable={false}
            >
              <Edit3 className="w-3 h-3 text-muted-foreground" />
            </button>
            
            {(item.type === 'url' || item.type === 'embed') && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleCopy()
                }}
                className="w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-sm group/btn"
                title="Copy URL"
                draggable={false}
              >
                <Copy className="w-3 h-3 text-muted-foreground group-hover/btn:text-blue-600 transition-colors" />
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
                onDelete(item.id)
              }}
              className="w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm group/btn"
              title="Delete"
              draggable={false}
            >
              <Trash2 className="w-3 h-3 text-muted-foreground group-hover/btn:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      )}
      
      {item.type === 'image' ? (
        <div className="flex-1 relative overflow-hidden">
          {renderEditableContent()}
        </div>
      ) : (
        <CardContent className={cn(
          "pt-0 pb-3",
          item.type === 'text' ? "flex-1 min-h-0" : "flex-1"
        )}>
          {renderEditableContent()}
        </CardContent>
      )}
      
      <SizeDock 
        item={item}
        onSizeChange={handleSizeChange}
        editable={editable}
        isEditing={isEditing}
      />
    </Card>
  )
}
