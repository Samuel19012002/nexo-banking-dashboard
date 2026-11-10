"use client";

import { useState } from "react";
import type { Transaction } from "@/types/banking";

type SortOrder = "newest" | "oldest" | "high" | "low";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function TransactionMark({ name, category }: { name: string; category: string }) {
  const tone = category === "Sales" ? "income-mark" : category === "Travel" ? "travel-mark" : "";
  return <span className={`merchant-mark transaction-logo ${tone}`}>{name[0]}</span>;
}

export function TransactionManager({ transactions }: { transactions: Transaction[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [reported, setReported] = useState(false);

  const categories = [...new Set(transactions.map((transaction) => transaction.category))].sort();

  const filtered = (() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions
      .filter((transaction) => !normalizedQuery || `${transaction.merchant} ${transaction.description} ${transaction.reference}`.toLowerCase().includes(normalizedQuery))
      .filter((transaction) => type === "All" || transaction.type === type)
      .filter((transaction) => status === "All" || transaction.status === status)
      .filter((transaction) => category === "All" || transaction.category === category)
      .toSorted((a, b) => {
        if (sort === "oldest") return a.date.localeCompare(b.date);
        if (sort === "high") return Math.abs(b.amount) - Math.abs(a.amount);
        if (sort === "low") return Math.abs(a.amount) - Math.abs(b.amount);
        return b.date.localeCompare(a.date);
      });
  })();

  const clearFilters = () => {
    setQuery("");
    setType("All");
    setStatus("All");
    setCategory("All");
    setSort("newest");
  };

  const downloadReceipt = (transaction: Transaction) => {
    const receipt = [
      "NEXO BANKING — TRANSACTION RECEIPT",
      "",
      `Merchant: ${transaction.merchant}`,
      `Description: ${transaction.description}`,
      `Amount: ${transaction.amount > 0 ? "+" : "-"}${money.format(Math.abs(transaction.amount))}`,
      `Date: ${dateFormat.format(new Date(transaction.date))}`,
      `Status: ${transaction.status}`,
      `Account: ${transaction.account}`,
      `Category: ${transaction.category}`,
      `Reference: ${transaction.reference}`,
      `Transaction ID: ${transaction.id}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexo-receipt-${transaction.reference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="transactions-toolbar" aria-label="Transaction filters">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search merchant, description, or reference" aria-label="Search transactions" />
        </label>
        <label className="select-field"><span>Type</span><select value={type} onChange={(event) => setType(event.target.value)}><option>All</option><option>Income</option><option>Expense</option></select></label>
        <label className="select-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Completed</option><option>Pending</option><option>Declined</option></select></label>
        <label className="select-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </section>

      <section className="panel transactions-table-panel">
        <div className="table-summary">
          <div><strong>{filtered.length} transactions</strong><span>Showing activity across all accounts</span></div>
          <label className="sort-field">Sort by <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="high">Highest amount</option><option value="low">Lowest amount</option></select></label>
        </div>

        <div className="data-table" role="table" aria-label="Transactions">
          <div className="data-row data-header" role="row"><span>Merchant</span><span>Category</span><span>Date</span><span>Status</span><span>Amount</span></div>
          {filtered.map((transaction) => (
            <button className="data-row transaction-button" role="row" key={transaction.id} onClick={() => { setSelected(transaction); setReported(false); }}>
              <span className="table-merchant"><TransactionMark name={transaction.merchant} category={transaction.category} /><span><strong>{transaction.merchant}</strong><small>{transaction.description}</small></span></span>
              <span><span className="category-chip">{transaction.category}</span></span>
              <span className="table-date">{dateFormat.format(new Date(transaction.date))}</span>
              <span><span className={`status status-${transaction.status.toLowerCase()}`}>{transaction.status}</span></span>
              <strong className={transaction.amount > 0 ? "positive" : ""}>{transaction.amount > 0 ? "+" : "−"}{money.format(Math.abs(transaction.amount))}</strong>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state"><span>⌕</span><h2>No transactions found</h2><p>Try a different search or reset your filters.</p><button className="ghost-button" onClick={clearFilters}>Clear filters</button></div>
        )}
      </section>

      {selected && (
        <div className="drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <aside className="transaction-drawer" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
            <div className="drawer-header"><p className="eyebrow">Transaction details</p><button className="close-button" onClick={() => setSelected(null)} aria-label="Close transaction details">×</button></div>
            <div className="drawer-merchant"><TransactionMark name={selected.merchant} category={selected.category} /><div><h2 id="transaction-title">{selected.merchant}</h2><p>{selected.description}</p></div></div>
            <div className={`drawer-amount ${selected.amount > 0 ? "positive" : ""}`}>{selected.amount > 0 ? "+" : "−"}{money.format(Math.abs(selected.amount))}</div>
            <span className={`status status-${selected.status.toLowerCase()}`}>{selected.status}</span>
            <dl className="detail-list">
              <div><dt>Date</dt><dd>{dateFormat.format(new Date(selected.date))}</dd></div>
              <div><dt>Account</dt><dd>{selected.account}</dd></div>
              <div><dt>Category</dt><dd>{selected.category}</dd></div>
              <div><dt>Reference</dt><dd>{selected.reference}</dd></div>
              <div><dt>Transaction ID</dt><dd>{selected.id}</dd></div>
            </dl>
            <div className="drawer-actions"><button className="full-button" onClick={() => downloadReceipt(selected)}>Download receipt</button><button className="ghost-button" onClick={() => setReported(true)} disabled={reported}>{reported ? "Issue reported ✓" : "Report an issue"}</button></div>
            {reported && <p className="drawer-feedback" role="status">Support has received the transaction reference and will follow up within one business day.</p>}
          </aside>
        </div>
      )}
    </>
  );
}
