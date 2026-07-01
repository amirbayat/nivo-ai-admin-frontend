const VITE_API_URL = import.meta.env.VITE_API_URL as string
if (!VITE_API_URL) throw new Error('Missing env: VITE_API_URL')
export const env = { VITE_API_URL }
