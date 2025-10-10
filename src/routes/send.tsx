import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MagicCard } from '@/components/ui/magic-card'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SparklesText } from '@/components/ui/sparkles-text'
import { ComicText } from '@/components/ui/comic-text'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/send')({
  component: Send,
})

interface FormData {
  message: string
  phoneNumber: string
  telegramUsername: string
  messageService: 'sms' | 'telegram'
  senderHandle: string
  promptText: string
  useEnvelope: boolean
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

// Simple Telegram username validation function
const validateTelegramUsername = (username: string): string | null => {
  // Remove @ if present
  const cleanUsername = username.replace('@', '')
  
  // Check if it's a valid username format (5-32 characters, alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(cleanUsername)) {
    return 'Please enter a valid Telegram username (5-32 characters, letters, numbers, and underscores only)'
  }
  
  return null
}

// Telegram service class
class TelegramService {
  private baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:10000'

  async sendMessageToUser(
    username: string, 
    message: string, 
    senderHandle?: string,
    promptText?: string,
    useEnvelope: boolean = true
  ): Promise<{
    success: boolean
    message: string
    error?: string
    chatId?: string
    resolvedUsername?: string
    source?: string
  }> {
    try {
      // Step 1: Resolve username to chat_id
      const resolveResponse = await fetch(`${this.baseUrl}/api/telegram/resolve/${username.replace('@', '')}`)
      const resolveData = await resolveResponse.json()

      if (!resolveResponse.ok) {
        return {
          success: false,
          message: 'Failed to resolve username',
          error: resolveData.error || 'User not found'
        }
      }

      // Step 2: Send message using the resolved chat_id with envelope support
      const sendPayload: any = {
        chat_id: resolveData.chat_id,
        text: message,
        use_envelope: useEnvelope,
        protect_content: true
      }

      // Add optional envelope parameters
      if (senderHandle) {
        sendPayload.sender_handle = senderHandle
      }
      if (promptText) {
        sendPayload.prompt_text = promptText
      }

      const sendResponse = await fetch(`${this.baseUrl}/api/telegram/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendPayload)
      })

      const sendData = await sendResponse.json()

      if (!sendResponse.ok) {
        return {
          success: false,
          message: 'Failed to send message',
          error: sendData.error || 'Unknown error'
        }
      }

      return {
        success: true,
        message: 'Message sent successfully!',
        chatId: resolveData.chat_id,
        resolvedUsername: resolveData.username,
        source: resolveData.source
      }

    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

function Send() {
    const [theme] = useState<'dark' | 'light'>('dark')
    const [formData, setFormData] = useState<FormData>({
      message: '',
      phoneNumber: '',
      telegramUsername: '',
      messageService: 'sms',
      senderHandle: '',
      promptText: 'Do you want to receive this message?',
      useEnvelope: true
    })
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
    
    const telegramService = new TelegramService()
    
    const isValid = formData.message.trim() && 
      ((formData.messageService === 'sms' && formData.phoneNumber.trim()) ||
       (formData.messageService === 'telegram' && formData.telegramUsername.trim()))
  
    const handleInputChange = (field: keyof FormData) => (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      let value: string | boolean = e.target.value
      
      // Handle checkbox inputs
      if (field === 'useEnvelope' && e.target.type === 'checkbox') {
        value = (e.target as HTMLInputElement).checked
      }
      
      // Format phone number as user types (only for phone number field)
      if (field === 'phoneNumber' && typeof value === 'string' && !value.startsWith('+')) {
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
  
      if (!formData.message.trim()) {
        setSubmitError('Please enter a message.')
        return
      }

      if (formData.messageService === 'sms') {
        if (!formData.phoneNumber.trim()) {
          setSubmitError('Please enter a phone number.')
          return
        }
        
        // Validate phone number
        const phoneError = validatePhoneNumber(formData.phoneNumber)
        if (phoneError) {
          setSubmitError(phoneError)
          return
        }
      } else if (formData.messageService === 'telegram') {
        if (!formData.telegramUsername.trim()) {
          setSubmitError('Please enter a Telegram username.')
          return
        }
        
        // Validate Telegram username
        const usernameError = validateTelegramUsername(formData.telegramUsername)
        if (usernameError) {
          setSubmitError(usernameError)
          return
        }
      }
  
      try {
        setIsSubmitting(true)
        
        if (formData.messageService === 'sms') {
          // SMS messaging logic
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
          
          console.log('SMS sent successfully:', data)
          setSubmitSuccess(`SMS sent successfully! SID: ${data.sid}`)
          
        } else if (formData.messageService === 'telegram') {
          // Telegram messaging logic with envelope support
          const result = await telegramService.sendMessageToUser(
            formData.telegramUsername, 
            formData.message,
            formData.senderHandle || undefined,
            formData.promptText || undefined,
            formData.useEnvelope
          )
          
          if (!result.success) {
            throw new Error(result.error || result.message)
          }
          
          console.log('Telegram message sent successfully:', result)
          const envelopeInfo = formData.useEnvelope ? ' (with envelope)' : ' (direct)'
          setSubmitSuccess(`Telegram message sent successfully to @${result.resolvedUsername}${envelopeInfo}! (Source: ${result.source})`)
        }
        
        // Clear form on success
        setFormData({ 
          message: '', 
          phoneNumber: '', 
          telegramUsername: '', 
          messageService: formData.messageService,
          senderHandle: '',
          promptText: 'Do you want to receive this message?',
          useEnvelope: true
        })
        
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
          {/* <NeonGradientCard className="p-0 bg-card min-w-md w-full shadow-none border-1 border-border" neonColors={{
            firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
            secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
          }} borderSize={1} opacity={0.9}> */}
            <MagicCard
              gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
              className="p-4 border-1 border-border rounded-xl bg-gray-100"
              gradientOpacity={0.2}
              gradientSize={50}
            >
              <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
                <CardTitle>
                  <ComicText fontSize={2.5} style={{ color: "#ffffff" }}>
                  {`Send Message`}
                  </ComicText>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    {/* Service Selection */}
                    <div className="flex flex-row items-center justify-center">
                      <div className="flex flex-row items-center justify-between">
                        <label className={`flex items-center space-x-2 p-2 mr-32 min-w-36 ${formData.messageService === 'sms' ? 'border-pink-500 border-b-2' : 'border-gray-300 border-b-1'} hover:bg-primary/10 rounded-t-md cursor-pointer`}>
                          <input
                            type="radio"
                            name="messageService"
                            value="sms"
                            checked={formData.messageService === 'sms'}
                            onChange={handleInputChange('messageService')}
                            className="hidden"
                          />
                         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 40 40" id="imessage">
  <defs>
    <linearGradient id="a" x1="50%" x2="50%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#86FC6F"></stop>
      <stop offset="100%" stop-color="#0CD419"></stop>
    </linearGradient>
  </defs>
  <g fill="none" fill-rule="evenodd">
    <circle cx="20" cy="20" r="20" fill="url(#a)"></circle>
    <path fill="#FFF" d="M18.2668118,29.8443217 L18.2814837,29.8495979 C18.2814837,29.8495979 18.2610147,29.8453482 18.2225776,29.838829 C18.13452,29.8277541 18.0467591,29.8158772 17.9593048,29.8032099 C17.3326588,29.736367 15.906312,29.6986819 14.7114519,30.5065113 C13.3873071,31.4076176 11.4096883,31.9716688 10.7837289,31.7274759 C10.7115029,31.6965219 12.4036567,30.1006695 12.7166364,29.1376551 C13.1018421,27.9579625 12.3039159,27.7000122 12.3039159,27.7000122 L12.4188101,27.7413292 C9.44843909,25.8234836 7.53333333,22.898022 7.53333333,19.95 C7.53333333,14.4267123 13.115,9.95 20,9.95 C26.885,9.95 32.4666667,14.4267123 32.4666667,19.95 C32.4666667,25.4732877 26.885,29.95 20,29.95 C19.4118714,29.95 18.8332531,29.9137555 18.2668117,29.8443217 Z"></path>
  </g>
</svg>
                        <span className="text-lg font-bold text-foreground">SMS</span>
                        </label>
                        <label className={`flex items-center space-x-2 p-2 mr-8 ${formData.messageService === 'telegram' ? 'border-pink-500 border-b-2' : 'border-gray-300 border-b-1'} hover:bg-primary/10 rounded-t-md cursor-pointer`}>
                          <input
                            type="radio"
                            name="messageService"
                            value="telegram"
                            checked={formData.messageService === 'telegram'}
                            onChange={handleInputChange('messageService')}
                            className="hidden"
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 48 48" id="telegram">
                            <rect width="48" height="48" fill="#419FD9" rx="24"></rect>
                            <rect width="48" height="48" fill="url(#paint0_linear)" rx="24"></rect>
                            <path fill="#fff" d="M10.7874 23.4709C17.7667 20.3663 22.4206 18.3195 24.7493 17.3305C31.3979 14.507 32.7795 14.0165 33.68 14.0002C33.878 13.9968 34.3208 14.0469 34.6077 14.2845C34.8499 14.4852 34.9165 14.7563 34.9484 14.9465C34.9803 15.1368 35.02 15.5702 34.9884 15.9088C34.6281 19.774 33.0692 29.1539 32.276 33.483C31.9404 35.3148 31.2796 35.929 30.6399 35.9891C29.2496 36.1197 28.1938 35.051 26.8473 34.1497C24.7401 32.7395 23.5498 31.8615 21.5044 30.4854C19.1407 28.895 20.673 28.0209 22.0201 26.5923C22.3726 26.2185 28.4983 20.5295 28.6169 20.0135C28.6317 19.9489 28.6455 19.7083 28.5055 19.5813C28.3655 19.4543 28.1589 19.4977 28.0098 19.5322C27.7985 19.5812 24.4323 21.8529 17.9113 26.3473C16.9558 27.0172 16.0904 27.3435 15.315 27.3264C14.4602 27.3076 12.8159 26.833 11.5935 26.4273C10.0942 25.9296 8.90254 25.6666 9.0063 24.8215C9.06035 24.3813 9.65403 23.9311 10.7874 23.4709Z"></path>
                            <defs>
                              <linearGradient id="paint0_linear" x1="24" x2="24" y2="47.644" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#2AABEE"></stop>
                                <stop offset="1" stop-color="#229ED9"></stop>
                              </linearGradient>
                            </defs>
                        </svg>
                        <span className="text-lg font-bold text-foreground">Telegram</span>
                        </label>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="grid gap-2">
                      <Label htmlFor="message">
                        <SparklesText className="text-foreground text-lg font-medium" sparklesCount={3}>
                        Message
                        </SparklesText>
                        </Label>
                      <div className="relative rounded-md mt-2">
                        <Input 
                          id="message" 
                          placeholder="Enter your message..."
                          value={formData.message}
                          onChange={handleInputChange('message')}
                          className="py-6"
                        />
                      </div>
                      {errors.message && (
                        <span className="text-sm text-red-500">{errors.message}</span>
                      )}
                    </div>

                    {/* Conditional Input Fields */}
                    {formData.messageService === 'sms' && (
                      <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">
                          <SparklesText className="text-foreground text-lg font-medium" sparklesCount={0}>
                          Phone Number
                          </SparklesText>
                        </Label>
                        <Input 
                          id="phoneNumber" 
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phoneNumber}
                          onChange={handleInputChange('phoneNumber')}
                          className={`${errors.phoneNumber ? 'border-red-500 mt-2' : 'mt-2'} py-6`}
                        />
                        {errors.phoneNumber && (
                          <span className="text-sm text-red-500">{errors.phoneNumber}</span>
                        )}
                      </div>
                    )}

                    {formData.messageService === 'telegram' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="telegramUsername">
                            <SparklesText className="text-foreground text-lg font-medium" sparklesCount={0}>
                            Telegram Username
                            </SparklesText>
                          </Label>
                          <Input 
                            id="telegramUsername" 
                            type="text"
                            placeholder="@username or username"
                            value={formData.telegramUsername}
                            onChange={handleInputChange('telegramUsername')}
                            className={`${errors.telegramUsername ? 'border-red-500 mt-2' : 'mt-2'} py-6`}
                          />
                          {errors.telegramUsername && (
                            <span className="text-sm text-red-500">{errors.telegramUsername}</span>
                          )}
                        </div>
                            <div className="grid gap-2">
                              <Label htmlFor="senderHandle">
                                <SparklesText className="text-foreground text-lg font-medium" sparklesCount={0}>
                                Your Handle (Optional)
                                </SparklesText>
                              </Label>
                              <Input 
                                id="senderHandle" 
                                type="text"
                                placeholder="your_username"
                                value={formData.senderHandle}
                                onChange={handleInputChange('senderHandle')}
                                className="mt-2 py-6"
                              />
                            </div>

                            {/* <div className="grid gap-2">
                              <Label htmlFor="promptText">
                                <SparklesText className="text-foreground text-lg font-medium" sparklesCount={0}>
                                Custom Prompt (Optional)
                                </SparklesText>
                              </Label>
                              <Input 
                                id="promptText" 
                                type="text"
                                placeholder="Do you want to receive this message?"
                                value={formData.promptText}
                                onChange={handleInputChange('promptText')}
                                className="mt-2 py-6"
                              />
                            </div> */}
                          
                      </>
                    )}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="p-4 justify-center">
                <div className="flex flex-col items-start gap-4 w-full">
                  <Button 
                    className="rounded-full py-6 px-12 disabled:bg-transparent disabled:text-foreground disabled:border-primary disabled:border-1 disable:font-light disabled:cursor-not-allowed" 
                    disabled={isButtonDisabled}
                    onClick={handleSubmit}
                    type="submit"
                  >
                    <SparklesText className="text-foreground text-lg font-medium" sparklesCount={0}>
                      {isSubmitting 
                        ? (formData.messageService === 'sms' ? 'Sending...' : 'Sending...') 
                        : (formData.messageService === 'sms' ? 'Send' : 'Send')
                      }
                    </SparklesText>
                  </Button>
                  
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
          {/* </NeonGradientCard> */}
        </div>
      </div>
    )
    
    return (
      <>
         <div className="hidden md:block relative w-full min-h-[80vh]">
          {/* Ellipse gradient with white center and primary foci */}
            <div className="absolute inset-0 translate-y-[-50vh] backdrop-blur-sm bg-[linear-gradient(180deg,_transparent_0%,_hsl(var(--background))_30%,_hsl(var(--background))_50%,_hsl(var(--primary)/1)_70%,_transparent_100%)]"></div>
          <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_450px_1200px_at_50%_50%,_hsl(var(--background))_0%,_hsl(var(--background))_30%,_hsl(var(--background))_70%,_transparent_90%)]"></div>
          {/* Left side gradient */}
          {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_1000px_1000px_at_0%_0%,_hsl(var(--primary))_0%,_hsl(var(--primary)/0.5)_40%,_transparent_60%)]"></div> */}
          <div className="relative z-10">
            {formContent}
          </div>
        <div className="absolute top-72 left-56 inset-0 blur-sm rotate-5">
        <img src="/doraemon.png" alt="Doraemon" className="w-18 object-cover" />
        </div>
        <div className="absolute top-24 right-56 blur-md rotate-40">
        <img src="/doraemon.png" alt="Doraemon" className="w-18 object-cover" />
        </div>
        <div className="absolute bottom-24 left-56 rotate-10">
        <img src="/login.png" alt="Doraemon" className="w-48 object-cover" />
        </div>
        <div className="absolute bottom-56 right-64 rotate-10">
        <img src="/doraemon.png" alt="Doraemon" className="w-18 object-cover" />
        </div>
        <div className="absolute p-2 z-200 bg-primary rounded-sm text-white font-bold text-sm bottom-20 right-152 rotate-10 overflow-hidden">
        <div className="relative">
          <span className="relative z-10">Spill your feelings</span>
          <div className="absolute inset-0 w-18 h-48 translate-y-[-50%] bg-black transform -translate-x-full animate-[pulse-sweep_3s_linear_infinite] delay-0"></div>
        </div>
        </div>
        <div className="absolute p-2 z-200 bg-primary rounded-sm text-white font-bold text-sm bottom-20 left-152 rotate-[-10deg] overflow-hidden">
        <div className="relative">
          <span className="relative z-10">Keep your cool</span>
          <div className="absolute inset-0 w-18 h-48 translate-y-[-50%] bg-black transform -translate-x-full animate-[pulse-sweep_3s_linear_infinite] delay-2000"></div>
        </div>
        </div>
        </div>
  
        <div className="md:hidden">
          {formContent}
        </div>
      </>
    )
  }
