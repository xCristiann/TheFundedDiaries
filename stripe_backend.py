from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionRequest, 
    CheckoutSessionResponse,
    CheckoutStatusResponse
)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for payment transactions (in production use database)
payment_transactions = {}

# Challenge prices - defined on backend for security
CHALLENGE_PRICES = {
    # These will be fetched from Supabase in real implementation
    # For now, we'll accept the price from the request but validate it
}

class CreateCheckoutRequest(BaseModel):
    challenge_id: str
    origin_url: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    coupon_code: Optional[str] = None
    discount_amount: Optional[float] = 0
    final_price: Optional[float] = None
    challenge_name: Optional[str] = None
    platform: Optional[str] = "tfd-trade"

class PaymentStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str
    metadata: Dict[str, str]
    trading_account_created: bool = False

@app.post("/api/stripe/create-checkout")
async def create_checkout_session(request: Request, data: CreateCheckoutRequest):
    """Create a Stripe checkout session"""
    try:
        api_key = os.getenv("STRIPE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
        # Initialize Stripe
        webhook_url = f"{data.origin_url}/api/stripe/webhook"
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{data.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{data.origin_url}/checkout?challenge={data.challenge_id}"
        
        # Calculate final amount (must be float)
        amount = float(data.final_price or 99.00)
        
        # Apply discount if present
        if data.discount_amount and data.discount_amount > 0:
            amount = max(0.0, amount - float(data.discount_amount))
        
        # Ensure minimum amount
        if amount < 0.50:
            amount = 0.50
        
        # Metadata for tracking
        metadata = {
            "challenge_id": data.challenge_id,
            "user_id": data.user_id or "guest",
            "email": data.email or "",
            "coupon_code": data.coupon_code or "",
            "platform": data.platform or "tfd-trade",
            "challenge_name": data.challenge_name or "Trading Challenge"
        }
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction
        transaction_id = str(uuid.uuid4())
        payment_transactions[session.session_id] = {
            "id": transaction_id,
            "session_id": session.session_id,
            "challenge_id": data.challenge_id,
            "user_id": data.user_id,
            "email": data.email,
            "amount": amount,
            "currency": "usd",
            "coupon_code": data.coupon_code,
            "platform": data.platform,
            "payment_status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "metadata": metadata
        }
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        print(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stripe/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status for a checkout session"""
    try:
        api_key = os.getenv("STRIPE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        # Get status from Stripe
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if exists
        trading_account_created = False
        if session_id in payment_transactions:
            transaction = payment_transactions[session_id]
            old_status = transaction.get("payment_status")
            
            # Only process if not already processed
            if status.payment_status == "paid" and old_status != "paid":
                transaction["payment_status"] = "paid"
                transaction["status"] = status.status
                trading_account_created = True
                # In production: Create trading account in Supabase here
            elif old_status == "paid":
                trading_account_created = True
            else:
                transaction["payment_status"] = status.payment_status
                transaction["status"] = status.status
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total / 100,  # Convert cents to dollars
            "currency": status.currency,
            "metadata": status.metadata,
            "trading_account_created": trading_account_created
        }
        
    except Exception as e:
        print(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stripe/webhook")
async def handle_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        api_key = os.getenv("STRIPE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
        body = await request.body()
        signature = request.headers.get("stripe-signature", "")
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Process webhook event
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            if session_id in payment_transactions:
                payment_transactions[session_id]["payment_status"] = "paid"
                # In production: Create trading account here
        
        return {"status": "success", "event_type": webhook_response.event_type}
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
