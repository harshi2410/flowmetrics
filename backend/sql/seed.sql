-- Flowmetrics Seed Data Script
-- Initial data for Pricing Plans and Blog Posts

-- Insert Seed Pricing Plans
INSERT INTO pricing_plans (name, price, billing_cycle, description, features, highlighted)
VALUES 
(
    'Starter',
    0,
    'month',
    'For small teams getting started.',
    '["Team workload overview", "2 active projects", "Basic productivity reports", "Email support"]'::jsonb,
    false
),
(
    'Growth',
    49,
    'month',
    'For growing teams managing multiple projects.',
    '["Full capacity planner", "Unlimited active projects", "Project health alerts", "Burnout & bottleneck detection", "Priority support"]'::jsonb,
    true
),
(
    'Scale',
    199,
    'month',
    'For organizations managing larger distributed teams.',
    '["Advanced workload analytics", "Custom team benchmarks", "Cross-project resource allocation", "SSO & audit logs", "Dedicated success manager"]'::jsonb,
    false
)
ON CONFLICT DO NOTHING;

-- Insert Seed Blog Posts
INSERT INTO blog_posts (title, slug, excerpt, content, featured, published, created_at)
VALUES
(
    'How to Spot an Overloaded Team Before It Slows Down',
    'how-to-spot-an-overloaded-team-before-it-slows-down',
    'Early warning indicators engineering leaders can monitor to detect burnout and uneven workload distribution before deadlines slip.',
    'When high-performing teams suddenly slow down, the root cause is rarely skill or motivation — it is almost always invisible workload accumulation. Context switching, unplanned bug fixes, and uneven task allocation quietly deplete team momentum.

Effective managers do not wait for missed deadlines to diagnose overload. By monitoring weekly capacity distribution and work-in-progress ratios, you can rebalance assignments proactively.

Regular workload visibility conversations during 1-on-1s shift the dynamic from reactive fire-fighting to predictable, sustainable engineering velocity.',
    true,
    true,
    NOW() - INTERVAL '3 days'
),
(
    'Why Team Capacity Matters More Than Hours Worked',
    'why-team-capacity-matters-more-than-hours-worked',
    'Why measuring hours logged is a counterproductive metric, and how capacity forecasting leads to accurate delivery commitments.',
    'Measuring hours worked is an outdated manufacturing metric that breaks down in modern software engineering and knowledge work. A 60-hour week filled with cognitive overload often produces lower quality output than a focused 35-hour sprint.

Capacity measures real available focus time against project complexity. When managers understand their team''s true bandwidth, sprint planning transforms into a predictable science.

Teams that plan around capacity rather than raw hours consistently ship with fewer defects and retain their top engineering talent longer.',
    false,
    true,
    NOW() - INTERVAL '7 days'
),
(
    'A Practical Guide to Workload Visibility in Hybrid Teams',
    'a-practical-guide-to-workload-visibility',
    'A structured framework for tracking project progress, cross-team dependencies, and effort distribution across remote time zones.',
    'In hybrid and distributed organizations, the lack of informal hallway check-ins often creates information silos. Managers risk either over-communicating with tedious status meetings or losing touch with project reality.

Workload visibility is about aggregating progress signals automatically. By centralizing project health and milestone tracking, everyone on the team stays aligned on priorities without interruption.

Transparency builds autonomy. When teams can see where effort is concentrated, individuals self-organize around bottlenecks and resolve dependencies faster.',
    false,
    true,
    NOW() - INTERVAL '14 days'
),
(
    'How Engineering Managers Track Project Health Without Micromanaging',
    'how-engineering-managers-track-project-health',
    'How to maintain high standards of accountability and milestone accuracy while giving engineers full autonomy to build.',
    'Micromanagement is usually the symptom of anxiety caused by a lack of visibility. When leaders do not know whether a milestone is on track, they ask for more updates, disrupting the very focus needed to ship.

Objective project health metrics — velocity consistency, dependency resolution rate, and scope stability — provide the reassurance managers need while preserving team flow state.

Setting clear health thresholds empowers engineering squads to flag risks early without fear, making delivery surprises a thing of the past.',
    false,
    true,
    NOW() - INTERVAL '21 days'
),
(
    'Internal Architecture: Measuring Sprint Velocity (Draft)',
    'internal-architecture-measuring-sprint-velocity',
    'An internal draft guide on implementing sprint health heuristics for Flowmetrics engineering teams.',
    'This is an internal draft post created to verify that unpublished posts are strictly protected and never exposed to public visitors via GET /api/blog or GET /api/blog/:slug.

Only authenticated administrators can view and manage draft articles from the Admin CMS.',
    false,
    false,
    NOW()
)
ON CONFLICT DO NOTHING;
