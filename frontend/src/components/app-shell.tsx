"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Overview", href: "/", icon: "⌂" },
  { label: "Transactions", href: "/transactions", icon: "↕" },
  { label: "Accounts", href: "/accounts", icon: "▣" },
  { label: "Payments", href: "/payments", icon: "→" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Nexo overview">
          <span>N</span>Nexo
        </Link>
        <nav aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link className={active ? "active" : ""} href={item.href} key={item.href}>
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">AM</div>
          <div><strong>Alex Morgan</strong><small>Northstar Labs</small></div>
        </div>
      </aside>
      {children}
    </main>
  );
}
