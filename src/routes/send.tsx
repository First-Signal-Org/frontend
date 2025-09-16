import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { NeonGradientCard } from '@/components/ui/neon-gradient-card'
import { MagicCard } from '@/components/ui/magic-card'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { BorderBeam } from '@/components/ui/border-beam'
import { SparklesText } from '@/components/ui/sparkles-text'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { ComicText } from '@/components/ui/comic-text'
import { WarpBackground } from '@/components/ui/warp-background'

export const Route = createFileRoute('/send')({
  component: Send,
})

interface FormData {
  message: string
  telegram: string
  recipient: string
}

function Send() {
    const [theme] = useState<'dark' | 'light'>('dark')
    const [formData, setFormData] = useState<FormData>({
      message: '',
      telegram: '',
      recipient: ''
    })
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
    
    const isValid = formData.message.trim() && formData.recipient.trim()
  
    const handleInputChange = (field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = e.target.value
      setFormData(prev => ({ ...prev, [field]: value }))
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
      
      // Clear success/error messages when user starts typing again
      if (submitSuccess) {
        setSubmitSuccess(null)
      }
      if (submitError) {
        setSubmitError(null)
      }
    }
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
  
      setSubmitError(null)
      setSubmitSuccess(null)
  
      if (!formData.message.trim() || !formData.recipient.trim()) {
        setSubmitError('Please fill in all required fields.')
        return
      }
  
      try {
        setIsSubmitting(true)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        console.log('Sending message:', {
          recipient: formData.recipient,
          message: formData.message,
          from: formData.telegram || 'Anonymous'
        })
        
        setSubmitSuccess('Message sent successfully!')
        setFormData({ message: '', recipient: '', telegram: '' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    }
  
    const isButtonDisabled = isSubmitting || !isValid
  
    const formContent = (
      <div className="max-h-screen min-w-md p-8 flex justify-center items-center flex-row">
        <div className="max-w-2xl min-w-md p-0 space-y-8 w-full md:w-auto h-full">
          {/* Send Signal Card */}
          <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
            firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
            secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
          }} borderSize={1} opacity={0.9}>
            <MagicCard
              gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
              className="p-4"
              gradientOpacity={0.2}
              gradientSize={50}
            >
              <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
                <CardTitle>
                  <ComicText fontSize={3} style={{ color: "#ffffff" }}>
                  Send a Signal
                  </ComicText>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bio">
                        <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                        Message
                        </SparklesText>
                        </Label>
                      <div className="relative rounded-md mt-2">
                        <Input 
                        //   className={`min-h-32 w-full rounded-md border px-3 py-2 text-foreground resize-none`}
                          id="message" 
                          placeholder="What's on your mind?"
                          value={formData.message}
                          onChange={handleInputChange('message')}
                        />
                        <BorderBeam />
                      </div>
                      {errors.message && (
                        <span className="text-sm text-red-500">{errors.message}</span>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recipient">
                        <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                        Recipient handle
                        </SparklesText>
                      </Label>
                      <Input 
                        id="recipient" 
                        type="text"
                        placeholder="john_doe"
                        value={formData.recipient}
                        onChange={handleInputChange('recipient')}
                        className={errors.recipient ? 'border-red-500 mt-2' : 'mt-2'}
                      />
                      {errors.recipient && (
                        <span className="text-sm text-red-500">{errors.recipient}</span>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">
                        <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                        Your handle (optional)
                        </SparklesText>
                      </Label>
                      <Input 
                        id="telegram" 
                        type="text"
                        placeholder="john_doe"
                        value={formData.telegram}
                        onChange={handleInputChange('telegram')}
                        className={errors.telegram ? 'border-red-500 mt-2' : 'mt-2'}
                      />
                      {errors.telegram && (
                        <span className="text-sm text-red-500">{errors.telegram}</span>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="p-4 justify-center border-t border-border [.border-t]:pt-4">
                <div className="flex flex-col items-center gap-4 w-full">
                  <InteractiveHoverButton 
                    className="min-w-[25vw]" 
                    disabled={isButtonDisabled}
                    onClick={handleSubmit}
                    type="submit"
                  >
                    <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </SparklesText>
                  </InteractiveHoverButton>
                  
                  {submitError && (
                    <div className="text-sm text-red-500 text-center">
                      Error: {submitError}
                    </div>
                  )}
                  
                  {submitSuccess && (
                    <div className="text-sm text-green-500 text-center">
                      {submitSuccess}
                    </div>
                  )}
                </div>
              </CardFooter>
            </MagicCard>
          </NeonGradientCard>
        </div>
      </div>
    )
    
    return (
      <>
        <div className="hidden md:block">
          <WarpBackground perspective={1000} className="w-full h-full" gridColor={"hsl(var(--secondary))"} beamSize={2} beamsPerSide={2}>
            {formContent}
          </WarpBackground>
        </div>
  
        <div className="md:hidden">
          {formContent}
        </div>
      </>
    )
  }
