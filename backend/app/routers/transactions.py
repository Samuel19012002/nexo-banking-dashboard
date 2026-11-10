from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Transaction
from app.schemas import TransactionRead


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    search: str | None = Query(default=None, max_length=100),
    status: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[TransactionRead]:
    statement = select(Transaction).options(joinedload(Transaction.account)).order_by(Transaction.date.desc())
    if search:
        term = f"%{search}%"
        statement = statement.where(or_(Transaction.merchant.ilike(term), Transaction.description.ilike(term), Transaction.reference.ilike(term)))
    if status:
        statement = statement.where(Transaction.status == status)
    if category:
        statement = statement.where(Transaction.category == category)

    return [
        TransactionRead(
            id=item.id,
            merchant=item.merchant,
            description=item.description,
            category=item.category,
            account=f"{item.account.name} ••{item.account.number_last4}",
            date=item.date,
            amount=item.amount,
            status=item.status,
            type=item.transaction_type,
            reference=item.reference,
        )
        for item in db.scalars(statement)
    ]
