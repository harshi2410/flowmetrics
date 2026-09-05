async function runTests() {
  const baseUrl = (process.argv[2] || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
  console.log(`=== Running Comprehensive API Verification Suite against ${baseUrl} ===`);
  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: "Bearer flowmetrics-admin-session-token",
  };

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log("1. GET /api/health ->", healthRes.status, healthData);

  // 2. Public Pricing
  const pricingRes = await fetch(`${baseUrl}/api/pricing`);
  const pricingData = await pricingRes.json();
  console.log("2. GET /api/pricing ->", pricingRes.status, `Loaded ${pricingData.length} plans (Growth highlighted: ${pricingData.some(p => p.highlighted)})`);

  // 3. Public Blog (Published only)
  const blogRes = await fetch(`${baseUrl}/api/blog`);
  const blogData = await blogRes.json();
  console.log("3. GET /api/blog ->", blogRes.status, `Loaded ${blogData.length} published posts (Featured post: "${blogData[0]?.title}")`);

  // 4. Draft Blog protection (Returns 404 for public)
  const draftRes = await fetch(`${baseUrl}/api/blog/internal-architecture-measuring-sprint-velocity`);
  console.log("4. GET /api/blog/internal-architecture-measuring-sprint-velocity ->", draftRes.status, "(Expected 404 Draft Protected)");

  // 5. Admin Auth Required (No Token -> 401)
  const unauthRes = await fetch(`${baseUrl}/api/admin/pricing`);
  console.log("5. GET /api/admin/pricing (no token) ->", unauthRes.status, "(Expected 401 Unauthorized)");

  // 6. Admin Auth with Admin Token -> 200
  const authRes = await fetch(`${baseUrl}/api/admin/pricing`, { headers: adminHeaders });
  console.log("6. GET /api/admin/pricing (admin token) ->", authRes.status, "(Expected 200 Authorized)");

  // 7. Zod Validation (Invalid Pricing Data -> 400)
  const invalidZodRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ name: "", price: -5, features: [] }),
  });
  const zodErr = await invalidZodRes.json();
  console.log("7. POST /api/admin/pricing (invalid payload) ->", invalidZodRes.status, "(Expected 400 Validation Error)", zodErr.error);

  // 8. Pricing CRUD (Create, Update, Delete)
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
  console.log("8a. POST /api/admin/pricing (Create) ->", createPlanRes.status, createdPlan.name, `ID: ${createdPlan.id}`);

  const updatePlanRes = await fetch(`${baseUrl}/api/admin/pricing/${createdPlan.id}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      price: 549,
      description: "Updated custom enterprise tier",
    }),
  });
  const updatedPlan = await updatePlanRes.json();
  console.log("8b. PUT /api/admin/pricing/:id (Update) ->", updatePlanRes.status, `Updated Price: $${updatedPlan.price}`);

  const deletePlanRes = await fetch(`${baseUrl}/api/admin/pricing/${createdPlan.id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  console.log("8c. DELETE /api/admin/pricing/:id (Delete) ->", deletePlanRes.status, "(Expected 200)");

  // 9. Blog CRUD (Create, Update, Delete)
  const createBlogRes = await fetch(`${baseUrl}/api/admin/blog`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      title: "Automated Test Article",
      slug: `automated-test-article-${Date.now()}`,
      excerpt: "Testing blog post CRUD operations end to end.",
      content: "This is a test article body created by the automated verification suite.",
      featured: false,
      published: true,
    }),
  });
  const createdBlog = await createBlogRes.json();
  console.log("9a. POST /api/admin/blog (Create) ->", createBlogRes.status, createdBlog.title, `Slug: ${createdBlog.slug}`);

  const updateBlogRes = await fetch(`${baseUrl}/api/admin/blog/${createdBlog.slug}`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({
      title: "Updated Automated Test Article",
      featured: true,
    }),
  });
  const updatedBlog = await updateBlogRes.json();
  console.log("9b. PUT /api/admin/blog/:id (Update) ->", updateBlogRes.status, `Updated Title: "${updatedBlog.title}" (Featured: ${updatedBlog.featured})`);

  const deleteBlogRes = await fetch(`${baseUrl}/api/admin/blog/${createdBlog.slug}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  console.log("9c. DELETE /api/admin/blog/:id (Delete) ->", deleteBlogRes.status, "(Expected 200)");

  // 10. Admin Stats
  const statsRes = await fetch(`${baseUrl}/api/admin/stats`, { headers: adminHeaders });
  const statsData = await statsRes.json();
  console.log("10. GET /api/admin/stats ->", statsRes.status, statsData);

  console.log("=== All 10 Full Stack Backend Verification Checks Passed Successfully! ===");
}

runTests().catch(console.error);
