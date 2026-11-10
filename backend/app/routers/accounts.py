from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Account
from app.schemas import AccountCreate, AccountRead


router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountRead])
def list_accounts(db: Session = Depends(get_db)) -> list[Account]:
    return list(db.scalars(select(Account).order_by(Account.name)))


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)) -> Account:
    existing = db.scalar(select(Account).where(Account.number_last4 == payload.number_last4))
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with those last four digits already exists.")

    account = Account(
        name=payload.name.strip(),
        number_last4=payload.number_last4,
        account_type=payload.account_type,
        balance=payload.opening_balance,
        available_balance=payload.opening_balance,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account
