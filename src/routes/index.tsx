import { createFileRoute } from '@tanstack/react-router'
import { PixelImage } from '@/components/ui/pixel-image'
import { SmoothCursor } from '@/components/ui/smooth-cursor'
import { Notification } from '@/components/notification'
import { notificationManager, type NotificationItem } from '@/lib/notifications'
import { AnimatedList } from '@/components/ui/animated-list'
import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react' 
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid';
import { items as initialItems } from '@/lib/bento-items';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

function App() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [bentoItems, setBentoItems] = useState<BentoItem[]>(initialItems);

  useEffect(() => {
    const unsubscribeNotifications = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications)
    })
    setNotifications(notificationManager.getNotifications())
    return unsubscribeNotifications
  }, [])

  return (
    <div className="w-full text-center cursor-hidden bg-background">
      <div className="relative">
        <div className="sticky top-0 flex h-screen items-center justify-center">
          <div
            className="flex h-full w-full flex-row items-center justify-center gap-12 p-12 animate-section-fade-out"
            style={{ '--fadeOut-range-start': '0%', '--fadeOut-range-end': '100vh' } as React.CSSProperties}
          >
            {/* Left Column */}
            <div className="w-1/2 h-full flex items-center justify-center">
              <div className="max-h-full overflow-hidden rounded-xl">
                <PixelImage
                  src="/doraemon-cupid.jpg"
                  customGrid={{ rows: 4, cols: 6 }}
                  grayscaleAnimation
                  maxAnimationDelay={2200}
                  colorRevealDelay={2000}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className='w-1/2 h-full flex flex-col items-start justify-center'>
              <div className="relative w-full flex-1 min-h-0 flex flex-col p-2">
                <AnimatedList>
                  {notifications.map((item, idx) => (
                    <Notification {...item} key={idx} />
                  ))}
                </AnimatedList>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
              </div>
              <div className='mt-6 space-y-4'>
                <p className='text-lg text-foreground'>
                  Ever had a crush but were too afraid to confess?
                </p>
                <button
                  className='bg-primary hover:bg-primary/80 transition-colors duration-200 text-white font-semibold px-6 py-3 rounded-lg shadow-md'
                  onClick={() => navigate({ to: '/login' })}
                >
                  Click here
                </button>
              </div>
            </div>
          </div>
        </div>

                  {/* Cards section */}
        <div className="relative z-10 pt-[100vh] animate-section-fade-in animate-section-fade-out"
        style={{ '--fadeIn-range-start': '100vh', '--fadeIn-range-end': '150vh' } as React.CSSProperties}
        >
          <div className="bg-background py-16">
            <div className="mx-auto w-full max-w-6xl px-4">
              <h2 className="mb-8 text-2xl font-bold">What our users say</h2>
              <BentoGrid items={bentoItems} onItemsChange={setBentoItems} editable={false} />
            </div>
          </div>
          {/* CTA section */}
          <div className="bg-background py-16 animate-section-fade-in "
          style={{ '--fadeIn-range-start': '200vh', '--fadeIn-range-end': '250vh' } as React.CSSProperties}
          >
            <div className="flex w-full items-center justify-center">
              <Card className="max-w-lg">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <h2 className="mb-4 text-center text-3xl font-bold">Ready to confess your feelings?</h2>
                  <p className="mb-6 text-center text-muted-foreground">
                    Let your crush know how you feel. It's anonymous, simple, and could be the start of something special.
                  </p>
                  <Button size="lg" onClick={() => navigate({ to: '/login' })}>Let's do it!</Button>
                </CardContent>
              </Card>
            </div>
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
