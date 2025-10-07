import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MagicCard } from '@/components/ui/magic-card'
import { NeonGradientCard } from '@/components/ui/neon-gradient-card'
import { WarpBackground } from '@/components/ui/warp-background'
import { Github, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  createGoogleAuthClientService,
  type GoogleAuthResult, 
  type GoogleUserProfile 
} from '@/lib/google-auth-client'
import { 
  createGitHubAuthClientService,
  type GitHubAuthResult,
  type GitHubUser 
} from '@/lib/github-auth-client'
import { type UserProfile } from '@/lib/user-service'
import { validateEnvironment } from '@/lib/config'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

// Google Icon component since lucide-react doesn't have Google
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function RouteComponent() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState<'google' | 'github' | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<GoogleUserProfile | GitHubUser | null>(null)
    const [_, setBackendUser] = useState<UserProfile | null>(null)
    const [authProvider, setAuthProvider] = useState<'google' | 'github' | null>(null)
    const [theme, setTheme] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        }
        return 'light'
    })

    // Initialize Auth Services (safe initialization)
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

    // Watch for theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })

        return () => observer.disconnect()
    }, [])

    // Check environment and stored auth on mount
    useEffect(() => {
        const { isValid, errors } = validateEnvironment()
        if (!isValid && typeof window !== 'undefined') {
            setError(`Setup needed: ${errors.join(', ')}`)
        }

        // Check if user is already signed in with Google
        if (googleAuthService && typeof window !== 'undefined') {
            try {
                if (googleAuthService.isSignedIn()) {
                    const profile = googleAuthService.getStoredProfile()
                    if (profile) {
                        setUser(profile)
                        setAuthProvider('google')
                        // Automatically redirect to dashboard if already authenticate
                        navigate({ to: '/dashboard' })
                        return
                    }
                }
            } catch (error) {
                console.warn('Error checking stored Google auth:', error)
            }
        }

        // Check if user is already signed in with GitHub
        if (githubAuthService && typeof window !== 'undefined') {
            try {
                if (githubAuthService.isSignedIn()) {
                    const githubUser = githubAuthService.getStoredUser()
                    if (githubUser) {
                        setUser(githubUser)
                        setAuthProvider('github')
                        // Automatically redirect to dashboard if already authenticated
                        navigate({ to: '/dashboard' })
                        return
                    }
                }
            } catch (error) {
                console.warn('Error checking stored GitHub auth:', error)
            }
        }
    }, [googleAuthService, githubAuthService, navigate])

    const handleGoogleLogin = async () => {
        if (!googleAuthService) {
            setError('Google Auth service is not available')
            return
        }

        setIsLoading('google')
        setError(null)
        
        try {
            const result: GoogleAuthResult = await googleAuthService.signInWithPopup()
            
            if (result.success && result.profile && result.credential) {
                // Store the credential for future use
                googleAuthService.storeCredential(result.credential)
                setUser(result.profile)
                setBackendUser(result.user || null)
                setAuthProvider('google')
                
                console.log('Google login successful:', {
                    user: result.profile.name,
                    email: result.profile.email,
                    backendUser: result.user ? 'Created/Found' : 'Failed',
                    backendError: result.error || 'None'
                })

                // Show backend integration status
                if (result.error) {
                    console.warn('Backend integration warning:', result.error)
                }

                // Navigate to dashboard immediately after successful login
                navigate({ to: '/dashboard' })
                
            } else {
                setError(result.error || 'Google authentication failed')
            }
        } catch (error) {
            console.error('Google login failed:', error)
            setError(error instanceof Error ? error.message : 'Authentication failed')
        } finally {
            setIsLoading(null)
        }
    }

    const handleGithubLogin = async () => {
        if (!githubAuthService) {
            setError('GitHub Auth service is not available')
            return
        }

        setIsLoading('github')
        setError(null)
        
        try {
            const result: GitHubAuthResult = await githubAuthService.signInWithPopup()
            
            if (result.success && result.user && result.accessToken) {
                // Store the user data for future use
                githubAuthService.storeUserData(result.user, result.accessToken)
                setUser(result.user)
                setBackendUser(result.backendUser || null)
                setAuthProvider('github')
                
                console.log('GitHub login successful:', {
                    user: result.user.name || result.user.login,
                    username: result.user.login,
                    backendUser: result.backendUser ? 'Created/Found' : 'Failed',
                    backendError: result.error || 'None'
                })

                // Show backend integration status
                if (result.error) {
                    console.warn('Backend integration warning:', result.error)
                }

                // Navigate to dashboard immediately after successful login
                navigate({ to: '/dashboard' })
                
            } else {
                setError(result.error || 'GitHub authentication failed')
            }
        } catch (error) {
            console.error('GitHub login failed:', error)
            setError(error instanceof Error ? error.message : 'GitHub authentication failed')
        } finally {
            setIsLoading(null)
        }
    }

    const handleLogout = async () => {
        if (authProvider === 'google' && googleAuthService) {
            await googleAuthService.signOut()
            googleAuthService.clearStoredCredential()
        } else if (authProvider === 'github' && githubAuthService) {
            await githubAuthService.signOut()
            githubAuthService.clearStoredData()
        }
        setUser(null)
        setBackendUser(null)
        setAuthProvider(null)
        setError(null)
    }

    // Show success state if user is logged in
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <NeonGradientCard 
                        className="p-0 bg-card w-full shadow-none border-1 border-border" 
                        neonColors={{
                            firstColor: "hsl(142, 76%, 36%)", // Success green
                            secondColor: "hsl(142, 76%, 36%)"
                        }} 
                        borderSize={2} 
                    >
                        <MagicCard
                            gradientColor="hsl(142, 76%, 36%)"
                            className="p-6"
                            gradientOpacity={0.2}
                            gradientSize={100}
                        >
                            <CardHeader className="text-center pb-4">
                                <div className="flex justify-center mb-4">
                                    <img 
                                        src={'picture' in user ? user.picture : user.avatar_url} 
                                        alt={authProvider === 'google' ? (user as GoogleUserProfile).name : (user as GitHubUser).name || (user as GitHubUser).login}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
                                    />
                                </div>
                                <CardTitle className="text-2xl font-bold text-green-600">
                                    Welcome, {authProvider === 'google' ? (user as GoogleUserProfile).given_name : (user as GitHubUser).name || (user as GitHubUser).login}!
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Successfully signed in with {authProvider === 'google' ? 'Google' : 'GitHub'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {authProvider === 'google' ? (user as GoogleUserProfile).email : (user as GitHubUser).email || `@${(user as GitHubUser).login}`}
                                </p>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                                <div className="text-center text-sm text-muted-foreground">
                                    Redirecting to dashboard...
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                                >
                                    Sign out
                                </button>
                            </CardContent>
                        </MagicCard>
                    </NeonGradientCard>
                </div>
            </div>
        )
    }
    const loginCard = (
        <div className="max-w-md w-full min-w-md">
            <NeonGradientCard 
                className="p-0 bg-card w-full shadow-none border-1 border-border" 
                neonColors={{
                    firstColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))",
                    secondColor: theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"
                }} 
                borderSize={2} 
            >
                <MagicCard
                    gradientColor={theme === "dark" ? "hsl(var(--primary))" : "hsl(var(--primary))"}
                    className="p-6"
                    gradientOpacity={0.2}
                    gradientSize={100}
                >
                    <CardHeader className="text-center pb-2 border-b border-border">
                        <div className="flex justify-center mb-4">
                            <img 
                                src="/login.png" 
                                alt="Doraemon Login" 
                                className="w-48 h-48 object-contain"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Welcome to First Signal
                        </CardTitle>
                        <p className="text-muted-foreground">
                            Sign in to your account
                        </p>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-6">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <div className="text-sm">
                                    {error.includes('Setup needed') ? (
                                        <div>
                                            <p className="font-medium">Google Auth Setup Required</p>
                                            <p className="text-xs mt-1">
                                                Please configure VITE_GOOGLE_CLIENT_ID in your environment variables.
                                            </p>
                                        </div>
                                    ) : (
                                        error
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading !== null}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                                "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                "shadow-sm hover:shadow-md"
                            )}
                        >
                            {isLoading === 'google' ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                            ) : (
                                <GoogleIcon className="w-5 h-5" />
                            )}
                            <span>Continue with Google</span>
                        </button>

                        <button
                            onClick={handleGithubLogin}
                            disabled={isLoading !== null}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                                "bg-gray-900 hover:bg-gray-800 text-white border border-gray-700",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                "shadow-sm hover:shadow-md"
                            )}
                        >
                            {isLoading === 'github' ? (
                                <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Github className="w-5 h-5" />
                            )}
                            <span>Continue with GitHub</span>
                        </button>
                    </CardContent>
                </MagicCard>
            </NeonGradientCard>
        </div>
    )

    return (
        <>
            {/* Desktop with WarpBackground */}
            <div className="hidden md:block">
                <WarpBackground 
                    perspective={1000} 
                    className="min-h-screen flex items-center justify-center p-4" 
                    gridColor="hsl(var(--secondary))" 
                    beamSize={2} 
                    beamsPerSide={2}
                >
                    {loginCard}
                </WarpBackground>
            </div>

            {/* Mobile without WarpBackground */}
            <div className="md:hidden min-h-screen flex items-center justify-center p-4">
                {loginCard}
            </div>
        </>
    )
}
