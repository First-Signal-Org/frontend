import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  X, 
  Type, 
  Link, 
  Image as ImageIcon,
  Maximize2,
  Loader2
} from 'lucide-react'
import type { BentoItem } from './types'
import { fetchVideoMetadata, isSupportedVideoUrl } from '@/lib/video-metadata'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: Omit<BentoItem, 'id' | 'layout'>) => void
}

export function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [type, setType] = useState<BentoItem['type']>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoadingTitle, setIsLoadingTitle] = useState(false)
  const [titleWasAutoFetched, setTitleWasAutoFetched] = useState(false)

  // Auto-fetch video titles when content changes for embed type
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const fetchTitle = async () => {
      if (type === 'embed' && content.trim() && isSupportedVideoUrl(content.trim())) {
        // Only auto-fetch if user hasn't manually entered a title
        if (!title.trim() || titleWasAutoFetched) {
          setIsLoadingTitle(true)
          try {
            const metadata = await fetchVideoMetadata(content.trim())
            if (metadata?.title) {
              setTitle(metadata.title)
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
    if (type === 'embed' && content.trim()) {
      timeoutId = setTimeout(fetchTitle, 1000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [content, type, title, titleWasAutoFetched])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    // Reset auto-fetch flag when content changes
    if (type === 'embed') {
      setTitleWasAutoFetched(false)
    }
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    // If user manually changes title, don't auto-fetch anymore
    setTitleWasAutoFetched(false)
  }

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
    setTitleWasAutoFetched(false)
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
              </div>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title {(type === 'image' || type === 'embed') && <span className="text-muted-foreground font-normal">(optional)</span>}
                {isLoadingTitle && type === 'embed' && (
                  <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching title...
                  </span>
                )}
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={
                  type === 'image' ? 'Enter title (optional)...' :
                  type === 'embed' ? 'Enter video title (optional)...' :
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
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={
                    type === 'url' ? 'https://example.com' :
                    type === 'embed' ? 'https://youtube.com/watch?v=...' :
                    'https://example.com/image.jpg'
                  }
                  required
                />
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
