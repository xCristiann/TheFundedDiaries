"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import GlassCard from '@/components/glass-card'
import {
 
  TrendingUp, 
  DollarSign, 
  LogOut, 
  User, 
  Users, 
  CreditCard, 
  Award,
  Activity,
  BarChart3,
  Wallet,
  FileCheck,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [metricsData, setMetricsData] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [metricsError, setMetricsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('accounts')
  const [showPassword, setShowPassword] = useState({})
  
  // Admin state
  const [allUsers, setAllUsers] = useState([])
  const [challenges, setChallenges] = useState([])
  const [payouts, setPayouts] = useState([])
  const [userPayouts, setUserPayouts] = useState([])
  
  // Challenge management state
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [challengeForm, setChallengeForm] = useState({
    type: 'one-step',
    balance: 10000,
    profit_target: 10,
    daily_drawdown: 5,
    max_drawdown: 10,
    price: 99,
    active: true
  })

  useEffect(() => {
    console.log('ðŸŸ¢ Dashboard mounted, checking user...')
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
      console.log('ðŸ”µ User ID:', user.id)

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('ðŸ”µ Profile Data:', profileData)
      console.log('ðŸ”µ Profile Error:', profileError)
      console.log('ðŸ”µ Role:', profileData?.role)

      setProfile(profileData)

      // Get trading accounts
      const { data: accountsData } = await supabase
        .from('trading_accounts')
        .select('*, challenges(*)')
        .eq('user_id', user.id)

      setAccounts(accountsData || [])
      if (accountsData && accountsData.length > 0) {
        setSelectedAccount(accountsData[0])
      }

      // Get user payouts - FIX: Remove nested join
      const { data: userPayoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select(`
          *,
          trading_accounts (
            account_login,
            user_id
          )
        `)
        .order('created_at', { ascending: false })

      if (payoutsError) {
        console.log('âš ï¸ Payouts error:', payoutsError)
      }

      // Filter payouts for current user
      const filteredPayouts = (userPayoutsData || []).filter(
        p => p.trading_accounts?.user_id === user.id
      )

      setUserPayouts(filteredPayouts)

      // If admin, load admin data
      if (profileData?.role === 'admin') {
        console.log('âœ… ADMIN DETECTAT! Loading admin data...')
        loadAdminData()
      } else {
        console.log('âŒ NU E ADMIN. Role:', profileData?.role)
      }
    } catch (error) {
      console.error('âŒ Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setAllUsers(usersData || [])

    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .order('balance', { ascending: false })
    setChallenges(challengesData || [])

    const { data: payoutsData } = await supabase
      .from('payouts')
      .select('*, trading_accounts(*, profiles(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(20)
    setPayouts(payoutsData || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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

  const handleCreateChallenge = async () => {
    const { error } = await supabase
      .from('challenges')
      .insert([challengeForm])

    if (!error) {
      setShowChallengeForm(false)
      setChallengeForm({
        type: 'one-step',
        balance: 10000,
        profit_target: 10,
        daily_drawdown: 5,
        max_drawdown: 10,
        price: 99,
        active: true
      })
      loadAdminData()
    }
  }

  const handleUpdateChallenge = async () => {
    const { error } = await supabase
      .from('challenges')
      .update(challengeForm)
      .eq('id', editingChallenge.id)

    if (!error) {
      setEditingChallenge(null)
      setShowChallengeForm(false)
      loadAdminData()
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
      active: challenge.active
    })
    setShowChallengeForm(true)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const togglePasswordVisibility = (accountId) => {
    setShowPassword(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  // Sidebar menu items
  const menuItems = [
    { id: 'terminal', label: 'Terminal', icon: <Activity className="w-5 h-5" /> },
    { id: 'accounts', label: 'Accounts', icon: <User className="w-5 h-5" /> },
    { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'payouts', label: 'Payouts', icon: <Wallet className="w-5 h-5" /> },
    { id: 'certificates', label: 'Certificates', icon: <FileCheck className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar - Premium Design */}
      <div className="w-72 m-4 mr-0 rounded-2xl border border-blue-500/20 bg-gradient-to-b from-gray-900/90 to-gray-950/95 backdrop-blur-xl flex flex-col relative overflow-hidden shadow-xl shadow-black/20">
        {/* Decorative gradient orb */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* User Profile Section */}
        <div className="relative p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : 'Trader'}
              </h2>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              {profile?.role === 'admin' && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 rounded-full border border-blue-500/30">
                  <Award className="w-3 h-3" />
                  Administrator
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 relative">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
  if (item.id === 'terminal') {
    router.push('/terminal')
  } else {
    setActiveSection(item.id)
  }
}}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {/* Active indicator */}
              {activeSection === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
              )}
              
              <span className={`p-2 rounded-lg transition-all duration-300 ${
                activeSection === item.id 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-white/5 group-hover:bg-white/10'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              
              {/* Hover arrow */}
              <svg 
                className={`w-4 h-4 ml-auto transition-all duration-300 ${
                  activeSection === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
          
          {/* Admin Button - Premium */}
          {profile?.role === 'admin' && (
            <>
              <div className="my-4 border-t border-white/5" />
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">Administration</p>
              <button
                onClick={() => router.push('/admin')}
                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 hover:from-blue-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-blue-500/20 hover:border-blue-500/40 text-white relative overflow-hidden"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <span className="p-2 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 relative">
                  <Award className="w-5 h-5 text-blue-400" />
                </span>
                <span className="font-semibold relative">Admin Panel</span>
                <svg 
                  className="w-4 h-4 ml-auto transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Terminal Section */}
        {activeSection === 'terminal' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Trading Terminal</h1>
            <GlassCard className="text-center py-12">
              <Activity className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Trading Platform Coming Soon</h3>
              <p className="text-gray-400 mb-6">Advanced trading terminal will be available shortly</p>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
                Get Notified
              </Button>
            </GlassCard>
          </div>
        )}

        {/* Accounts Section */}
        {activeSection === 'accounts' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Trading Accounts</h1>
            
            {accounts.length === 0 ? (
              <GlassCard className="text-center py-12">
                <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No Trading Accounts Yet</h3>
                <p className="text-gray-400 mb-6">Purchase a challenge to get started</p>
                <Button
                  onClick={() => router.push('/#select')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  Browse Challenges
                </Button>
              </GlassCard>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {accounts.map((account) => (
                  <GlassCard key={account.id} hover>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Account #{account.account_login}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            account.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            account.status === 'funded' ? 'bg-blue-500/20 text-blue-400' :
                            account.status === 'breached' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {account.status?.toUpperCase()}
                          </span>
                          <span className="inline-block px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                            {account.platform === 'tfd-trade' ? 'TFD Trade' : account.platform || 'TFD Trade'}
                          </span>
                        </div>
                      </div>
                      <DollarSign className="w-6 h-6 text-blue-500" />
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Login</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{account.account_login}</span>
                          <button
                            onClick={() => copyToClipboard(account.account_login)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Password</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            {showPassword[account.id] ? account.account_password : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(account.id)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {showPassword[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(account.account_password)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Balance</span>
                        <span className="font-bold text-green-400">${account.balance?.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-gray-400">Equity</span>
                        <span className="font-bold">${account.equity?.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                      onClick={() => {
                        setSelectedAccount(account)
                        setActiveSection('metrics')
                      }}
                    >
                      View Metrics
                    </Button>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metrics Section */}
        {activeSection === 'metrics' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Account Metrics</h1>
            
            {!selectedAccount ? (
              <GlassCard className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No Account Selected</h3>
                <p className="text-gray-400 mb-6">Select an account to view metrics</p>
                <Button onClick={() => setActiveSection('accounts')}>
                  Go to Accounts
                </Button>
              </GlassCard>
            ) : (
              <div>
                <GlassCard className="mb-6">
                  <h3 className="text-xl font-bold mb-4">Account #{selectedAccount.account_login}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Challenge Type</div>
                      <div className="font-semibold">{selectedAccount.challenges?.type || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Status</div>
                      <div className="font-semibold text-green-400">{selectedAccount.status}</div>
                    </div>
                  </div>
                </GlassCard>

                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                      <div className="text-sm text-gray-400">Balance</div>
                    </div>
                    <div className="text-3xl font-bold">${selectedAccount.balance?.toLocaleString()}</div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <div className="text-sm text-gray-400">Equity</div>
                    </div>
                    <div className="text-3xl font-bold">${selectedAccount.equity?.toLocaleString()}</div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <div className="text-sm text-gray-400">Target</div>
                    </div>
                    <div className="text-3xl font-bold">{selectedAccount.challenges?.profit_target}%</div>
                  </GlassCard>

                  <GlassCard>
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-red-400" />
                      <div className="text-sm text-gray-400">Max DD</div>
                    </div>
                    <div className="text-3xl font-bold">{selectedAccount.challenges?.max_drawdown}%</div>
                  </GlassCard>
                </div>

                <GlassCard>
                  <h3 className="text-xl font-bold mb-4">Performance Chart</h3>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    Chart visualization coming soon
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        )}

        {/* Payouts Section */}
        {activeSection === 'payouts' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">My Payouts</h1>
            
            <GlassCard>
              {userPayouts.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Payouts Yet</h3>
                  <p className="text-gray-400">Your payout requests will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">Account</th>
                        <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                        <th className="text-left py-3 px-4 text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPayouts.map((payout) => (
                        <tr key={payout.id} className="border-b border-gray-800">
                          <td className="py-3 px-4 font-mono">#{payout.trading_accounts?.account_login}</td>
                          <td className="py-3 px-4 font-bold text-green-400">${payout.amount?.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              payout.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              payout.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(payout.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* Certificates Section */}
        {activeSection === 'certificates' && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Certificates</h1>
            
            <GlassCard className="text-center py-12">
              <FileCheck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Certificates Yet</h3>
              <p className="text-gray-400 mb-6">Complete challenges to earn certificates</p>
            </GlassCard>
          </div>
        )}

      </div>
    </div>
  )
}



