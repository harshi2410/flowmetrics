import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-client";

export const dynamic = "force-dynamic";

async function fetchStats() {
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/api/admin/stats`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }

  return {
    plansCount: 3,
    postsCount: 5,
    publishedCount: 4,
    highlightedPlan: "Growth",
    latestPost: "How to Spot an Overloaded Team Before It Slows Down",
  };
}

export default async function AdminDashboardPage() {
  const data = await fetchStats();

  return (
    <div className="space-y-6 max-w-[1160px]">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pb-2">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">
            Operations overview
          </h1>
          <p className="text-sm text-muted">
            Support, delivery and agent activity &middot; live workspace data
          </p>
        </div>
        <span className="tag m self-start sm:self-auto">Last 7 days</span>
      </div>

      {/* KPI 4-Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted font-medium">Open tickets</div>
          <div className="text-2xl font-bold font-mono text-text mt-1">142</div>
          <small className="text-xs text-signal mt-1 block">12 fewer than last week</small>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted font-medium">SLA at risk</div>
          <div className="text-2xl font-bold font-mono text-text mt-1">9</div>
          <small className="text-xs text-warning mt-1 block" style={{ color: "var(--color-warning)" }}>
            3 within the hour
          </small>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted font-medium">Active projects</div>
          <div className="text-2xl font-bold font-mono text-text mt-1">18</div>
          <small className="text-xs text-signal mt-1 block">2 at risk</small>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted font-medium">Pending approvals</div>
          <div className="text-2xl font-bold font-mono text-text mt-1">4</div>
          <small className="text-xs text-muted mt-1 block">From the triage agent</small>
        </div>
      </div>

      {/* Two-Column Section: Chart & Project Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket Volume Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between font-semibold text-sm text-text">
            <span>Ticket volume</span>
            <span className="text-xs font-mono text-muted">per day</span>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox="0 0 600 170"
              className="w-full h-auto"
              role="img"
              aria-label="Ticket volume trend"
            >
              <g stroke="var(--color-line)">
                <path d="M0 40H600M0 90H600M0 140H600" />
              </g>
              <path
                d="M0 120C60 110 90 60 150 70S250 130 310 90 420 30 480 55 560 40 600 30V170H0z"
                fill="color-mix(in srgb, var(--color-signal) 14%, transparent)"
              />
              <path
                d="M0 120C60 110 90 60 150 70S250 130 310 90 420 30 480 55 560 40 600 30"
                fill="none"
                stroke="var(--color-signal)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Project Health (1 Col) */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-sm space-y-3">
          <div className="font-semibold text-sm text-text">Project health</div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text font-medium">Mobile app v2</span>
                <span className="tag">Healthy</span>
              </div>
              <div className="bar">
                <i style={{ width: "82%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text font-medium">Data migration</span>
                <span className="tag w">At risk</span>
              </div>
              <div className="bar">
                <i style={{ width: "54%", background: "var(--color-warning)" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text font-medium">Partner portal</span>
                <span className="tag d">Critical</span>
              </div>
              <div className="bar">
                <i style={{ width: "27%", background: "var(--color-danger)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Needing Attention Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="border-b border-line px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text">Tickets needing attention</span>
          <Link href="/admin/support" className="text-xs text-signal hover:underline font-medium">
            View all tickets &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-surface-2/40 text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Ticket</th>
                <th className="px-4 py-2.5 font-semibold">Subject</th>
                <th className="px-4 py-2.5 font-semibold">Priority</th>
                <th className="px-4 py-2.5 font-semibold">SLA</th>
                <th className="px-4 py-2.5 font-semibold">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="hover:bg-surface-2/30 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-signal">#4821</td>
                <td className="px-4 py-3 font-medium text-text">Checkout API returning 502</td>
                <td className="px-4 py-3">
                  <span className="tag d">Critical</span>
                </td>
                <td className="px-4 py-3">
                  <span className="tag d">Breach in 14m</span>
                </td>
                <td className="px-4 py-3 text-muted">R. Mehta</td>
              </tr>
              <tr className="hover:bg-surface-2/30 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-signal">#4818</td>
                <td className="px-4 py-3 font-medium text-text">Invoice export missing rows</td>
                <td className="px-4 py-3">
                  <span className="tag w">High</span>
                </td>
                <td className="px-4 py-3">
                  <span className="tag w">2h 10m left</span>
                </td>
                <td className="px-4 py-3 text-muted">S. Iyer</td>
              </tr>
              <tr className="hover:bg-surface-2/30 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-signal">#4809</td>
                <td className="px-4 py-3 font-medium text-text">SSO login loop for new users</td>
                <td className="px-4 py-3">
                  <span className="tag w">High</span>
                </td>
                <td className="px-4 py-3">
                  <span className="tag">On track</span>
                </td>
                <td className="px-4 py-3 text-muted">Unassigned</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Preserved CMS Stats & Latest Post */}
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-semibold text-text uppercase tracking-wider">
            Content & Pricing Summary
          </span>
          <div className="flex gap-3 text-xs">
            <Link href="/admin/pricing" className="text-signal hover:underline">
              Pricing Plans ({data.plansCount})
            </Link>
            <span>&middot;</span>
            <Link href="/admin/blog" className="text-signal hover:underline">
              Blog Posts ({data.postsCount})
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted">Latest published article: </span>
            <span className="font-medium text-text">{data.latestPost || "No published posts yet."}</span>
          </div>
          <Link
            href="/admin/generator"
            className="tag self-start sm:self-auto"
            style={{ padding: "4px 10px" }}
          >
            Open AI Content Studio &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
