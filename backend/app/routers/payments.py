import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Account, Payment, Transaction
from app.schemas import PaymentCreate, PaymentRead


router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaymentRead])
def list_payments(db: Session = Depends(get_db)) -> list[PaymentRead]:
    payments = list(db.scalars(select(Payment).order_by(Payment.created_at.desc()).limit(20)))
    accounts = {account.id: account for account in db.scalars(select(Account).where(Account.id.in_([payment.account_id for payment in payments])))} if payments else {}
    return [
        PaymentRead(
            id=payment.id,
            confirmation=payment.confirmation,
            status=payment.status,
            recipient=payment.recipient,
            amount=payment.amount,
            memo=payment.memo,
            estimated_arrival=payment.estimated_arrival,
            created_at=payment.created_at,
            available_balance=accounts[payment.account_id].available_balance,
        )
        for payment in payments
    ]


@router.post("", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)) -> PaymentRead:
    account = db.scalar(select(Account).where(Account.number_last4 == payload.account_last4).with_for_update())
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found.")
    if account.available_balance < payload.amount:
        raise HTTPException(status_code=422, detail="The payment exceeds the available balance.")

    payment_id = uuid.uuid4()
    confirmation = f"NEX-{date.today():%Y%m%d}-{str(payment_id)[:6].upper()}"
    account.balance -= payload.amount
    account.available_balance -= payload.amount
    payment = Payment(
        id=payment_id,
        confirmation=confirmation,
        recipient=payload.recipient,
        amount=payload.amount,
        memo=payload.memo,
        status="scheduled",
        estimated_arrival=date.today(),
        account_id=account.id,
    )
    transaction = Transaction(
        merchant=payload.recipient,
        description=payload.memo or "Bank payment",
        category="Payment",
        account_id=account.id,
        date=date.today(),
        amount=Decimal("-1") * payload.amount,
        status="Pending",
        transaction_type="Expense",
        reference=confirmation,
    )
    db.add_all([payment, transaction])
    db.commit()
    db.refresh(payment)

    return PaymentRead(
        id=payment.id,
        confirmation=payment.confirmation,
        status=payment.status,
        recipient=payment.recipient,
        amount=payment.amount,
        memo=payment.memo,
        estimated_arrival=payment.estimated_arrival,
        created_at=payment.created_at,
        available_balance=account.available_balance,
    )
