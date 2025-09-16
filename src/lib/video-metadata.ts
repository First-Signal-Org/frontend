// Video metadata fetching utilities

export interface VideoMetadata {
  title: string
  thumbnail?: string
  duration?: string
  provider: 'youtube' | 'vimeo' | 'unknown'
}

/**
 * Extract video ID from YouTube URLs
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Extract video ID from Vimeo URLs
 */
function getVimeoVideoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Fetch YouTube video metadata using oEmbed API
 */
async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
    
    if (!response.ok) throw new Error('Failed to fetch metadata')
    
    const data = await response.json()
    
    return {
      title: data.title || 'YouTube Video',
      thumbnail: data.thumbnail_url,
      provider: 'youtube'
    }
  } catch (error) {
    console.warn('Failed to fetch YouTube metadata:', error)
    return null
  }
}

/**
 * Fetch Vimeo video metadata using oEmbed API
 */
async function fetchVimeoMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const response = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
    )
    
    if (!response.ok) throw new Error('Failed to fetch metadata')
    
    const data = await response.json()
    
    return {
      title: data.title || 'Vimeo Video',
      thumbnail: data.thumbnail_url,
      provider: 'vimeo'
    }
  } catch (error) {
    console.warn('Failed to fetch Vimeo metadata:', error)
    return null
  }
}

/**
 * Fetch video metadata from supported video platforms
 */
export async function fetchVideoMetadata(url: string): Promise<VideoMetadata | null> {
  // Try YouTube first
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) {
    return await fetchYouTubeMetadata(youtubeId)
  }
  
  // Try Vimeo
  const vimeoId = getVimeoVideoId(url)
  if (vimeoId) {
    return await fetchVimeoMetadata(vimeoId)
  }
  
  // Unsupported platform
  return {
    title: 'Video Content',
    provider: 'unknown'
  }
}

/**
 * Check if a URL is a supported video platform
 */
export function isSupportedVideoUrl(url: string): boolean {
  return getYouTubeVideoId(url) !== null || getVimeoVideoId(url) !== null
}
