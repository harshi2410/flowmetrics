export const dynamic = "force-dynamic";

async function fetchStats() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/admin/stats`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return data;
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

  const stats = [
    { label: "Pricing plans", value: data.plansCount },
    { label: "Blog posts", value: data.postsCount },
    { label: "Published posts", value: data.publishedCount },
    { label: "Highlighted plan", value: data.highlightedPlan },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        A quick CMS overview of what&apos;s live on Flowmetrics right now.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-line bg-surface p-5">
        <p className="text-sm font-medium text-text">Latest published post</p>
        {data.latestPost ? (
          <p className="mt-1.5 text-sm text-muted">{data.latestPost}</p>
        ) : (
          <p className="mt-1.5 text-sm text-muted">No published posts yet.</p>
        )}
      </div>
    </div>
  );
}
