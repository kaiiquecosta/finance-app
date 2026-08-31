/** OAuth2 access token para Android Publisher API (service account). */
export async function getGooglePlayAccessToken(): Promise<string> {
  const raw = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
  if (!raw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON não configurado')

  const sa = JSON.parse(raw) as { client_email: string; private_key: string }
  if (!sa.client_email || !sa.private_key) {
    throw new Error('JSON da service account inválido')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = btoa(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )

  const pem = sa.private_key.replace(/\\n/g, '\n')
  const keyData = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binary = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const unsigned = `${header}.${claim}`
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned),
  )
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${unsigned}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Falha ao obter token Google: ${err}`)
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  if (!tokenJson.access_token) throw new Error('Resposta OAuth sem access_token')
  return tokenJson.access_token
}
