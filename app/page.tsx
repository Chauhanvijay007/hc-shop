import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">
            SEO Gets Clone
          </h1>
          <p className="text-xl mb-8">
            Google Search Console Analytics Platform
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/api/auth/signin"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
