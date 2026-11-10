import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class AccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    number_last4: str
    account_type: str
    balance: Decimal
    available_balance: Decimal


class AccountCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    number_last4: str = Field(pattern=r"^\d{4}$")
    account_type: str = Field(min_length=2, max_length=80)
    opening_balance: Decimal = Field(ge=0, max_digits=14, decimal_places=2)


class TransactionRead(BaseModel):
    id: uuid.UUID
    merchant: str
    description: str
    category: str
    account: str
    date: date
    amount: Decimal
    status: str
    type: str
    reference: str


class PaymentCreate(BaseModel):
    recipient: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    memo: str = Field(default="", max_length=80)
    account_last4: str = Field(default="4821", min_length=4, max_length=4)


class PaymentRead(BaseModel):
    id: uuid.UUID
    confirmation: str
    status: str
    recipient: str
    amount: Decimal
    memo: str
    estimated_arrival: date
    created_at: datetime
    available_balance: Decimal
