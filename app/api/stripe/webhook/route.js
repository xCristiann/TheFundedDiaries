import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    // Forward to Python backend
    const pythonResponse = await fetch('http://localhost:8001/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Stripe-Signature': signature || ''
      },
      body: body
    })

    if (!pythonResponse.ok) {
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: pythonResponse.status }
      )
    }

    const data = await pythonResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
