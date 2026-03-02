"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GlassCard from '@/components/glass-card'
import { Check, TrendingUp, Zap, Crown } from 'lucide-react'

export default function ChallengesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('one-step')

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('active', true)
      .order('balance', { ascending: true })

    if (!error) {
      setChallenges(data || [])
    }
    setLoading(false)
  }

  const getChallengesByType = (type) => {
    return challenges.filter(c => c.type === type)
  }

  const ChallengeCard = ({ challenge }) => (
    <GlassCard hover className="relative overflow-hidden">
      {/* Badge pentru popular */}
      {challenge.balance === 50000 && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          POPULAR
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          ${(challenge.balance / 1000)}K
        </div>
        <div className="text-sm text-gray-400">Account Size</div>
      </div>

      <div className="mb-6">
        <div className="text-3xl font-bold text-center mb-2">
          ${challenge.price}
        </div>
        <div className="text-center text-sm text-gray-400">One-time fee</div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">Profit Target: <span className="text-white font-semibold">{challenge.profit_target}%</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">Daily Drawdown: <span className="text-white font-semibold">{challenge.daily_drawdown}%</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">Max Drawdown: <span className="text-white font-semibold">{challenge.max_drawdown}%</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">Profit Split: <span className="text-white font-semibold">90%</span></span>
        </div>
      </div>

      <Button
        onClick={() => router.push(`/checkout?challenge=${challenge.id}`)}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
      >
        Get Started
      </Button>
    </GlassCard>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading challenges...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Choose Your <span className="text-blue-500">Challenge</span>
          </h1>
          <p className="text-xl text-gray-400">
            Select the perfect challenge for your trading style
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12">
            <TabsTrigger value="one-step" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              1-Step
            </TabsTrigger>
            <TabsTrigger value="two-step" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              2-Step
            </TabsTrigger>
            <TabsTrigger value="pay-after-pass" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Pay After You Pass
            </TabsTrigger>
          </TabsList>

          {/* 1-Step Challenge */}
          <TabsContent value="one-step">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-center">1-Step Challenge</h2>
              <p className="text-gray-400 text-center max-w-2xl mx-auto">
                One evaluation phase. Hit your profit target and get funded immediately. Perfect for experienced traders.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getChallengesByType('one-step').map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>

          {/* 2-Step Challenge */}
          <TabsContent value="two-step">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-center">2-Step Challenge</h2>
              <p className="text-gray-400 text-center max-w-2xl mx-auto">
                Two evaluation phases with increasing targets. More time to prove your consistency.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getChallengesByType('two-step').map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>

          {/* Pay After You Pass */}
          <TabsContent value="pay-after-pass">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-center">Pay After You Pass</h2>
              <p className="text-gray-400 text-center max-w-2xl mx-auto">
                Start for free and pay only when you pass. No upfront costs, all the opportunities.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getChallengesByType('pay-after-pass').map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Compare Challenge Types</h2>
          <GlassCard className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400">Feature</th>
                  <th className="text-center py-4 px-4 text-gray-400">1-Step</th>
                  <th className="text-center py-4 px-4 text-gray-400">2-Step</th>
                  <th className="text-center py-4 px-4 text-gray-400">Pay After Pass</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-4">Evaluation Phases</td>
                  <td className="py-4 px-4 text-center font-semibold">1</td>
                  <td className="py-4 px-4 text-center font-semibold">2</td>
                  <td className="py-4 px-4 text-center font-semibold">1</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-4">Upfront Cost</td>
                  <td className="py-4 px-4 text-center font-semibold text-blue-400">Yes</td>
                  <td className="py-4 px-4 text-center font-semibold text-blue-400">Yes</td>
                  <td className="py-4 px-4 text-center font-semibold text-green-400">No</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-4">Time Limit</td>
                  <td className="py-4 px-4 text-center font-semibold">30 days</td>
                  <td className="py-4 px-4 text-center font-semibold">60 days</td>
                  <td className="py-4 px-4 text-center font-semibold">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 px-4">Profit Split</td>
                  <td className="py-4 px-4 text-center font-semibold text-green-400">90%</td>
                  <td className="py-4 px-4 text-center font-semibold text-green-400">90%</td>
                  <td className="py-4 px-4 text-center font-semibold text-green-400">80%</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Best For</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-400">Fast traders</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-400">Consistent traders</td>
                  <td className="py-4 px-4 text-center text-sm text-gray-400">Risk-free start</td>
                </tr>
              </tbody>
            </table>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
