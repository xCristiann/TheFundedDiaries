import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/challenges - Get all active challenges
export async function GET(request) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('active', true)
      .order('balance', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ challenges: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/challenges/purchase - Purchase a challenge (placeholder for Stripe)
export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { challengeId } = body

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // TODO: Integrate Stripe payment here
    // For now, just create the trading account directly

    // Create trading account (trigger will auto-generate credentials)
    const { data: newAccount, error: accountError } = await supabase
      .from('trading_accounts')
      .insert([
        {
          user_id: user.id,
          challenge_id: challengeId,
          status: 'active'
        }
      ])
      .select()
      .single()

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Trading account created successfully',
      account: newAccount
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
