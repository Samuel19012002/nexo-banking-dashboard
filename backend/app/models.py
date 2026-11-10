import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80))
    number_last4: Mapped[str] = mapped_column(String(4), unique=True, index=True)
    account_type: Mapped[str] = mapped_column(String(80))
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    available_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(80), index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(30), index=True)
    transaction_type: Mapped[str] = mapped_column(String(30), index=True)
    reference: Mapped[str] = mapped_column(String(80), unique=True)
    account: Mapped[Account] = relationship(back_populates="transactions")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    confirmation: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    recipient: Mapped[str] = mapped_column(String(120))
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    memo: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="scheduled")
    estimated_arrival: Mapped[date] = mapped_column(Date)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
