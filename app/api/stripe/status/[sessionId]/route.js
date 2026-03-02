import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Call Python backend for status check
    const pythonResponse = await fetch(`http://localhost:8001/api/stripe/status/${sessionId}`)

    if (!pythonResponse.ok) {
      const error = await pythonResponse.json()
      return NextResponse.json(
        { error: error.detail || 'Failed to get payment status' },
        { status: pythonResponse.status }
      )
    }

    const data = await pythonResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
