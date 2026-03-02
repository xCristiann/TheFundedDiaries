"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import GlassCard from '@/components/glass-card'
import { TrendingUp, Zap, Crown, DollarSign, Shield, Users, CheckCircle2, Clock, TrendingDown, ChevronDown, Star, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const programs = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Rapid Challenge',
      description: 'Fast-track program for experienced traders',
      profit: '10%',
      duration: '30 days'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Pro Challenge',
      description: 'Professional two-step evaluation process',
      profit: '8% + 5%',
      duration: '60 days'
    },
    {
      icon: <Crown className="w-8 h-8" />,
      title: 'VIP Instant Funding',
      description: 'Start trading with capital immediately',
      profit: 'Instant',
      duration: 'No challenge'
    }
  ]

  const challenges = [
    { name: '$10,000 Account', price: '$99', target: '10%', dailyDD: '5%', maxDD: '10%' },
    { name: '$25,000 Account', price: '$199', target: '10%', dailyDD: '5%', maxDD: '10%', popular: true },
    { name: '$100,000 Account', price: '$499', target: '10%', dailyDD: '5%', maxDD: '10%' }
  ]

  const whyChooseUs = [
    { icon: <DollarSign className="w-6 h-6" />, title: 'Up to 90% Profit Split', text: 'Keep most of your earnings' },
    { icon: <Zap className="w-6 h-6" />, title: 'Instant Payouts', text: 'Request withdrawal anytime' },
    { icon: <Shield className="w-6 h-6" />, title: 'No Time Limits', text: 'Trade at your own pace' },
    { icon: <Users className="w-6 h-6" />, title: 'Expert Support', text: '24/7 trader assistance' },
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Scale Up to $2M', text: 'Grow your account size' }
  ]

  const payouts = [
    { trader: 'John D.', account: '$50,000', profit: '$4,250', status: 'All Good', payout: '$3,825' },
    { trader: 'Sarah M.', account: '$100,000', profit: '$8,900', status: 'All Good', payout: '$8,010' },
    { trader: 'Mike P.', account: '$25,000', profit: '$2,100', status: 'On Track', payout: '$1,890' },
    { trader: 'Lisa K.', account: '$50,000', profit: '$3,800', status: 'Pending', payout: '$3,420' },
    { trader: 'David R.', account: '$100,000', profit: '$12,000', status: 'All Good', payout: '$10,800' }
  ]

  const stats = [
    { value: '$125M+', label: 'Total Payouts' },
    { value: '15,000+', label: 'Funded Traders' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Support' }
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient orbs */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] transition-transform duration-1000"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            left: mousePosition.x - 400,
            top: mousePosition.y - 400,
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            right: -200,
            top: scrollY * 0.3,
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            left: -100,
            bottom: -200 + scrollY * 0.2,
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-40"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative pt-20">
        <div className="text-center max-w-5xl mx-auto relative z-10">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-8 animate-fade-in-up">
            <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-sm text-blue-400">Trusted by 15,000+ traders worldwide</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight animate-fade-in-up animation-delay-100">
            Elite Capital for
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
                Skilled Traders
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Trade with up to <span className="text-blue-400 font-bold">$2M</span> in capital. 
            Keep up to <span className="text-green-400 font-bold">90%</span> of your profits.
            <br className="hidden md:block" />
            Join the elite community of funded traders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
            <Button
              onClick={() => router.push('/challenges')}
              size="lg"
              className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-12 py-7 text-lg rounded-full shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            <Button
              onClick={() => router.push('/challenges')}
              variant="outline"
              size="lg"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 px-8 py-7 text-lg rounded-full transition-all duration-300 hover:scale-105"
            >
              View Challenges
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in-up animation-delay-400">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-blue-500/50" />
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Our <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Programs</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <div 
                key={index}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <GlassCard hover className="relative text-center h-full transform transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      {program.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">{program.title}</h3>
                  <p className="text-gray-400 mb-6">{program.description}</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400">Profit Target:</span>
                      <span className="text-blue-400 font-bold">{program.profit}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-semibold">{program.duration}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Select Your Challenge Section */}
      <section id="select" className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Select Your <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Challenge</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {challenges.map((challenge, index) => (
              <div 
                key={index} 
                className={`group relative ${challenge.popular ? 'md:-translate-y-4' : ''}`}
              >
                {challenge.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-xs font-bold text-white z-10 animate-pulse">
                    MOST POPULAR
                  </div>
                )}
                <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${
                  challenge.popular 
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 opacity-50' 
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100'
                }`} />
                <GlassCard 
                  hover 
                  className={`relative h-full transform transition-all duration-500 group-hover:scale-[1.02] ${
                    challenge.popular ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : ''
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{challenge.name}</h3>
                    <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                      {challenge.price}
                    </div>
                    <div className="text-gray-400 text-sm">one-time fee</div>
                  </div>
                  <div className="space-y-3 text-sm mb-8">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                      <span className="text-gray-400">Profit Target:</span>
                      <span className="font-bold text-green-400">{challenge.target}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                      <span className="text-gray-400">Daily Drawdown:</span>
                      <span className="font-semibold">{challenge.dailyDD}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                      <span className="text-gray-400">Max Drawdown:</span>
                      <span className="font-semibold">{challenge.maxDD}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                      <span className="text-gray-400">Profit Split:</span>
                      <span className="font-bold text-blue-400">90%</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push('/challenges')}
                    className={`w-full font-bold py-6 text-lg rounded-xl transition-all duration-300 ${
                      challenge.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    }`}
                  >
                    Get Started
                  </Button>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why" className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Us</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="group">
                <GlassCard hover className="text-center h-full transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.text}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payouts Section */}
      <section id="payouts" className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Payouts & <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Success Stories</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto" />
          </div>
          
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-5 px-6 text-gray-400 font-semibold">Trader</th>
                    <th className="text-left py-5 px-6 text-gray-400 font-semibold">Account</th>
                    <th className="text-left py-5 px-6 text-gray-400 font-semibold">Profit</th>
                    <th className="text-left py-5 px-6 text-gray-400 font-semibold">Status</th>
                    <th className="text-left py-5 px-6 text-gray-400 font-semibold">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-800/50 hover:bg-white/5 transition-all duration-300 group"
                    >
                      <td className="py-5 px-6 font-semibold group-hover:text-blue-400 transition-colors">{payout.trader}</td>
                      <td className="py-5 px-6">{payout.account}</td>
                      <td className="py-5 px-6 text-green-400 font-bold">{payout.profit}</td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold transition-transform duration-300 group-hover:scale-105 ${
                          payout.status === 'All Good' ? 'bg-green-500/20 text-green-400' :
                          payout.status === 'On Track' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {payout.status === 'All Good' && <CheckCircle2 className="w-3 h-3" />}
                          {payout.status === 'On Track' && <Clock className="w-3 h-3" />}
                          {payout.status === 'Pending' && <TrendingDown className="w-3 h-3" />}
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{payout.payout}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
          
          <div className="text-center mt-16">
            <Button
              onClick={() => router.push('/challenges')}
              size="lg"
              className="group relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-16 py-7 text-lg rounded-full shadow-2xl shadow-blue-500/30 hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                Join the Group
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
      `}</style>
    </div>
  )
}
