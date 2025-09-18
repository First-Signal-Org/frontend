import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// Simple API plugin for GitHub OAuth
function apiPlugin() {
  return {
    name: 'api-routes',
    configureServer(server: any) {
      // Load environment variables
      const env = loadEnv('', process.cwd(), '')
      // GitHub OAuth endpoint
      server.middlewares.use('/api/github-auth', async (req: any, res: any, next: any) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        
        if (req.method === 'POST') {
          try {
            let body = ''
            req.on('data', (chunk: any) => body += chunk)
            req.on('end', async () => {
              try {
                const { code } = JSON.parse(body)
                
                if (!code) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ success: false, error: 'Authorization code is required' }))
                  return
                }

                const clientSecret = env.VITE_GITHUB_CLIENT_SECRET
                if (!clientSecret) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: 'GitHub client secret not configured. Set VITE_GITHUB_CLIENT_SECRET in your .env file.' 
                  }))
                  return
                }

                console.log('🔄 Exchanging GitHub code for access token...')

                // Step 1: Exchange code for access token
                const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'First-Signal-App'
                  },
                  body: JSON.stringify({
                    client_id: env.VITE_GITHUB_CLIENT_ID,
                    client_secret: clientSecret,
                    code: code
                  })
                })

                if (!tokenResponse.ok) {
                  throw new Error(`GitHub token exchange failed: ${tokenResponse.status}`)
                }

                const tokenData = await tokenResponse.json()
                
                if (tokenData.error) {
                  throw new Error(tokenData.error_description || tokenData.error)
                }

                const accessToken = tokenData.access_token
                if (!accessToken) {
                  throw new Error('No access token received from GitHub')
                }

                console.log('✅ Successfully obtained access token')

                // Step 2: Fetch user data
                const userResponse = await fetch('https://api.github.com/user', {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'First-Signal-App'
                  }
                })

                if (!userResponse.ok) {
                  throw new Error(`Failed to fetch user data: ${userResponse.status}`)
                }

                const userData = await userResponse.json()

                // Step 3: Fetch user email if not public
                if (!userData.email) {
                  try {
                    const emailResponse = await fetch('https://api.github.com/user/emails', {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'First-Signal-App'
                      }
                    })

                    if (emailResponse.ok) {
                      const emails = await emailResponse.json()
                      const primaryEmail = emails.find((email: any) => email.primary)
                      if (primaryEmail) {
                        userData.email = primaryEmail.email
                      }
                    }
                  } catch (emailError) {
                    console.warn('Could not fetch user email:', emailError)
                  }
                }

                console.log('✅ Successfully fetched user data for:', userData.login)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  user: userData,
                  accessToken: accessToken
                }))

              } catch (error) {
                console.error('GitHub OAuth error:', error)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error'
                }))
              }
            })
          } catch (error) {
            console.error('API error:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: 'Internal server error' }))
          }
        } else {
          next()
        }
      })

      // Google OAuth endpoint
      server.middlewares.use('/api/google-auth', async (req: any, res: any, next: any) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'POST') {
          try {
            let body = ''
            req.on('data', (chunk: any) => body += chunk)
            req.on('end', async () => {
              try {
                const { credential } = JSON.parse(body)
                
                if (!credential) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ success: false, error: 'Google credential is required' }))
                  return
                }

                const clientSecret = env.VITE_GOOGLE_CLIENT_SECRET
                if (!clientSecret) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Google client secret not configured. Set VITE_GOOGLE_CLIENT_SECRET in your .env file.' 
                  }))
                  return
                }

                console.log('🔄 Verifying Google ID token...')

                // Verify the Google ID token
                const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                  }
                })

                if (!verifyResponse.ok) {
                  throw new Error(`Google token verification failed: ${verifyResponse.status}`)
                }

                const tokenData = await verifyResponse.json()
                
                if (tokenData.error) {
                  throw new Error(tokenData.error_description || tokenData.error)
                }

                // Verify the audience (client ID)
                if (tokenData.aud !== env.VITE_GOOGLE_CLIENT_ID) {
                  throw new Error('Invalid token audience')
                }

                console.log('✅ Successfully verified Google ID token for:', tokenData.email)

                // Extract user profile from verified token
                const userProfile = {
                  sub: tokenData.sub,
                  email: tokenData.email,
                  email_verified: tokenData.email_verified,
                  name: tokenData.name,
                  given_name: tokenData.given_name,
                  family_name: tokenData.family_name,
                  picture: tokenData.picture,
                  locale: tokenData.locale
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  profile: userProfile,
                  credential: credential
                }))

              } catch (error) {
                console.error('Google OAuth error:', error)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Internal server error'
                }))
              }
            })
          } catch (error) {
            console.error('API error:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: 'Internal server error' }))
          }
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    // basicSsl(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    apiPlugin(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000, // Match the port you authorized in Google Cloud Console
    headers: {
      'Permissions-Policy': 'identity-credentials-get=*',
    },
  },
})