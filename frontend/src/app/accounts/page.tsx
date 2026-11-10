"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import type { Account } from "@/types/banking";

type ActivityPeriod = "month" | "quarter" | "year";

const activityByPeriod: Record<ActivityPeriod, Array<{ label: string; value: number; amount: string; tone: string }>> = {
  month: [
    { label: "Operating", value: 78, amount: "$58,421 spent", tone: "bar-green" },
    { label: "Corporate card", value: 42, amount: "$9,491 spent", tone: "bar-lime" },
    { label: "Tax reserve", value: 18, amount: "$12,000 transferred", tone: "bar-soft" },
  ],
  quarter: [
    { label: "Operating", value: 86, amount: "$168,240 spent", tone: "bar-green" },
    { label: "Corporate card", value: 55, amount: "$31,820 spent", tone: "bar-lime" },
    { label: "Tax reserve", value: 31, amount: "$36,000 transferred", tone: "bar-soft" },
  ],
  year: [
    { label: "Operating", value: 92, amount: "$684,910 spent", tone: "bar-green" },
    { label: "Corporate card", value: 68, amount: "$118,440 spent", tone: "bar-lime" },
    { label: "Tax reserve", value: 47, amount: "$144,000 transferred", tone: "bar-soft" },
  ],
};

const accents = ["account-green", "account-lime", "account-dark"];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const accountOrder: Record<string, number> = { Operating: 0, "Tax reserve": 1, "Corporate card": 2 };

const normalizeAccount = (item: Omit<Account, "balance" | "available_balance"> & { balance: number | string; available_balance: number | string }): Account => ({
  ...item,
  balance: Number(item.balance),
  available_balance: Number(item.available_balance),
});

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState("");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>("month");
  const [form, setForm] = useState({ name: "", number_last4: "", account_type: "Business checking", opening_balance: "" });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/accounts`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Accounts could not be loaded.");
        return response.json() as Promise<Array<Omit<Account, "balance" | "available_balance"> & { balance: number | string; available_balance: number | string }>>;
      })
      .then((items) => setAccounts(items.map(normalizeAccount).toSorted((a, b) => (accountOrder[a.name] ?? 10) - (accountOrder[b.name] ?? 10))))
      .catch((requestError: Error) => { if (requestError.name !== "AbortError") setError(requestError.message); });
    return () => controller.abort();
  }, []);

  const totalCash = accounts?.filter((account) => account.account_type !== "Credit account").reduce((total, account) => total + account.balance, 0) ?? 0;
  const depositAccounts = accounts?.filter((account) => account.account_type !== "Credit account").length ?? 0;

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    const openingBalance = Number(form.opening_balance);
    if (!form.name.trim() || !/^\d{4}$/.test(form.number_last4) || !Number.isFinite(openingBalance) || openingBalance < 0) {
      setFormError("Enter a name, exactly four account digits, and a valid opening balance.");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), opening_balance: openingBalance }),
      });
      const result = await response.json() as (Omit<Account, "balance" | "available_balance"> & { balance: number | string; available_balance: number | string; detail?: string });
      if (!response.ok) throw new Error(result.detail || "The account could not be created.");
      setAccounts((current) => [...(current ?? []), normalizeAccount(result)]);
      setForm({ name: "", number_last4: "", account_type: "Business checking", opening_balance: "" });
      setShowAddAccount(false);
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : "The account could not be created.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="content accounts-page">
      <header className="topbar page-heading">
        <div><p className="eyebrow">Your money</p><h1>Accounts</h1><p className="page-description">Monitor balances stored in PostgreSQL.</p></div>
        <button className="primary-button" onClick={() => setShowAddAccount(true)}>＋ Add account</button>
      </header>
      {error && <div className="api-state api-error"><strong>Backend unavailable</strong><span>{error} Start the FastAPI service on port 8000.</span></div>}
      {!accounts && !error && <div className="api-state"><span className="loading-spinner" /><strong>Loading accounts…</strong></div>}
      {accounts && <>
        <section className="accounts-hero"><div><p>Total cash</p><strong>{currency.format(totalCash)}</strong><span>Across {depositAccounts} deposit accounts</span></div><div className="cash-change"><span>↗</span><div><strong>+$34,399.28</strong><small>Net cash flow this month</small></div></div></section>
        <section className="account-cards" aria-label="Bank accounts">
          {accounts.map((account, index) => <article className={`account-card ${accents[index % accents.length]}`} key={account.id}><div className="account-card-top"><span className="account-symbol">N</span></div><p>{account.account_type}</p><h2>{account.name}</h2><span className="account-number">•••• {account.number_last4}</span><div className="account-card-balance"><span>Current balance</span><strong>{currency.format(account.balance)}</strong></div><div className="account-card-footer"><span>Available</span><b>{currency.format(account.available_balance)}</b></div></article>)}
        </section>
      </>}
      <section className="accounts-detail-grid">
        <article className="panel spending-panel"><div className="panel-heading"><div><p className="eyebrow">Account activity</p><h2>Activity by account</h2></div><select className="ghost-select" value={activityPeriod} onChange={(event) => setActivityPeriod(event.target.value as ActivityPeriod)} aria-label="Activity period"><option value="month">This month</option><option value="quarter">This quarter</option><option value="year">This year</option></select></div><div className="activity-bars">{activityByPeriod[activityPeriod].map((item) => <div key={item.label}><div className="activity-label"><span>{item.label}</span><strong>{item.amount}</strong></div><div className="activity-track"><span className={item.tone} style={{ width: `${item.value}%` }} /></div></div>)}</div></article>
        <article className="panel account-details-panel"><p className="eyebrow">Account health</p><h2>Everything looks good</h2><div className="health-score"><span>98</span><small>Excellent</small></div><ul><li><span>✓</span>No payment issues</li><li><span>✓</span>Healthy cash reserve</li><li><span>✓</span>All accounts connected</li></ul></article>
      </section>

      {showAddAccount && <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddAccount(false); }}><form className="modal-card" onSubmit={createAccount}><div className="drawer-header"><div><p className="eyebrow">New bank account</p><h2>Add account</h2></div><button type="button" className="close-button" onClick={() => setShowAddAccount(false)} aria-label="Close add account form">×</button></div><p className="modal-description">Create a demo account and store it in PostgreSQL.</p><label className="form-field"><span>Account name</span><input className="text-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Payroll reserve" autoFocus /></label><label className="form-field"><span>Account type</span><select className="text-input" value={form.account_type} onChange={(event) => setForm({ ...form, account_type: event.target.value })}><option>Business checking</option><option>Business savings</option></select></label><label className="form-field"><span>Last four digits</span><input className="text-input" value={form.number_last4} onChange={(event) => setForm({ ...form, number_last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} inputMode="numeric" placeholder="0000" /></label><label className="form-field"><span>Opening balance</span><div className="amount-input compact"><span>$</span><input value={form.opening_balance} onChange={(event) => setForm({ ...form, opening_balance: event.target.value })} inputMode="decimal" placeholder="0.00" /></div></label>{formError && <p className="payment-api-error" role="alert">{formError}</p>}<button className="primary-button modal-submit" type="submit" disabled={isSaving}>{isSaving ? "Creating account…" : "Create account"}</button></form></div>}
    </section>
  );
}
