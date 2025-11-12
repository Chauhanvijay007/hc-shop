import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard (or signin if not authenticated)
  redirect('/dashboard')
}
