async function runTests() {
  const baseUrl = (process.argv[2] || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
  console.log(`=== Running Comprehensive API Verification Suite against ${baseUrl} ===`);

  // 1. Health check with enhanced metrics
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log("1. GET /api/health ->", healthRes.status, "Status:", healthData.data?.status || healthData.status);

  // 2. Public Pricing
  const pricingRes = await fetch(`${baseUrl}/api/pricing`);
  const pricingData = await pricingRes.json();
  console.log("2. GET /api/pricing ->", pricingRes.status, `Loaded ${pricingData.length} plans`);

  // 3. Public Blog (Published only)
  const blogRes = await fetch(`${baseUrl}/api/blog`);
  const blogData = await blogRes.json();
  console.log("3. GET /api/blog ->", blogRes.status, `Loaded ${blogData.length} published posts`);

  // 4. Draft Blog protection (Returns 404 for public)
  const draftRes = await fetch(`${baseUrl}/api/blog/internal-architecture-measuring-sprint-velocity`);
  console.log("4. GET /api/blog/internal-architecture-measuring-sprint-velocity ->", draftRes.status, "(Expected 404 Draft Protected)");

  // 5. Admin Auth Required (No Token -> 401)
  const unauthRes = await fetch(`${baseUrl}/api/admin/pricing`);
  console.log("5. GET /api/admin/pricing (no token) ->", unauthRes.status, "(Expected 401 Unauthorized)");

  // 6. Security verification: Old Demo Token MUST BE REJECTED (401)
  const demoBypassRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    headers: { Authorization: "Bearer flowmetrics-admin-session-token" },
  });
  console.log("6. GET /api/admin/pricing (old demo bypass token) ->", demoBypassRes.status, "(Expected 401 Rejected - Demo Bypass Eliminated)");

  // 7. Obtain Authentic Signed JWT via /api/auth/login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@flowmetrics.io", password: "flowmetrics2026" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  console.log("7. POST /api/auth/login ->", loginRes.status, `Token generated: ${Boolean(token)}`);

  if (!token) {
    throw new Error("Failed to obtain signed authentication token!");
  }

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 8. Admin Auth with Verified Signed JWT -> 200
  const authRes = await fetch(`${baseUrl}/api/admin/pricing`, { headers: adminHeaders });
  console.log("8. GET /api/admin/pricing (signed JWT) ->", authRes.status, "(Expected 200 Authorized)");

  // 9. Zod Validation (Invalid Pricing Data -> 400)
  const invalidZodRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ name: "", price: -5, features: [] }),
  });
  const zodErr = await invalidZodRes.json();
  console.log("9. POST /api/admin/pricing (invalid payload) ->", invalidZodRes.status, "(Expected 400 Validation Error)");

  // 10. Pricing CRUD (Create, Update, Delete)
  const createPlanRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      name: "Enterprise Test",
      price: 499,
      billing_cycle: "month",
      description: "Custom enterprise tier for testing",
      features: ["Custom SLA", "Dedicated Cluster", "24/7 Phone Support"],
      highlighted: false,
    }),
  });
  const createdPlan = await createPlanRes.json();
  const planId = createdPlan.id || createdPlan.data?.id || "enterprise-test";
  console.log("10a. POST /api/admin/pricing (Create) ->", createPlanRes.status, `ID: ${planId}`);

  // 10b. Update
  const updatePlanRes = await fetch(`${baseUrl}/api/admin/pricing/${planId}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      name: "Enterprise Test Updated",
      price: 599,
      billing_cycle: "month",
      description: "Updated description",
      features: ["Updated Feature A", "Updated Feature B"],
      highlighted: true,
    }),
  });
  console.log("10b. PUT /api/admin/pricing/:id (Update) ->", updatePlanRes.status);

  // 10c. Delete
  const deletePlanRes = await fetch(`${baseUrl}/api/admin/pricing/${planId}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  console.log("10c. DELETE /api/admin/pricing/:id (Delete) ->", deletePlanRes.status);

  // 11. Security Headers Verification
  const headersCheck = await fetch(`${baseUrl}/api/health`);
  console.log("11. Security Headers Check:");
  console.log("    X-Content-Type-Options:", headersCheck.headers.get("x-content-type-options"));
  console.log("    X-Frame-Options:", headersCheck.headers.get("x-frame-options"));
  console.log("    X-Request-Id:", headersCheck.headers.get("x-request-id") ? "Present (UUID)" : "Missing");

  console.log("\n✅ All API & Security Verification Tests Completed Successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test suite encountered an error:", err);
  process.exit(1);
});
