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
    const { credential } = req.body;
    
    if (!credential) {
      res.status(400).json({ success: false, error: 'Google credential is required' });
      return;
    }

    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      res.status(500).json({ 
        success: false, 
        error: 'Google client secret not configured. Set VITE_GOOGLE_CLIENT_SECRET in your environment variables.' 
      });
      return;
    }

    console.log('🔄 Verifying Google ID token...');

    // Verify the Google ID token
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!verifyResponse.ok) {
      throw new Error(`Google token verification failed: ${verifyResponse.status}`);
    }

    const tokenData = await verifyResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    // Verify the audience (client ID)
    if (tokenData.aud !== process.env.VITE_GOOGLE_CLIENT_ID) {
      throw new Error('Invalid token audience');
    }

    console.log('✅ Successfully verified Google ID token for:', tokenData.email);

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
    };

    res.status(200).json({
      success: true,
      profile: userProfile,
      credential: credential
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
