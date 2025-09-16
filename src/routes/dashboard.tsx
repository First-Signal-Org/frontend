import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { BentoGrid, type BentoItem, type BentoSize } from '@/components/ui/bento-grid'
import { 
  LogOut, 
  Type, 
  Link, 
  Image as ImageIcon,
  Maximize2,
  Home,
  User,
  Bell,
  Trash2
} from 'lucide-react'
import { 
  createGoogleAuthClientService,
  type GoogleUserProfile 
} from '@/lib/google-auth-client'
import { 
  createGitHubAuthClientService,
  type GitHubUser 
} from '@/lib/github-auth-client'
import { Dock, DockIcon } from '@/components/ui/dock'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Button, buttonVariants } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  notificationManager, 
  type NotificationItem
} from '@/lib/notifications'
import { Notification } from '@/components/notification'
import { AnimatedList } from '@/components/ui/animated-list'

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  const navigate = useNavigate()
  const [user, setUser] = useState<GoogleUserProfile | GitHubUser | null>()
  const [authProvider, setAuthProvider] = useState<'google' | 'github' | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  
  // Remove activeView since we'll show both sides simultaneously
  const [bentoItems, setBentoItems] = useState<BentoItem[]>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bento-items')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.warn('Failed to parse saved bento items:', e)
        }
      }
    }
    // Default items
    return [
      {
        id: '1',
        type: 'text' as const,
        title: 'Welcome!',
        content: 'Welcome to your personal dashboard! This is a Bento grid where you can add text, URLs, embedded content, and images. Click "Add Item" to get started.',
        size: 'medium' as BentoSize,
        layout: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: '2',
        type: 'url' as const,
        title: 'GitHub',
        content: 'https://github.com',
        size: 'medium' as BentoSize,
        layout: { x: 3, y: 0, w: 3, h: 2 }
      },
      {
        id: '3',
        type: 'embed' as const,
        title: 'YouTube Demo',
        content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        size: 'medium' as BentoSize,
        layout: { x: 0, y: 3, w: 6, h: 4 }
      }
    ]
  })

  // Initialize Auth Services
  const [googleAuthService] = useState(() => {
    try {
      return createGoogleAuthClientService()
    } catch (error) {
      console.warn('Failed to initialize Google Auth:', error)
      return null
    }
  })

  const [githubAuthService] = useState(() => {
    try {
      return createGitHubAuthClientService()
    } catch (error) {
      console.warn('Failed to initialize GitHub Auth:', error)
      return null
    }
  })


  // Save bento items to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bento-items', JSON.stringify(bentoItems))
    }
  }, [bentoItems])

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications)
    })
    
    // Initial load
    setNotifications(notificationManager.getNotifications())

    return unsubscribe
  }, [])

  // Check for stored authentication
  useEffect(() => {
    // Check Google auth first
    if (googleAuthService && typeof window !== 'undefined') {
      try {
        if (googleAuthService.isSignedIn()) {
          const profile = googleAuthService.getStoredProfile()
          if (profile) {
            setUser(profile)
            setAuthProvider('google')
            return
          }
        }
      } catch (error) {
        console.warn('Error checking stored Google auth:', error)
      }
    }

    // Check GitHub auth if Google auth not found
    if (githubAuthService && typeof window !== 'undefined') {
      try {
        if (githubAuthService.isSignedIn()) {
          const githubUser = githubAuthService.getStoredUser()
          if (githubUser) {
            setUser(githubUser)
            setAuthProvider('github')
            return
          }
        }
      } catch (error) {
        console.warn('Error checking stored GitHub auth:', error)
      }
    }

    // No authentication found, redirect to login
    navigate({ to: '/login' })
  }, [googleAuthService, githubAuthService, navigate])

  const handleLogout = async () => {
    if (authProvider === 'google' && googleAuthService) {
      await googleAuthService.signOut()
      googleAuthService.clearStoredCredential()
    } else if (authProvider === 'github' && githubAuthService) {
      await githubAuthService.signOut()
      githubAuthService.clearStoredData()
    }
    
    navigate({ to: '/login' })
  }

  const handleBentoItemsChange = (items: BentoItem[]) => {
    setBentoItems(items)
  }


  const handleAddItemWithType = (_type: BentoItem['type']) => {
    setShowAddModal(true)
  }

  // Signal management functions
  const handleSendSignal = () => {
    const signalId = `signal-${Date.now()}`
    
    // Add only one mock notification
    notificationManager.addSignalNotification(signalId, 'sent')
    navigate({ to: '/send' })
  }

  const handleClearNotifications = () => {
    notificationManager.clearNotifications()
  }


  if (!user || !authProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user information...</p>
        </div>
      </div>
    )
  }

  const isGoogleUser = authProvider === 'google'
  const isGitHubUser = authProvider === 'github'

  // Clean profile component for left sidebar
  const profileSidebar = (
    <div className="w-full h-full bg-background rounded-lg flex flex-col gap-4">
      {/* Profile Header */}
      <div className="text-center mb-8">
        <div className="flex justify-left mb-6">
          <img 
            src={isGoogleUser ? (user as GoogleUserProfile).picture : (user as GitHubUser).avatar_url} 
            alt={isGoogleUser ? (user as GoogleUserProfile).name : ((user as GitHubUser).name || (user as GitHubUser).login)}
            className="w-56 h-56 rounded-full object-cover border-2 border-border"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-foreground text-left">
          {isGoogleUser 
            ? (user as GoogleUserProfile).name 
            : ((user as GitHubUser).name || (user as GitHubUser).login)
          }
        </h1>
        <p className="text-muted-foreground text-sm mb-4 text-left">
          {isGitHubUser && (user as GitHubUser).bio 
            ? (user as GitHubUser).bio 
            : `${authProvider === 'google' ? 'Google' : 'GitHub'} Account`
          } 
        </p>
      </div>
      <Card className="flex-1 min-h-0">
        <CardHeader>
          <CardTitle className='text-md font-normal flex items-center justify-between'>
            Oscilloscope
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearNotifications}
                className="text-xs h-6 px-2"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-2">
          <div className="h-full overflow-hidden">
            {notifications.length > 0 ? (
              <div className="h-full overflow-hidden relative">
                <AnimatedList className="h-full">
                  {notifications.slice(0, 10).map((notification, idx) => (
                    <Notification 
                      key={notification.id || idx} 
                      {...notification} 
                      className="mb-2 last:mb-0 scale-90 origin-top-left w-[111%]"
                    />
                  ))}
                </AnimatedList>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No signal sent yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the button below to send a signal
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSendSignal}>
        Send a signal
      </Button>
    </div>
  )


  return (
    <div className="min-h-screen bg-background">
      {/* Main Split Layout */}
      <div className="max-w-none px-4 sm:px-6 lg:px-16 py-6">

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-96 min-h-[calc(100vh-8rem)]">

          {/* Left Sidebar - Profile */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-10rem)]">
              {profileSidebar}
            </div>
          </div>

          {/* Right Side - Bento Grid */}
          <div className="flex-1 min-w-0">
            <div className="h-full">
              <BentoGrid
                items={bentoItems}
                onItemsChange={handleBentoItemsChange}
                editable={true}
                className="w-full h-full"
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <TooltipProvider>
          <Dock direction="middle">
            {/* Navigation Items */}
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <Home className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Home</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <User className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Profile</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            <Separator orientation="vertical" className="h-full" />

            {/* Add Item Options */}
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAddItemWithType('text')}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <Type className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Text</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAddItemWithType('url')}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <Link className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Link</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAddItemWithType('image')}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <ImageIcon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Image</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAddItemWithType('embed')}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <Maximize2 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Embed</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            <Separator orientation="vertical" className="h-full py-2" />

            {/* Theme Toggle */}
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ModeToggle className="size-12 rounded-full" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Theme</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>

            {/* Logout */}
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400"
                    )}
                  >
                    <LogOut className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          </Dock>
        </TooltipProvider>
      </div>
    </div>
  )
}
