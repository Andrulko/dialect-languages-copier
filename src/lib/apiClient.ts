// Helper to get the JWT token
async function getJwtToken(): Promise<string> {
  return new Promise((resolve) => window.AP.getJwtToken(resolve));
}

// Generic API call wrapper
export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getJwtToken();
  
  const url = new URL(endpoint, window.location.href);
  url.searchParams.set('jwt', token);
  
  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}