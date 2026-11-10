"use client";

import { useEffect, useState } from "react";
import { TransactionManager } from "@/components/transaction-manager";
import { API_URL } from "@/lib/api";
import type { Transaction } from "@/types/banking";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/transactions`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Transactions could not be loaded.");
        return response.json() as Promise<Array<Omit<Transaction, "amount"> & { amount: number | string }>>;
      })
      .then((items) => setTransactions(items.map((item) => ({ ...item, amount: Number(item.amount) }))))
      .catch((requestError: Error) => { if (requestError.name !== "AbortError") setError(requestError.message); });
    return () => controller.abort();
  }, []);

  const totalIn = transactions?.filter((item) => item.amount > 0).reduce((total, item) => total + item.amount, 0) ?? 0;
  const totalOut = transactions?.filter((item) => item.amount < 0).reduce((total, item) => total + Math.abs(item.amount), 0) ?? 0;
  const pending = transactions?.filter((item) => item.status === "Pending").length ?? 0;

  const exportCsv = () => {
    if (!transactions?.length) return;
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Date", "Merchant", "Description", "Category", "Account", "Status", "Type", "Amount", "Reference"],
      ...transactions.map((item) => [item.date, item.merchant, item.description, item.category, item.account, item.status, item.type, item.amount.toFixed(2), item.reference]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexo-transactions-2026-11-10.csv";
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`${transactions.length} transactions exported`);
  };

  return (
    <section className="content transactions-page">
      <header className="topbar page-heading">
        <div><p className="eyebrow">Money movement</p><h1>Transactions</h1><p className="page-description">Search, filter, and review activity stored in PostgreSQL.</p></div>
        <div className="header-action"><button className="secondary-button" onClick={exportCsv} disabled={!transactions?.length}>⇩ Export CSV</button>{exportMessage && <small role="status">{exportMessage}</small>}</div>
      </header>
      <section className="transaction-insights" aria-label="Transaction summary">
        <article><span className="insight-icon income-icon">↓</span><div><p>Money in</p><strong>{currency.format(totalIn)}</strong><small>Incoming transfers</small></div></article>
        <article><span className="insight-icon expense-icon">↑</span><div><p>Money out</p><strong>{currency.format(totalOut)}</strong><small>Expenses and transfers</small></div></article>
        <article><span className="insight-icon pending-icon">◷</span><div><p>Pending</p><strong>{pending}</strong><small>Needs no action</small></div></article>
      </section>
      {error && <div className="api-state api-error"><strong>Backend unavailable</strong><span>{error} Start the FastAPI service on port 8000.</span></div>}
      {!transactions && !error && <div className="api-state"><span className="loading-spinner" /><strong>Loading transactions…</strong></div>}
      {transactions && <TransactionManager transactions={transactions} />}
    </section>
  );
}
