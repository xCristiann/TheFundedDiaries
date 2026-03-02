"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GlassCard from '@/components/glass-card'
import { Activity, TrendingUp } from 'lucide-react'

export default function TerminalPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Trading <span className="text-[#8b7306]">Terminal</span>
        </h1>
        <p className="text-gray-400 mb-8">Advanced trading interface coming soon</p>

        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="text-center py-12">
            <Activity className="w-16 h-16 text-[#8b7306] mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Live Trading</h3>
            <p className="text-gray-400">Real-time market data and execution</p>
          </GlassCard>

          <GlassCard className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-[#8b7306] mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Advanced Analytics</h3>
            <p className="text-gray-400">Comprehensive trading insights</p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
