"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GlassCard from '@/components/glass-card'
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Users, 
  Award, 
  CreditCard,
  ArrowLeft,
  Tag,
  Eye,
  ChevronRight,
  Wallet,
  TrendingUp,
  Settings,
  AlertTriangle,
  Shield,
  Globe
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  
  // Challenges state
  const [challenges, setChallenges] = useState([])
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [challengeForm, setChallengeForm] = useState({
    type: 'one-step',
    balance: 10000,
    profit_target: 10,
    daily_drawdown: 5,
    max_drawdown: 10,
    price: 99,
    rules: '',
    active: true
  })
  
  // Users state
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userAccounts, setUserAccounts] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  
  // IP Alerts state
  const [ipAlerts, setIpAlerts] = useState([])
  const [flaggedUsers, setFlaggedUsers] = useState([])
  
  // Trading Account state
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [accountForm, setAccountForm] = useState({
    challenge_id: '',
    platform: 'tfd-trade',
    balance: 10000,
    equity: 10000,
    leverage: 100,
    status: 'active',
    account_login: '',
    account_password: ''
  })
  
  // Payouts state
  const [payouts, setPayouts] = useState([])
  
  // Coupons state
  const [coupons, setCoupons] = useState([])
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: null,
    expires_at: '',
    active: true
  })

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setProfile(profileData)
    loadAdminData()
    setLoading(false)
  }

  const loadAdminData = async () => {
    // Load challenges
    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .order('balance', { ascending: true })
    setChallenges(challengesData || [])

    // Load users with their accounts count
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setAllUsers(usersData || [])

    // Load payouts
    const { data: payoutsData } = await supabase
      .from('payouts')
      .select(`
        *,
        trading_accounts (
          account_login,
          profiles (
            first_name,
            last_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    setPayouts(payoutsData || [])
    
    // Load coupons
    const { data: couponsData } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    setCoupons(couponsData || [])
    
    // Load flagged users (IP alerts)
    const { data: flaggedData } = await supabase
      .from('profiles')
      .select('*')
      .eq('ip_flagged', true)
      .order('created_at', { ascending: false })
    setFlaggedUsers(flaggedData || [])
    
    // Group users by IP to show alerts
    if (usersData) {
      const ipGroups = {}
      usersData.forEach(user => {
        const ip = user.ip_address || user.last_login_ip
        if (ip && ip !== 'unknown') {
          if (!ipGroups[ip]) {
            ipGroups[ip] = []
          }
          ipGroups[ip].push(user)
        }
      })
      
      // Filter only IPs with multiple users
      const alerts = Object.entries(ipGroups)
        .filter(([ip, users]) => users.length > 1)
        .map(([ip, users]) => ({ ip, users, count: users.length }))
        .sort((a, b) => b.count - a.count)
      
      setIpAlerts(alerts)
    }
  }

  // User management functions
  const openUserDetails = async (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
    
    // Load user's trading accounts
    const { data: accounts } = await supabase
      .from('trading_accounts')
      .select('*, challenges(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    setUserAccounts(accounts || [])
  }

  const closeUserModal = () => {
    setShowUserModal(false)
    setSelectedUser(null)
    setUserAccounts([])
    setShowAccountForm(false)
    setEditingAccount(null)
  }

  // Trading account functions
  const openAddAccountForm = () => {
    setEditingAccount(null)
    const firstChallenge = challenges[0]
    setAccountForm({
      challenge_id: firstChallenge?.id || 'none',
      platform: 'tfd-trade',
      balance: firstChallenge?.balance || 10000,
      equity: firstChallenge?.balance || 10000,
      leverage: 100,
      status: 'active',
      account_login: '',
      account_password: ''
    })
    setShowAccountForm(true)
  }

  const handleChallengeChange = (challengeId) => {
    if (challengeId === 'none') {
      setAccountForm({ 
        ...accountForm, 
        challenge_id: 'none'
      })
    } else {
      const selectedChallenge = challenges.find(c => c.id === challengeId)
      if (selectedChallenge) {
        setAccountForm({
          ...accountForm,
          challenge_id: challengeId,
          balance: selectedChallenge.balance,
          equity: selectedChallenge.balance
        })
      }
    }
  }

  const openEditAccountForm = (account) => {
    setEditingAccount(account)
    setAccountForm({
      challenge_id: account.challenge_id || '',
      platform: account.platform || 'tfd-trade',
      balance: account.balance || 0,
      equity: account.equity || 0,
      leverage: account.leverage || 100,
      status: account.status || 'active',
      account_login: account.account_login || '',
      account_password: account.account_password || ''
    })
    setShowAccountForm(true)
  }

  const handleCreateAccount = async () => {
    const { data, error } = await supabase
      .from('trading_accounts')
      .insert([{
        user_id: selectedUser.id,
        challenge_id: accountForm.challenge_id && accountForm.challenge_id !== 'none' ? accountForm.challenge_id : null,
        platform: accountForm.platform,
        balance: accountForm.balance,
        equity: accountForm.equity,
        leverage: accountForm.leverage,
        status: accountForm.status,
        account_login: accountForm.account_login || null,
        account_password: accountForm.account_password || null
      }])
      .select('*, challenges(*)')
      .single()

    if (!error) {
      setUserAccounts([data, ...userAccounts])
      setShowAccountForm(false)
    } else {
      alert('Error creating account: ' + error.message)
    }
  }

  const handleUpdateAccount = async () => {
    const { data, error } = await supabase
      .from('trading_accounts')
      .update({
        challenge_id: accountForm.challenge_id && accountForm.challenge_id !== 'none' ? accountForm.challenge_id : null,
        platform: accountForm.platform,
        balance: accountForm.balance,
        equity: accountForm.equity,
        leverage: accountForm.leverage,
        status: accountForm.status,
        account_login: accountForm.account_login,
        account_password: accountForm.account_password
      })
      .eq('id', editingAccount.id)
      .select('*, challenges(*)')
      .single()

    if (!error) {
      setUserAccounts(userAccounts.map(a => a.id === editingAccount.id ? data : a))
      setShowAccountForm(false)
      setEditingAccount(null)
    } else {
      alert('Error updating account: ' + error.message)
    }
  }

  const handleDeleteAccount = async (accountId) => {
    if (confirm('Are you sure you want to delete this trading account?')) {
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', accountId)

      if (!error) {
        setUserAccounts(userAccounts.filter(a => a.id !== accountId))
      }
    }
  }

  // Challenge functions
  const handleCreateChallenge = async () => {
    const { error } = await supabase
      .from('challenges')
      .insert([{
        type: challengeForm.type,
        balance: challengeForm.balance,
        profit_target: challengeForm.profit_target,
        daily_drawdown: challengeForm.daily_drawdown,
        max_drawdown: challengeForm.max_drawdown,
        price: challengeForm.price,
        active: challengeForm.active,
        rules: challengeForm.rules || null
      }])

    if (!error) {
      setShowChallengeForm(false)
      setChallengeForm({
        type: 'one-step',
        balance: 10000,
        profit_target: 10,
        daily_drawdown: 5,
        max_drawdown: 10,
        price: 99,
        rules: '',
        active: true
      })
      loadAdminData()
    } else {
      alert('Error creating challenge: ' + error.message)
    }
  }

  const handleUpdateChallenge = async () => {
    const { error } = await supabase
      .from('challenges')
      .update({
        type: challengeForm.type,
        balance: challengeForm.balance,
        profit_target: challengeForm.profit_target,
        daily_drawdown: challengeForm.daily_drawdown,
        max_drawdown: challengeForm.max_drawdown,
        price: challengeForm.price,
        active: challengeForm.active,
        rules: challengeForm.rules || null
      })
      .eq('id', editingChallenge.id)

    if (!error) {
      setEditingChallenge(null)
      setShowChallengeForm(false)
      loadAdminData()
    } else {
      alert('Error updating challenge: ' + error.message)
    }
  }

  const handleDeleteChallenge = async (challengeId) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId)

      if (!error) {
        loadAdminData()
      }
    }
  }

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge)
    setChallengeForm({
      type: challenge.type,
      balance: challenge.balance,
      profit_target: challenge.profit_target,
      daily_drawdown: challenge.daily_drawdown,
      max_drawdown: challenge.max_drawdown,
      price: challenge.price,
      rules: challenge.rules || '',
      active: challenge.active
    })
    setShowChallengeForm(true)
  }

  const handleApprovePayout = async (payoutId) => {
    const { error } = await supabase
      .from('payouts')
      .update({ status: 'approved' })
      .eq('id', payoutId)

    if (!error) {
      loadAdminData()
    }
  }

  // Coupon functions
  const handleCreateCoupon = async () => {
    const couponData = {
      code: couponForm.code.toUpperCase(),
      discount_type: couponForm.discount_type,
      discount_value: couponForm.discount_value,
      max_uses: couponForm.max_uses || null,
      expires_at: couponForm.expires_at || null,
      active: couponForm.active
    }

    const { error } = await supabase.from('coupons').insert([couponData])

    if (!error) {
      setShowCouponForm(false)
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: null,
        expires_at: '',
        active: true
      })
      loadAdminData()
    } else {
      alert('Error creating coupon: ' + error.message)
    }
  }

  const handleUpdateCoupon = async () => {
    const { error } = await supabase
      .from('coupons')
      .update({
        code: couponForm.code.toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        max_uses: couponForm.max_uses || null,
        expires_at: couponForm.expires_at || null,
        active: couponForm.active
      })
      .eq('id', editingCoupon.id)

    if (!error) {
      setShowCouponForm(false)
      setEditingCoupon(null)
      loadAdminData()
    } else {
      alert('Error updating coupon: ' + error.message)
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId)

      if (!error) {
        loadAdminData()
      }
    }
  }

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon)
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses || '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      active: coupon.active
    })
    setShowCouponForm(true)
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-blue-500/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Admin</span> Panel
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-8">
            <TabsTrigger value="challenges">
              <Award className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="ip-alerts" className="relative">
              <AlertTriangle className="w-4 h-4 mr-2" />
              IP Alerts
              {ipAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {ipAlerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="coupons">
              <Tag className="w-4 h-4 mr-2" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="payouts">
              <CreditCard className="w-4 h-4 mr-2" />
              Payouts
            </TabsTrigger>
          </TabsList>

          {/* CHALLENGES TAB */}
          <TabsContent value="challenges">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Manage Challenges</h2>
              <Button
                onClick={() => {
                  setEditingChallenge(null)
                  setChallengeForm({
                    type: 'one-step',
                    balance: 10000,
                    profit_target: 10,
                    daily_drawdown: 5,
                    max_drawdown: 10,
                    price: 99,
                    rules: '',
                    active: true
                  })
                  setShowChallengeForm(true)
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Challenge
              </Button>
            </div>

            {/* Challenge Form */}
            {showChallengeForm && (
              <GlassCard className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">
                    {editingChallenge ? 'Edit Challenge' : 'New Challenge'}
                  </h3>
                  <button onClick={() => { setShowChallengeForm(false); setEditingChallenge(null) }} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Challenge Type</Label>
                    <Select value={challengeForm.type} onValueChange={(value) => setChallengeForm({ ...challengeForm, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-step">1-Step</SelectItem>
                        <SelectItem value="two-step">2-Step</SelectItem>
                        <SelectItem value="pay-after-pass">Pay After You Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Account Balance ($)</Label>
                    <Input type="number" value={challengeForm.balance} onChange={(e) => setChallengeForm({ ...challengeForm, balance: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input type="number" value={challengeForm.price} onChange={(e) => setChallengeForm({ ...challengeForm, price: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Profit Target (%)</Label>
                    <Input type="number" step="0.1" value={challengeForm.profit_target} onChange={(e) => setChallengeForm({ ...challengeForm, profit_target: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Daily Drawdown (%)</Label>
                    <Input type="number" step="0.1" value={challengeForm.daily_drawdown} onChange={(e) => setChallengeForm({ ...challengeForm, daily_drawdown: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Max Drawdown (%)</Label>
                    <Input type="number" step="0.1" value={challengeForm.max_drawdown} onChange={(e) => setChallengeForm({ ...challengeForm, max_drawdown: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={challengeForm.active} onChange={(e) => setChallengeForm({ ...challengeForm, active: e.target.checked })} className="h-4 w-4 rounded" />
                    Active
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button onClick={editingChallenge ? handleUpdateChallenge : handleCreateChallenge} className="bg-gradient-to-r from-blue-500 to-purple-500">
                    {editingChallenge ? 'Update' : 'Create'}
                  </Button>
                  <Button onClick={() => { setShowChallengeForm(false); setEditingChallenge(null) }} variant="outline">Cancel</Button>
                </div>
              </GlassCard>
            )}

            {/* Challenges Table */}
            <GlassCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2">Type</th>
                      <th className="text-left py-3 px-2">Balance</th>
                      <th className="text-left py-3 px-2">Price</th>
                      <th className="text-left py-3 px-2">Target</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challenges.map((c) => (
                      <tr key={c.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 px-2"><span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">{c.type}</span></td>
                        <td className="py-3 px-2 font-semibold">${(c.balance / 1000)}K</td>
                        <td className="py-3 px-2 text-green-400 font-semibold">${c.price}</td>
                        <td className="py-3 px-2">{c.profit_target}%</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${c.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {c.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditChallenge(c)} className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteChallenge(c.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <h2 className="text-2xl font-bold mb-6">Manage Users ({allUsers.length})</h2>
            <GlassCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-left py-3 px-2">Email</th>
                      <th className="text-left py-3 px-2">IP Address</th>
                      <th className="text-left py-3 px-2">Location</th>
                      <th className="text-left py-3 px-2">Role</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id} className={`border-b border-gray-800 hover:bg-white/5 cursor-pointer ${u.ip_flagged ? 'bg-red-500/10' : ''}`} onClick={() => openUserDetails(u)}>
                        <td className="py-3 px-2 font-semibold">
                          {u.first_name} {u.last_name}
                          {u.ip_flagged && <AlertTriangle className="w-4 h-4 text-red-400 inline ml-2" />}
                        </td>
                        <td className="py-3 px-2 text-gray-400">{u.email}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span className="font-mono text-sm">{u.ip_address || u.last_login_ip || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-400">{u.city}, {u.country}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {u.ip_flagged ? (
                            <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Flagged
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                              Clean
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Button size="sm" variant="outline" className="border-blue-500/30" onClick={(e) => { e.stopPropagation(); openUserDetails(u) }}>
                            <Settings className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          {/* IP ALERTS TAB */}
          <TabsContent value="ip-alerts">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                IP Alerts ({ipAlerts.length})
              </h2>
            </div>

            {ipAlerts.length === 0 ? (
              <GlassCard className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No IP Conflicts Detected</h3>
                <p className="text-gray-400">All users have unique IP addresses</p>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {ipAlerts.map((alert, idx) => (
                  <GlassCard key={idx} className="border-red-500/30 bg-red-500/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-400">
                            IP Conflict Detected
                          </h3>
                          <p className="text-gray-400 font-mono">{alert.ip}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold">
                        {alert.count} Users Sharing IP
                      </span>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Affected Users & Accounts</h4>
                      <div className="space-y-3">
                        {alert.users.map((user) => (
                          <div 
                            key={user.id} 
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                            onClick={() => openUserDetails(user)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </div>
                              <div>
                                <div className="font-semibold">{user.first_name} {user.last_name}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">{user.city}, {user.country}</div>
                              <div className="text-xs text-gray-500">Registered: {new Date(user.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        Mark All as Reviewed
                      </Button>
                      <Button variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                        Suspend All Accounts
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COUPONS TAB */}
          <TabsContent value="coupons">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Manage Coupons ({coupons.length})</h2>
              <Button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', discount_type: 'percentage', discount_value: 10, max_uses: '', expires_at: '', active: true }); setShowCouponForm(true) }} className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Coupon
              </Button>
            </div>

            {showCouponForm && (
              <GlassCard className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h3>
                  <button onClick={() => { setShowCouponForm(false); setEditingCoupon(null) }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Coupon Code</Label>
                    <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="uppercase" />
                  </div>
                  <div>
                    <Label>Discount Type</Label>
                    <Select value={couponForm.discount_type} onValueChange={(value) => setCouponForm({ ...couponForm, discount_type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discount Value</Label>
                    <Input type="number" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Max Uses (empty = unlimited)</Label>
                    <Input type="number" value={couponForm.max_uses} onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value ? parseInt(e.target.value) : '' })} placeholder="Unlimited" />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input type="date" value={couponForm.expires_at} onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Label className="flex items-center gap-2">
                      <input type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} className="h-4 w-4 rounded" />
                      Active
                    </Label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={editingCoupon ? handleUpdateCoupon : handleCreateCoupon} className="bg-gradient-to-r from-blue-500 to-purple-500">{editingCoupon ? 'Update' : 'Create'}</Button>
                  <Button onClick={() => { setShowCouponForm(false); setEditingCoupon(null) }} variant="outline">Cancel</Button>
                </div>
              </GlassCard>
            )}

            <GlassCard>
              {coupons.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Coupons Yet</h3>
                  <p className="text-gray-400">Create your first discount coupon</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-2">Code</th>
                        <th className="text-left py-3 px-2">Discount</th>
                        <th className="text-left py-3 px-2">Uses</th>
                        <th className="text-left py-3 px-2">Expires</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="border-b border-gray-800 hover:bg-white/5">
                          <td className="py-3 px-2"><span className="font-mono font-bold text-blue-400">{coupon.code}</span></td>
                          <td className="py-3 px-2 font-semibold text-green-400">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}</td>
                          <td className="py-3 px-2 text-gray-400">{coupon.current_uses || 0} / {coupon.max_uses || '∞'}</td>
                          <td className="py-3 px-2 text-gray-400">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded text-xs ${coupon.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                              {coupon.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-2">
                              <button onClick={() => handleEditCoupon(coupon)} className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* PAYOUTS TAB */}
          <TabsContent value="payouts">
            <h2 className="text-2xl font-bold mb-6">All Payouts ({payouts.length})</h2>
            <GlassCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2">Trader</th>
                      <th className="text-left py-3 px-2">Account</th>
                      <th className="text-left py-3 px-2">Amount</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-left py-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className="border-b border-gray-800 hover:bg-white/5">
                        <td className="py-3 px-2">{p.trading_accounts?.profiles?.first_name} {p.trading_accounts?.profiles?.last_name}</td>
                        <td className="py-3 px-2 font-mono text-sm">#{p.trading_accounts?.account_login}</td>
                        <td className="py-3 px-2 font-bold text-green-400">${p.amount?.toLocaleString()}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${p.status === 'approved' ? 'bg-green-500/20 text-green-400' : p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-400 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-2">
                          {p.status === 'pending' && (
                            <Button size="sm" onClick={() => handleApprovePayout(p.id)} className="bg-green-500 hover:bg-green-600">Approve</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <p className="text-gray-400">{selectedUser.email}</p>
                </div>
                <button onClick={closeUserModal} className="text-gray-400 hover:text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* User Info */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Location</div>
                  <div className="font-semibold">{selectedUser.city}, {selectedUser.country}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Role</div>
                  <div className="font-semibold capitalize">{selectedUser.role}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Joined</div>
                  <div className="font-semibold">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`p-4 rounded-xl ${selectedUser.ip_flagged ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5'}`}>
                  <div className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    IP Address
                  </div>
                  <div className="font-mono font-semibold flex items-center gap-2">
                    {selectedUser.ip_address || selectedUser.last_login_ip || 'N/A'}
                    {selectedUser.ip_flagged && (
                      <span className="px-2 py-0.5 bg-red-500/30 text-red-400 text-xs rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* IP Alert Warning */}
              {selectedUser.ip_flagged && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-400">IP Conflict Warning</h4>
                    <p className="text-sm text-gray-400">This user shares an IP address with other accounts. This may indicate multiple accounts from the same person.</p>
                  </div>
                </div>
              )}

              {/* Trading Accounts Section */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  Trading Accounts ({userAccounts.length})
                </h3>
                <Button onClick={openAddAccountForm} className="bg-gradient-to-r from-blue-500 to-purple-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </div>

              {/* Account Form */}
              {showAccountForm && (
                <GlassCard className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold">{editingAccount ? 'Edit Trading Account' : 'New Trading Account'}</h4>
                    <button onClick={() => { setShowAccountForm(false); setEditingAccount(null) }} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Challenge</Label>
                      <Select value={accountForm.challenge_id} onValueChange={handleChallengeChange}>
                        <SelectTrigger><SelectValue placeholder="Select challenge" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Challenge</SelectItem>
                          {challenges.map((c) => (
                            <SelectItem key={c.id} value={c.id}>${(c.balance/1000)}K {c.type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Platform</Label>
                      <Select value={accountForm.platform} onValueChange={(value) => setAccountForm({ ...accountForm, platform: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tfd-trade">TFD Trade</SelectItem>
                          <SelectItem value="mt5">MetaTrader 5</SelectItem>
                          <SelectItem value="mt4">MetaTrader 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Balance ($)</Label>
                      <Input type="number" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Equity ($)</Label>
                      <Input type="number" value={accountForm.equity} onChange={(e) => setAccountForm({ ...accountForm, equity: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Leverage</Label>
                      <Select value={accountForm.leverage.toString()} onValueChange={(value) => setAccountForm({ ...accountForm, leverage: parseInt(value) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">1:10</SelectItem>
                          <SelectItem value="50">1:50</SelectItem>
                          <SelectItem value="100">1:100</SelectItem>
                          <SelectItem value="200">1:200</SelectItem>
                          <SelectItem value="500">1:500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={accountForm.status} onValueChange={(value) => setAccountForm({ ...accountForm, status: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="funded">Funded</SelectItem>
                          <SelectItem value="breached">Breached</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Login ID (auto-generated if empty)</Label>
                      <Input value={accountForm.account_login} onChange={(e) => setAccountForm({ ...accountForm, account_login: e.target.value })} placeholder="Auto-generate" />
                    </div>
                    <div>
                      <Label>Password (auto-generated if empty)</Label>
                      <Input value={accountForm.account_password} onChange={(e) => setAccountForm({ ...accountForm, account_password: e.target.value })} placeholder="Auto-generate" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={editingAccount ? handleUpdateAccount : handleCreateAccount} className="bg-gradient-to-r from-blue-500 to-purple-500">
                      {editingAccount ? 'Update Account' : 'Create Account'}
                    </Button>
                    <Button onClick={() => { setShowAccountForm(false); setEditingAccount(null) }} variant="outline">Cancel</Button>
                  </div>
                </GlassCard>
              )}

              {/* Accounts List */}
              {userAccounts.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl">
                  <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No trading accounts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userAccounts.map((account) => (
                    <div key={account.id} className="p-4 bg-white/5 rounded-xl border border-gray-800 hover:border-blue-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-bold">#{account.account_login}</div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            account.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            account.status === 'funded' ? 'bg-blue-500/20 text-blue-400' :
                            account.status === 'breached' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {account.status?.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                            {account.platform === 'tfd-trade' ? 'TFD Trade' : account.platform}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditAccountForm(account)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => handleDeleteAccount(account.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Balance</div>
                          <div className="font-bold text-green-400">${account.balance?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Equity</div>
                          <div className="font-bold">${account.equity?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Leverage</div>
                          <div className="font-semibold">1:{account.leverage || 100}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Challenge</div>
                          <div className="font-semibold">{account.challenges ? `$${(account.challenges.balance/1000)}K ${account.challenges.type}` : 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
