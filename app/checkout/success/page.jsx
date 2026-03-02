"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import GlassCard from '@/components/glass-card'
import { CheckCircle, Loader2, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [status, setStatus] = useState('checking') // checking, success, error
  const [paymentData, setPaymentData] = useState(null)
  const [tradingAccount, setTradingAccount] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      pollPaymentStatus(sessionId)
    } else {
      setStatus('error')
    }
  }, [])

  const pollPaymentStatus = async (sessionId, attemptCount = 0) => {
    const maxAttempts = 10
    const pollInterval = 2000

    if (attemptCount >= maxAttempts) {
      setStatus('error')
      return
    }

    setAttempts(attemptCount + 1)

    try {
      const response = await fetch(`/api/stripe/status/${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to check payment status')
      }

      const data = await response.json()
      setPaymentData(data)

      if (data.payment_status === 'paid') {
        setStatus('success')
        
        // Create trading account if not already created
        if (!data.trading_account_created && data.metadata) {
          await createTradingAccount(data.metadata)
        } else if (data.metadata?.user_id && data.metadata.user_id !== 'guest') {
          // Fetch existing trading account
          await fetchTradingAccount(data.metadata.user_id, data.metadata.challenge_id)
        }
      } else if (data.status === 'expired') {
        setStatus('error')
      } else {
        // Continue polling
        setTimeout(() => pollPaymentStatus(sessionId, attemptCount + 1), pollInterval)
      }
    } catch (error) {
      console.error('Status check error:', error)
      setTimeout(() => pollPaymentStatus(sessionId, attemptCount + 1), pollInterval)
    }
  }

  const createTradingAccount = async (metadata) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Create trading account
        const { data: account, error } = await supabase
          .from('trading_accounts')
          .insert([{
            user_id: user.id,
            challenge_id: metadata.challenge_id,
            platform: metadata.platform || 'tfd-trade',
            status: 'active'
          }])
          .select()
          .single()

        if (!error && account) {
          setTradingAccount(account)
        }
      }
    } catch (error) {
      console.error('Error creating trading account:', error)
    }
  }

  const fetchTradingAccount = async (userId, challengeId) => {
    try {
      const { data: accounts } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (accounts && accounts.length > 0) {
        setTradingAccount(accounts[0])
      }
    } catch (error) {
      console.error('Error fetching trading account:', error)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md w-full text-center py-12">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Processing Payment...</h2>
          <p className="text-gray-400">
            Please wait while we confirm your payment.
            {attempts > 0 && ` (Attempt ${attempts}/10)`}
          </p>
        </GlassCard>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md w-full text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Payment Issue</h2>
          <p className="text-gray-400 mb-6">
            There was an issue processing your payment. Please try again or contact support.
          </p>
          <Button
            onClick={() => router.push('/challenges')}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            Back to Challenges
          </Button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <GlassCard className="max-w-lg w-full text-center py-12">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
          Your trading account has been created and is ready to use.
        </p>

        {tradingAccount && (
          <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xl font-bold mb-4 text-center">Your Trading Credentials</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Login ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400">
                    {tradingAccount.account_login}
                  </span>
                  <button
                    onClick={() => copyToClipboard(tradingAccount.account_login)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">
                    {showPassword ? tradingAccount.account_password : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(tradingAccount.account_password)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Platform</span>
                <span className="font-semibold text-purple-400">
                  {tradingAccount.platform === 'tfd-trade' ? 'TFD Trade' : tradingAccount.platform}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400">Starting Balance</span>
                <span className="font-bold text-green-400">
                  ${tradingAccount.balance?.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-sm text-yellow-400 mt-4 text-center">
              ⚠️ Save these credentials! You'll need them to access your trading account.
            </p>
          </div>
        )}

        {paymentData && (
          <div className="text-sm text-gray-400 mb-6">
            Amount paid: <span className="text-white font-semibold">${paymentData.amount_total?.toFixed(2)}</span>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/challenges')}
            variant="outline"
          >
            Buy Another Challenge
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
