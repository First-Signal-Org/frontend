export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { code } = req.body;
    
    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code is required' });
      return;
    }

    const clientSecret = process.env.VITE_GITHUB_CLIENT_SECRET;
    if (!clientSecret) {
      res.status(500).json({ 
        success: false, 
        error: 'GitHub client secret not configured. Set VITE_GITHUB_CLIENT_SECRET in your environment variables.' 
      });
      return;
    }

    console.log('🔄 Exchanging GitHub code for access token...');

    // Step 1: Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'First-Signal-App'
      },
      body: JSON.stringify({
        client_id: process.env.VITE_GITHUB_CLIENT_ID,
        client_secret: clientSecret,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('No access token received from GitHub');
    }

    console.log('✅ Successfully obtained access token');

    // Step 2: Fetch user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'First-Signal-App'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Step 3: Fetch user email if not public
    if (!userData.email) {
      try {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'First-Signal-App'
          }
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primaryEmail = emails.find((email) => email.primary);
          if (primaryEmail) {
            userData.email = primaryEmail.email;
          }
        }
      } catch (emailError) {
        console.warn('Could not fetch user email:', emailError);
      }
    }

    console.log('✅ Successfully fetched user data for:', userData.login);

    res.status(200).json({
      success: true,
      user: userData,
      accessToken: accessToken
    });

  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
