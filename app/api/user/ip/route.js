import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function GET(request) {
  try {
    const headersList = await headers()
    
    // Get IP from various headers (prioritize forwarded headers for proxied requests)
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('cf-connecting-ip') ||
               'unknown'

    return NextResponse.json({ ip })
  } catch (error) {
    return NextResponse.json({ ip: 'unknown' }, { status: 200 })
  }
}

export async function POST(request) {
  try {
    const headersList = await headers()
    const { userId, type } = await request.json()
    
    // Get IP from various headers
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headersList.get('x-real-ip') ||
               headersList.get('cf-connecting-ip') ||
               'unknown'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update user's IP address
    if (type === 'login') {
      await supabase
        .from('profiles')
        .update({ 
          last_login_ip: ip,
          ip_address: ip 
        })
        .eq('id', userId)
    } else if (type === 'signup') {
      await supabase
        .from('profiles')
        .update({ 
          ip_address: ip,
          last_login_ip: ip 
        })
        .eq('id', userId)
    }

    // Check for duplicate IPs
    const { data: duplicates } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .or(`ip_address.eq.${ip},last_login_ip.eq.${ip}`)
      .neq('id', userId)

    // If duplicates found, flag all accounts with this IP
    if (duplicates && duplicates.length > 0) {
      // Flag current user
      await supabase
        .from('profiles')
        .update({ ip_flagged: true })
        .eq('id', userId)

      // Flag all users with same IP
      const userIds = duplicates.map(d => d.id)
      userIds.push(userId)
      
      await supabase
        .from('profiles')
        .update({ ip_flagged: true })
        .in('id', userIds)

      // Also flag their trading accounts
      await supabase
        .from('trading_accounts')
        .update({ ip_flagged: true })
        .in('user_id', userIds)
    }

    return NextResponse.json({ 
      ip, 
      flagged: duplicates && duplicates.length > 0,
      duplicateCount: duplicates?.length || 0
    })
  } catch (error) {
    console.error('IP tracking error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
