"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import type { Account, Payment } from "@/types/banking";

type Step = "details" | "review" | "success";

const recipients = [
  { name: "Riverside Properties", initials: "RP", detail: "Business ••2940" },
  { name: "Brightside Media", initials: "BM", detail: "Business ••8302" },
  { name: "Summit Consulting", initials: "SC", detail: "Business ••1475" },
];

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PaymentFlow({ accounts, onSuccess }: { accounts: Account[]; onSuccess: (payment: Payment) => void }) {
  const [step, setStep] = useState<Step>("details");
  const [recipient, setRecipient] = useState(recipients[0].name);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [accountLast4, setAccountLast4] = useState(accounts.find((account) => account.name === "Operating")?.number_last4 ?? accounts[0]?.number_last4 ?? "");
  const selectedRecipient = recipients.find((item) => item.name === recipient) ?? recipients[0];
  const selectedAccount = accounts.find((account) => account.number_last4 === accountLast4) ?? accounts[0];
  const numericAmount = Number(amount);

  const review = (event: React.FormEvent) => {
    event.preventDefault();
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than $0.");
      return;
    }
    if (!selectedAccount || numericAmount > selectedAccount.available_balance) {
      setError("This amount is higher than your available balance.");
      return;
    }
    setError("");
    setStep("review");
  };

  const reset = () => {
    setAmount("");
    setMemo("");
    setError("");
    setConfirmation("");
    setStep("details");
  };

  const confirmPayment = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, amount: numericAmount, memo, account_last4: accountLast4 }),
      });
      const result = await response.json() as (Omit<Payment, "amount" | "available_balance"> & { amount?: number | string; available_balance?: number | string; detail?: string });

      if (!response.ok) throw new Error(result.detail || "The payment could not be scheduled.");

      setConfirmation(result.confirmation || "NEX-20261110-4821");
      onSuccess({ ...result, amount: Number(result.amount), available_balance: Number(result.available_balance) } as Payment);
      setStep("success");
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "The payment could not be scheduled.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <section className="payment-success panel" aria-live="polite">
        <div className="success-check">✓</div>
        <p className="eyebrow">Payment scheduled</p>
        <h1>{currency.format(numericAmount)}</h1>
        <p>Your payment to <strong>{recipient}</strong> is on its way and should arrive today.</p>
        <div className="success-reference"><span>Confirmation</span><strong>{confirmation}</strong></div>
        <button className="primary-button" onClick={reset}>Make another payment</button>
      </section>
    );
  }

  if (step === "review") {
    return (
      <section className="payment-card panel">
        <div className="payment-step-heading"><button className="back-button" onClick={() => setStep("details")} aria-label="Go back">←</button><div><p className="eyebrow">Final step</p><h2>Review your payment</h2></div></div>
        <div className="review-amount"><span>You’re sending</span><strong>{currency.format(numericAmount)}</strong></div>
        <div className="review-recipient"><span className="recipient-avatar">{selectedRecipient.initials}</span><div><small>To</small><strong>{selectedRecipient.name}</strong><span>{selectedRecipient.detail}</span></div></div>
        <dl className="review-list"><div><dt>From</dt><dd>{selectedAccount?.name} ••{selectedAccount?.number_last4}</dd></div><div><dt>Delivery</dt><dd>Today, free</dd></div><div><dt>Memo</dt><dd>{memo || "No memo"}</dd></div><div><dt>Total</dt><dd>{currency.format(numericAmount)}</dd></div></dl>
        {error && <p className="payment-api-error" role="alert">{error}</p>}
        <button className="primary-button payment-submit" onClick={confirmPayment} disabled={isSubmitting}>{isSubmitting ? "Scheduling payment…" : "Confirm and send"}</button>
        <p className="secure-note">▣ Protected with bank-level encryption</p>
      </section>
    );
  }

  return (
    <form className="payment-card panel" onSubmit={review} noValidate>
      <div className="payment-step-heading"><span className="step-number">1</span><div><p className="eyebrow">Payment details</p><h2>Who are you paying?</h2></div></div>
      <label className="form-field"><span>Recipient</span><div className="recipient-select-wrap"><span className="recipient-avatar">{selectedRecipient.initials}</span><select value={recipient} onChange={(event) => setRecipient(event.target.value)}>{recipients.map((item) => <option key={item.name}>{item.name}</option>)}</select></div></label>
      <label className="form-field"><span>Pay from</span><div className="account-select-wrap"><span className="mini-account-icon">N</span><select value={accountLast4} onChange={(event) => { setAccountLast4(event.target.value); setError(""); }}>{accounts.filter((account) => account.account_type !== "Credit account").map((account) => <option value={account.number_last4} key={account.id}>{account.name} ••{account.number_last4} — {currency.format(account.available_balance)} available</option>)}</select></div></label>
      <label className="form-field"><span>Amount</span><div className={`amount-input ${error ? "field-error" : ""}`}><span>$</span><input inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} placeholder="0.00" aria-describedby={error ? "amount-error" : undefined} /></div>{error && <small className="error-message" id="amount-error">{error}</small>}</label>
      <label className="form-field"><span>Memo <em>Optional</em></span><input className="text-input" value={memo} maxLength={80} onChange={(event) => setMemo(event.target.value)} placeholder="What is this payment for?" /><small className="character-count">{memo.length}/80</small></label>
      <button className="primary-button payment-submit" type="submit">Review payment <span>→</span></button>
    </form>
  );
}
