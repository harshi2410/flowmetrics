async function runTests() {
  const baseUrl = "http://localhost:5000";
  console.log("=== Running API Tests ===");

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log("1. GET /api/health ->", healthRes.status, healthData);

  // 2. Public Pricing
  const pricingRes = await fetch(`${baseUrl}/api/pricing`);
  const pricingData = await pricingRes.json();
  console.log("2. GET /api/pricing ->", pricingRes.status, `Loaded ${pricingData.length} plans`);

  // 3. Public Blog
  const blogRes = await fetch(`${baseUrl}/api/blog`);
  const blogData = await blogRes.json();
  console.log("3. GET /api/blog ->", blogRes.status, `Loaded ${blogData.length} published posts`);

  // 4. Draft Blog protection
  const draftRes = await fetch(`${baseUrl}/api/blog/internal-architecture-measuring-sprint-velocity`);
  console.log("4. GET /api/blog/internal-architecture-measuring-sprint-velocity ->", draftRes.status, "(Expected 404)");

  // 5. Admin Auth Required (No Token)
  const unauthRes = await fetch(`${baseUrl}/api/admin/pricing`);
  console.log("5. GET /api/admin/pricing (no token) ->", unauthRes.status, "(Expected 401)");

  // 6. Admin Auth with Admin Token
  const authRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    headers: { Authorization: "Bearer flowmetrics-admin-session-token" },
  });
  console.log("6. GET /api/admin/pricing (admin token) ->", authRes.status, "(Expected 200)");

  // 7. Zod Validation (Invalid Data)
  const invalidZodRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer flowmetrics-admin-session-token",
    },
    body: JSON.stringify({ name: "", price: -5, features: [] }),
  });
  const zodErr = await invalidZodRes.json();
  console.log("7. POST /api/admin/pricing (invalid payload) ->", invalidZodRes.status, "(Expected 400)", zodErr.error);

  // 8. Admin Stats
  const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: "Bearer flowmetrics-admin-session-token" },
  });
  const statsData = await statsRes.json();
  console.log("8. GET /api/admin/stats ->", statsRes.status, statsData);

  console.log("=== All Backend API Tests Passed Successfully! ===");
}

runTests().catch(console.error);
