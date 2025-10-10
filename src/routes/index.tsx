import { createFileRoute } from '@tanstack/react-router'
import { PixelImage } from '@/components/ui/pixel-image'
import { SmoothCursor } from '@/components/ui/smooth-cursor'
import { Notification } from '@/components/notification'
import { notificationManager, type NotificationItem } from '@/lib/notifications'
import { AnimatedList } from '@/components/ui/animated-list'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

function App() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications)
    })
    
    // Initial load
    setNotifications(notificationManager.getNotifications())

    return unsubscribe
  }, [])

  return (
    <div className="text-center cursor-hidden px-12 py-2">
      {/* <AnimatedThemeToggler /> */}
    <div className="flex flex-row items-center justify-center gap-12">
    <div className="w-1/2 ">
      <PixelImage
      src="/doraemon-cupid.jpg"
      customGrid={{ rows: 4, cols: 6 }}
      grayscaleAnimation
      maxAnimationDelay={2200}
      colorRevealDelay={2000}
    />
    </div>  
    <div className='w-1/2 items-start'>
    <div
      className="relative flex h-[500px] w-full flex-col overflow-hidden p-2"
    >
      <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>
 
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
    </div>
    <div className='mt-6 space-y-4'>
      <div className='space-y-2'>
        <p className='text-lg text-foreground dark:text-foreground'>
          Ever had a crush but were too afraid to confess?
        </p>
      </div>
      <button className='bg-primary hover:bg-primary/80 transition-colors duration-200 text-white font-semibold px-6 py-3 rounded-lg shadow-md' onClick={() => navigate({ to: '/send' })}>
        Click here
      </button>
    </div>

    </div>
    </div>
    <SmoothCursor />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: App,
})

