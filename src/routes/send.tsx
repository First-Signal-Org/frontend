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
  phoneNumber: string
}

// Simple phone number validation function
const validatePhoneNumber = (phone: string): string | null => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Check if it's a valid US phone number (10 digits) or international (starts with +)
  if (phone.startsWith('+')) {
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return 'Please enter a valid international phone number (e.g., +1234567890)'
    }
  } else if (digitsOnly.length === 10) {
    // US phone number format
    return null
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    // US phone number with country code
    return null
  } else {
    return 'Please enter a valid phone number (e.g., +1234567890 or 1234567890)'
  }
  
  return null
}

function Send() {
    const [theme] = useState<'dark' | 'light'>('dark')
    const [formData, setFormData] = useState<FormData>({
      message: '',
      phoneNumber: ''
    })
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
    
    const isValid = formData.message.trim() && formData.phoneNumber.trim()
  
    const handleInputChange = (field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      let value = e.target.value
      
      // Format phone number as user types (only for phone number field)
      if (field === 'phoneNumber' && !value.startsWith('+')) {
        // Only format if it's not an international number
        const digitsOnly = value.replace(/\D/g, '')
        if (digitsOnly.length <= 10) {
          if (digitsOnly.length >= 6) {
            value = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
          } else if (digitsOnly.length >= 3) {
            value = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`
          }
        }
      }
      
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
  
      if (!formData.message.trim() || !formData.phoneNumber.trim()) {
        setSubmitError('Please fill in all required fields.')
        return
      }
      
      // Validate phone number
      const phoneError = validatePhoneNumber(formData.phoneNumber)
      if (phoneError) {
        setSubmitError(phoneError)
        return
      }
  
      try {
        setIsSubmitting(true)
        
        // Call messaging API endpoint
        // Format phone number for API (remove formatting, ensure + prefix for international)
        let phoneForAPI = formData.phoneNumber.replace(/\D/g, '')
        if (!formData.phoneNumber.startsWith('+')) {
          // Add +1 for US numbers
          if (phoneForAPI.length === 10) {
            phoneForAPI = `+1${phoneForAPI}`
          } else if (phoneForAPI.length === 11 && phoneForAPI.startsWith('1')) {
            phoneForAPI = `+${phoneForAPI}`
          }
        } else {
          phoneForAPI = formData.phoneNumber
        }
        
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:10000'}/api/messaging/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: phoneForAPI,
            message: formData.message
          })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }
        
        console.log('Message sent successfully:', data)
        setSubmitSuccess(`Message sent successfully! SID: ${data.sid}`)
        setFormData({ message: '', phoneNumber: '' })
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
                  Send SMS Message
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
                          placeholder="Enter your message..."
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
                      <Label htmlFor="phoneNumber">
                        <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                        Phone Number
                        </SparklesText>
                      </Label>
                      <Input 
                        id="phoneNumber" 
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={handleInputChange('phoneNumber')}
                        className={errors.phoneNumber ? 'border-red-500 mt-2' : 'mt-2'}
                      />
                      {errors.phoneNumber && (
                        <span className="text-sm text-red-500">{errors.phoneNumber}</span>
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
