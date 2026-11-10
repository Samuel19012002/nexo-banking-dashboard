"use client";

import { useEffect, useState } from "react";
import { PaymentFlow } from "@/components/payment-flow";
import { API_URL } from "@/lib/api";
import type { Account, Payment } from "@/types/banking";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

async function fetchPaymentData() {
  const [accountsResponse, paymentsResponse] = await Promise.all([fetch(`${API_URL}/accounts`), fetch(`${API_URL}/payments`)]);
  if (!accountsResponse.ok || !paymentsResponse.ok) throw new Error("Payment data could not be loaded.");
  const accountItems = await accountsResponse.json() as Array<Omit<Account, "balance" | "available_balance"> & { balance: number | string; available_balance: number | string }>;
  const paymentItems = await paymentsResponse.json() as Array<Omit<Payment, "amount" | "available_balance"> & { amount: number | string; available_balance: number | string }>;
  return {
    accounts: accountItems.map((item) => ({ ...item, balance: Number(item.balance), available_balance: Number(item.available_balance) })),
    payments: paymentItems.map((item) => ({ ...item, amount: Number(item.amount), available_balance: Number(item.available_balance) })),
  };
}

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchPaymentData().then((data) => { if (active) { setAccounts(data.accounts); setPayments(data.payments); setError(""); } }).catch((requestError: Error) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  const operating = accounts?.find((account) => account.name === "Operating") ?? accounts?.[0];
  const onPaymentSuccess = () => { void fetchPaymentData().then((data) => { setAccounts(data.accounts); setPayments(data.payments); }); };

  return (
    <section className="content payments-page">
      <header className="topbar page-heading"><div><p className="eyebrow">Move money</p><h1>Send money</h1><p className="page-description">Schedule a secure payment from your Nexo account.</p></div></header>
      {error && <div className="api-state api-error"><strong>Backend unavailable</strong><span>{error}</span></div>}
      {!accounts && !error && <div className="api-state"><span className="loading-spinner" /><strong>Loading payment data…</strong></div>}
      {accounts && <div className="payment-layout">
        <PaymentFlow accounts={accounts} onSuccess={onPaymentSuccess} />
        <aside className="payment-sidebar">
          <article className="panel available-card"><p className="eyebrow">Available to send</p><strong>{currency.format(operating?.available_balance ?? 0)}</strong><span>{operating?.name} ••{operating?.number_last4}</span><div className="balance-track"><span /></div><small>Updated directly from PostgreSQL</small></article>
          <article className="panel upcoming-card"><div className="panel-heading"><div><p className="eyebrow">Scheduled</p><h2>Recent payments</h2></div></div>{payments.length === 0 && <p className="empty-payments">No scheduled payments yet.</p>}{payments.slice(0, 4).map((payment) => <div className="upcoming-row" key={payment.id}><span className="recipient-avatar">{payment.recipient.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div><strong>{payment.recipient}</strong><small>{shortDate.format(new Date(payment.estimated_arrival))} · {payment.status}</small></div><b>{currency.format(payment.amount)}</b></div>)}</article>
          <article className="payment-help"><span>?</span><div><strong>Need help?</strong><p>Payments are protected and monitored around the clock.</p></div></article>
        </aside>
      </div>}
    </section>
  );
}
