"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session?.user)
    setLoading(false)
  }

  const DashboardButton = (
    <Button
      onClick={() => router.push('/dashboard')}
      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 rounded-full shadow-lg shadow-blue-500/30"
    >
      Dashboard
    </Button>
  )

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-blue-500/20 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl shadow-blue-500/10">
        {/* Brand */}
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
            TheFundedDiaries
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/challenges" className="text-gray-300 hover:text-blue-400 transition-colors">
            Challenges
          </Link>
          <Link href="/#faq" className="text-gray-300 hover:text-blue-400 transition-colors">
            FAQ
          </Link>
          <Link href="/#contact" className="text-gray-300 hover:text-blue-400 transition-colors">
            Contact
          </Link>
          <Link href="/#about" className="text-gray-300 hover:text-blue-400 transition-colors">
            About
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-24 h-10"></div>
          ) : (
            DashboardButton
          )}
        </div>
      </div>
    </nav>
  )
}
