import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:////tmp/nexo_api_test.db"

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


def test_banking_workflow() -> None:
    Base.metadata.drop_all(bind=engine)

    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok"}

        accounts_before = client.get("/api/accounts")
        assert accounts_before.status_code == 200
        assert len(accounts_before.json()) == 3
        operating_before = next(account for account in accounts_before.json() if account["number_last4"] == "4821")

        new_account = client.post(
            "/api/accounts",
            json={"name": "Vendor reserve", "number_last4": "7712", "account_type": "Business savings", "opening_balance": 5000},
        )
        assert new_account.status_code == 201
        assert new_account.json()["name"] == "Vendor reserve"

        transactions_before = client.get("/api/transactions")
        assert transactions_before.status_code == 200
        assert len(transactions_before.json()) == 14

        payment = client.post(
            "/api/payments",
            json={
                "recipient": "Riverside Properties",
                "amount": 1250,
                "memo": "November office rent",
                "account_last4": "4821",
            },
        )
        assert payment.status_code == 201
        assert payment.json()["status"] == "scheduled"
        assert payment.json()["confirmation"].startswith("NEX-")
        payments = client.get("/api/payments")
        assert payments.status_code == 200
        assert payments.json()[0]["confirmation"] == payment.json()["confirmation"]

        accounts_after = client.get("/api/accounts").json()
        operating_after = next(account for account in accounts_after if account["number_last4"] == "4821")
        assert float(operating_after["available_balance"]) == float(operating_before["available_balance"]) - 1250

        transactions_after = client.get("/api/transactions").json()
        assert len(transactions_after) == 15
        assert transactions_after[0]["merchant"] == "Riverside Properties"


def test_rejects_payment_above_available_balance() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/payments",
            json={"recipient": "Large Vendor", "amount": 999999, "account_last4": "4821"},
        )
        assert response.status_code == 422
