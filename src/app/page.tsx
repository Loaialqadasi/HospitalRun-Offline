import HomePage from '@/components/home-page'

// Skip static page generation to save memory on Render free tier (512MB RAM).
// This page is a client-side app that doesn't need SSG pre-rendering.
export const dynamic = 'force-dynamic'

export default function Page() {
  return <HomePage />
}
