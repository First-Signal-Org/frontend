import { ExternalLink } from 'lucide-react'
import type { BentoItem } from './types'

interface ContentRendererProps {
  item: BentoItem
  isEditing: boolean
}

export function TextContent({ item }: ContentRendererProps) {
  return (
    <div className="h-full flex items-center justify-center p-2 overflow-hidden">
      <p 
        className="text-lg text-foreground leading-relaxed text-left overflow-hidden" 
        style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical'
        }}
      >
        {item.content}
      </p>
    </div>
  )
}

export function UrlContent({ item }: ContentRendererProps) {
  return (
    <div className="h-full flex items-center justify-center p-2">
      <a
        href={item.content}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-muted/50 transition-colors rounded p-2 group text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-muted rounded flex-shrink-0" />
          <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {item.content}
        </p>
        <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 inline-block mt-2">
          Click to open
        </div>
      </a>
    </div>
  )
}

export function EmbedContent({ item }: ContentRendererProps) {
  const getEmbedIcon = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return (
        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      )
    }
    if (url.includes('vimeo.com')) {
      return (
        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 4.192-3.729C5.529 2.529 6.285 1.939 6.883 1.892c1.428-.137 2.305.843 2.631 2.94.353 2.261.598 3.668.732 4.224.4 1.823.843 2.735 1.328 2.735.378 0 .945-.598 1.705-1.795.759-1.197 1.167-2.109 1.222-2.735.137-.984-.179-1.476-.946-1.476-.336 0-.683.076-1.044.228 1.072-3.508 3.117-5.214 6.135-5.117 2.234.074 3.287 1.514 3.161 4.32z"/>
          </svg>
        </div>
      )
    }
    return (
      <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return domain
    } catch {
      return 'embed'
    }
  }

  return (
    <div 
      className="h-full flex flex-col justify-between p-2 cursor-pointer transition-colors rounded-lg"
      onClick={() => {
        window.open(item.content, '_blank')
      }}
    >
      <div className="flex flex-col items-start gap-3">
        {getEmbedIcon(item.content)}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-sm leading-tight mb-1 overflow-hidden"
            style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {item.title && item.title !== 'Video' ? item.title : 'Video Content'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {getDomainFromUrl(item.content)}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ImageContent({ item }: ContentRendererProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={item.content}
        alt={item.title}
        className="w-full h-full object-cover rounded transition-transform hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIgZmlsbD0iY3VycmVudENvbG9yIi8+CjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEwxMiAxNSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
        }}
      />
    </div>
  )
}
