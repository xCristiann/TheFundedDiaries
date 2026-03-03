"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import GlassCard from '@/components/glass-card'
import { ShoppingCart, Check, X, Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  const [platform, setPlatform] = useState('tfd-trade')
  const [couponCode, setCouponCode] = useState('')
  const [couponValidation, setCouponValidation] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  
  const [formData, setFormData] = useState({
    streetAddress: '',
    postalCode: '',
    city: '',
    country: '',
    email: '',
    firstName: '',
    lastName: ''
  })

  const [priceCalculation, setPriceCalculation] = useState({
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0
  })

  useEffect(() => {
    loadCheckoutData()
  }, [])

  const loadCheckoutData = async () => {
    const challengeId = searchParams.get('challenge')
    
    if (!challengeId) {
      router.push('/challenges')
      return
    }

    // Get challenge
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challengeData) {
      router.push('/challenges')
      return
    }

    setChallenge(challengeData)
    setPriceCalculation({
      originalPrice: challengeData.price,
      discountAmount: 0,
      finalPrice: challengeData.price
    })

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUser(user)
      
      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          streetAddress: profileData.street_address || '',
          postalCode: profileData.postal_code || '',
          city: profileData.city,
          country: profileData.country,
          email: profileData.email,
          firstName: profileData.first_name,
          lastName: profileData.last_name
        })
      }
    }

    setLoading(false)
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return

    setValidatingCoupon(true)
    setCouponValidation(null)

    try {
      const { data, error } = await supabase
        .rpc('validate_coupon', { coupon_code_param: couponCode.toUpperCase() })

      if (error) throw error

      if (data && data[0]) {
        const result = data[0]
        
        if (result.valid) {
          setCouponValidation({ valid: true, message: result.message })
          
          // Calculate discount
          let discount = 0
          if (result.discount_type === 'percentage') {
            discount = (challenge.price * result.discount_value) / 100
          } else {
            discount = result.discount_value
          }

          setPriceCalculation({
            originalPrice: challenge.price,
            discountAmount: discount,
            finalPrice: challenge.price - discount
          })
        } else {
          setCouponValidation({ valid: false, message: result.message })
        }
      }
    } catch (error) {
      console.error('Coupon validation error:', error)
      setCouponValidation({ valid: false, message: 'Error validating coupon' })
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // If not logged in, create account first
      let userId = user?.id
      
      if (!user) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-8) + 'Aa1!', // Temporary password
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              city: formData.city,
              country: formData.country
            }
          }
        })

        if (signUpError) throw signUpError
        userId = signUpData.user?.id
      }

      // Update profile with address
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            street_address: formData.streetAddress,
            postal_code: formData.postalCode
          })
          .eq('id', userId)
      }

      // Create Stripe checkout session
      const originUrl = window.location.origin
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          originUrl: originUrl,
          userId: userId || null,
          email: formData.email || profile?.email,
          couponCode: couponValidation?.valid ? couponCode.toUpperCase() : null,
          discountAmount: priceCalculation.discountAmount,
          final_price: priceCalculation.finalPrice,
          challenge_name: `$${(challenge.balance / 1000)}K ${challenge.type}`,
          platform: platform
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url, session_id } = await response.json()
      
      // Store order info before redirect
      if (userId) {
        await supabase
          .from('orders')
          .insert([{
            user_id: userId,
            challenge_id: challenge.id,
            platform: platform,
            coupon_code: couponValidation?.valid ? couponCode.toUpperCase() : null,
            original_price: priceCalculation.originalPrice,
            discount_amount: priceCalculation.discountAmount,
            final_price: priceCalculation.finalPrice,
            status: 'pending',
            street_address: formData.streetAddress,
            postal_code: formData.postalCode,
            city: formData.city || profile?.city,
            country: formData.country || profile?.country
          }])
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error processing order: ' + error.message)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          <ShoppingCart className="w-10 h-10 inline-block mr-3 text-blue-500" />
          Checkout
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <GlassCard className="mb-6">
                <h2 className="text-xl font-bold mb-4">Billing Information</h2>
                
                <div className="space-y-4">
                  {!user && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name *</Label>
                          <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Last Name *</Label>
                          <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Street Address *</Label>
                    <Input
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      placeholder="123 Main Street, Apt 4B"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Postal Code *</Label>
                      <Input
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        required
                      />
                    </div>
                    
                    {!user && (
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {!user && (
                    <div>
                      <Label>Country *</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="mb-6">
                <h2 className="text-xl font-bold mb-4">Trading Platform</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-blue-500/30 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="radio"
                      name="platform"
                      value="tfd-trade"
                      checked={platform === 'tfd-trade'}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold">TFD Trade</div>
                      <div className="text-sm text-gray-400">Our proprietary trading platform</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
                    <input
                      type="radio"
                      disabled
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold">MetaTrader 5</div>
                      <div className="text-sm text-gray-400">Coming Soon</div>
                    </div>
                  </label>
                </div>
              </GlassCard>

              <GlassCard className="mb-6">
                <h2 className="text-xl font-bold mb-4">Discount Code</h2>
                
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={validateCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>

                {couponValidation && (
                  <div className={`mt-3 flex items-center gap-2 text-sm ${
                    couponValidation.valid ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {couponValidation.valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {couponValidation.message}
                  </div>
                )}
              </GlassCard>

              <Button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-6 text-lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Complete Purchase - $${priceCalculation.finalPrice.toFixed(2)}`
                )}
              </Button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div>
            <GlassCard>
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400">Challenge</div>
                  <div className="font-semibold">${(challenge.balance / 1000)}K {challenge.type}</div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Subtotal</span>
                    <span>${priceCalculation.originalPrice.toFixed(2)}</span>
                  </div>
                  
                  {priceCalculation.discountAmount > 0 && (
                    <div className="flex justify-between mb-2 text-green-400">
                      <span>Discount</span>
                      <span>-${priceCalculation.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-gray-700">
                    <span>Total</span>
                    <span className="text-blue-400">${priceCalculation.finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Instant account activation
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Trading credentials via email
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    24/7 support access
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
