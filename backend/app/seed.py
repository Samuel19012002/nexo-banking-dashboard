from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Account, Transaction


TRANSACTIONS = [
    ("Stripe", "Weekly platform payout", "Sales", "4821", "2026-11-10", "18420.00", "Completed", "Income", "ST-943820"),
    ("Amazon Web Services", "Cloud infrastructure", "Software", "9184", "2026-11-09", "-2846.19", "Completed", "Expense", "AWS-110926"),
    ("Gusto", "November payroll", "Payroll", "4821", "2026-11-08", "-24680.00", "Completed", "Expense", "PAY-202611"),
    ("Figma", "Organization plan", "Software", "9184", "2026-11-07", "-225.00", "Completed", "Expense", "FIG-48022"),
    ("Acme Retail Co.", "Invoice #1042", "Sales", "4821", "2026-11-06", "12875.50", "Pending", "Income", "INV-1042"),
    ("Notion", "Team workspace", "Software", "9184", "2026-11-05", "-160.00", "Completed", "Expense", "NOT-89211"),
    ("Delta Air Lines", "Client visit — New York", "Travel", "9184", "2026-11-04", "-1274.80", "Completed", "Expense", "DL-624890"),
    ("Riverside Properties", "Office rent", "Facilities", "4821", "2026-11-03", "-8500.00", "Completed", "Expense", "LEASE-1106"),
    ("Brightside Media", "Campaign retainer", "Marketing", "4821", "2026-11-02", "-4200.00", "Pending", "Expense", "BM-1102"),
    ("Summit Consulting", "Advisory services", "Professional services", "4821", "2026-11-01", "-3750.00", "Completed", "Expense", "SC-3284"),
    ("Vertex Labs", "Annual software license", "Sales", "4821", "2026-10-31", "22000.00", "Completed", "Income", "INV-1038"),
    ("Uber", "Team transportation", "Travel", "9184", "2026-10-30", "-86.42", "Completed", "Expense", "UB-792031"),
    ("LinkedIn", "Recruiting subscription", "Marketing", "9184", "2026-10-29", "-699.00", "Declined", "Expense", "LI-620178"),
    ("Internal transfer", "Transfer to tax reserve", "Transfer", "1906", "2026-10-28", "-12000.00", "Completed", "Expense", "TR-281026"),
]


def seed_database(db: Session) -> None:
    if db.scalar(select(func.count(Account.id))):
        return

    accounts = {
        "4821": Account(name="Operating", number_last4="4821", account_type="Business checking", balance=Decimal("218420.24"), available_balance=Decimal("213420.24")),
        "1906": Account(name="Tax reserve", number_last4="1906", account_type="Business savings", balance=Decimal("66260.00"), available_balance=Decimal("66260.00")),
        "9184": Account(name="Corporate card", number_last4="9184", account_type="Credit account", balance=Decimal("9491.41"), available_balance=Decimal("40508.59")),
    }
    db.add_all(accounts.values())
    db.flush()

    db.add_all([
        Transaction(
            merchant=merchant,
            description=description,
            category=category,
            account_id=accounts[last4].id,
            date=date.fromisoformat(transaction_date),
            amount=Decimal(amount),
            status=status,
            transaction_type=transaction_type,
            reference=reference,
        )
        for merchant, description, category, last4, transaction_date, amount, status, transaction_type, reference in TRANSACTIONS
    ])
    db.commit()
