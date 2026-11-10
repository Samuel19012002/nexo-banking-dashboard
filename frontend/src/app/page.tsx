"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import type { Account, Transaction } from "@/types/banking";

type ChartPeriod = "3m" | "6m" | "12m";

const chartData: Record<ChartPeriod, number[]> = {
  "3m": [58, 42, 82, 55, 106, 72],
  "6m": [42, 32, 58, 45, 49, 38, 72, 50, 88, 63, 112, 76],
  "12m": [38, 28, 46, 35, 55, 42, 62, 48, 51, 40, 70, 53, 79, 61, 91, 69, 86, 66, 103, 74, 98, 71, 118, 82],
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>("6m");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${API_URL}/accounts`, { signal: controller.signal }),
      fetch(`${API_URL}/transactions`, { signal: controller.signal }),
    ]).then(async ([accountResponse, transactionResponse]) => {
      if (!accountResponse.ok || !transactionResponse.ok) throw new Error("Dashboard data could not be loaded.");
      const accountItems = await accountResponse.json() as Array<Omit<Account, "balance" | "available_balance"> & { balance: number | string; available_balance: number | string }>;
      const transactionItems = await transactionResponse.json() as Array<Omit<Transaction, "amount"> & { amount: number | string }>;
      setAccounts(accountItems.map((item) => ({ ...item, balance: Number(item.balance), available_balance: Number(item.available_balance) })));
      setTransactions(transactionItems.map((item) => ({ ...item, amount: Number(item.amount) })));
    }).catch((requestError: Error) => { if (requestError.name !== "AbortError") setError(requestError.message); });
    return () => controller.abort();
  }, []);

  const availableCash = accounts?.filter((account) => account.account_type !== "Credit account").reduce((total, account) => total + account.available_balance, 0) ?? 0;
  const moneyIn = transactions?.filter((item) => item.amount > 0).reduce((total, item) => total + item.amount, 0) ?? 0;
  const moneyOut = transactions?.filter((item) => item.amount < 0).reduce((total, item) => total + Math.abs(item.amount), 0) ?? 0;
  const pending = transactions?.filter((item) => item.status === "Pending").length ?? 0;
  const allDepositAccounts = accounts?.filter((account) => account.account_type !== "Credit account") ?? [];
  const depositAccounts = allDepositAccounts.slice(0, 2);

  if (error) return <section className="content"><div className="api-state api-error"><strong>Backend unavailable</strong><span>{error}</span></div></section>;
  if (!accounts || !transactions) return <section className="content"><div className="api-state"><span className="loading-spinner" /><strong>Loading dashboard…</strong></div></section>;

  return (
    <section className="content" id="overview">
      <header className="topbar"><div><p className="eyebrow">Tuesday, November 10</p><h1>Good morning, Alex.</h1></div><Link className="primary-button" href="/payments">＋ Send money</Link></header>

      <section className="summary-grid" aria-label="Account summary">
        <article className="metric-card"><p>Available cash</p><strong>{currency.format(availableCash)}</strong><small>Across {allDepositAccounts.length} deposit accounts</small></article>
        <article className="metric-card"><p>Money in</p><strong>{currency.format(moneyIn)}</strong><small>{transactions.filter((item) => item.amount > 0).length} incoming transfers</small></article>
        <article className="metric-card"><p>Money out</p><strong>{currency.format(moneyOut)}</strong><small>{pending} payments pending</small></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel cashflow-panel">
          <div className="panel-heading"><div><p className="eyebrow">Cash flow</p><h2>{currency.format(moneyIn - moneyOut)} net</h2></div><select className="ghost-select" value={period} onChange={(event) => setPeriod(event.target.value as ChartPeriod)} aria-label="Cash flow period"><option value="3m">Last 3 months</option><option value="6m">Last 6 months</option><option value="12m">Last 12 months</option></select></div>
          <div className={`chart chart-${period}`} aria-label={`Interactive cash flow chart for the last ${period.replace("m", " months")}`}>{chartData[period].map((height, index) => <span key={`${period}-${index}`} style={{ height }} title={`${index % 2 === 0 ? "Money in" : "Money out"}: ${height}`} />)}</div>
          <div className="legend"><span><i className="dot income" />Money in</span><span><i className="dot spending" />Money out</span></div>
        </article>

        <article className="panel account-panel" id="accounts">
          <div className="panel-heading"><div><p className="eyebrow">Accounts</p><h2>Your cash</h2></div></div>
          {depositAccounts.map((account) => <div className="account-row" key={account.id}><div><strong>{account.name}</strong><small>•••• {account.number_last4}</small></div><b>{currency.format(account.balance)}</b></div>)}
          <Link className="full-button" href="/accounts">View all accounts</Link>
        </article>
      </section>

      <section className="panel transactions-panel" id="transactions">
        <div className="panel-heading"><div><p className="eyebrow">Activity</p><h2>Recent transactions</h2></div><Link className="ghost-button" href="/transactions">View all</Link></div>
        <div className="transaction-list">{transactions.slice(0, 4).map((transaction) => <div className="transaction-row" key={transaction.id}><div className="merchant-mark">{transaction.merchant[0]}</div><div className="merchant"><strong>{transaction.merchant}</strong><small>{transaction.category}</small></div><span>{shortDate.format(new Date(transaction.date))}</span><b className={transaction.amount > 0 ? "positive" : ""}>{transaction.amount > 0 ? "+" : "−"}{currency.format(Math.abs(transaction.amount))}</b></div>)}</div>
      </section>
    </section>
  );
}
