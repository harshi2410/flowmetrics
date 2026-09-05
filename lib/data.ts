export type Feature = {
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    title: "Workload visibility",
    description:
      "See where your team's time and effort actually go across sprints and deliverables without intrusive monitoring or manual timesheets.",
  },
  {
    title: "Team capacity",
    description:
      "Balance workload distribution before burnout happens. Know in advance which engineers are overloaded and which projects have room.",
  },
  {
    title: "Project health",
    description:
      "Get proactive indicators on milestone risks, scope creep, and velocity trends before critical delivery deadlines slip.",
  },
  {
    title: "Progress tracking",
    description:
      "Track sprint output, completed initiatives, and cross-team dependencies in a single executive-ready dashboard.",
  },
];

export type PricingPlan = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  period: "month" | "year";
  features: string[];
  highlighted?: boolean;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For small teams getting started.",
    price: 0,
    period: "month",
    features: [
      "Team workload overview",
      "2 active projects",
      "Basic productivity reports",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For growing teams managing multiple projects.",
    price: 49,
    period: "month",
    highlighted: true,
    features: [
      "Full capacity planner",
      "Unlimited active projects",
      "Project health alerts",
      "Burnout & bottleneck detection",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For organizations managing larger distributed teams.",
    price: 199,
    period: "month",
    features: [
      "Advanced workload analytics",
      "Custom team benchmarks",
      "Cross-project resource allocation",
      "SSO & audit logs",
      "Dedicated success manager",
    ],
  },
];

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "VP of Engineering, Kestrel Tech",
    quote:
      "Flowmetrics gave us complete clarity on sprint allocation. We balanced engineer workloads across four squads and cut burnout risks by half in our first quarter.",
  },
  {
    name: "Marcus Doyle",
    role: "Founder & Agency Director, Loopwork",
    quote:
      "Managing 12 client deliverables with remote contractors used to be guesswork. Flowmetrics shows us project health and capacity instantly without asking for status meetings.",
  },
  {
    name: "Elena Rostova",
    role: "Head of Product Delivery, Fieldnote",
    quote:
      "The capacity alerts caught milestone bottlenecks two weeks before launch. That single early warning saved our Q3 roadmap delivery.",
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  featured?: boolean;
  published?: boolean;
  date: string;
  readTime: string;
  author: string;
  createdAt?: string;
  updatedAt?: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-spot-an-overloaded-team-before-it-slows-down",
    title: "How to Spot an Overloaded Team Before It Slows Down",
    excerpt:
      "Early warning indicators engineering leaders can monitor to detect burnout and uneven workload distribution before deadlines slip.",
    date: "2026-08-20",
    readTime: "5 min read",
    author: "Sarah Chen",
    featured: true,
    published: true,
    content: [
      "When high-performing teams suddenly slow down, the root cause is rarely skill or motivation — it is almost always invisible workload accumulation. Context switching, unplanned bug fixes, and uneven task allocation quietly deplete team momentum.",
      "Effective managers do not wait for missed deadlines to diagnose overload. By monitoring weekly capacity distribution and work-in-progress ratios, you can rebalance assignments proactively.",
      "Regular workload visibility conversations during 1-on-1s shift the dynamic from reactive fire-fighting to predictable, sustainable engineering velocity.",
    ],
  },
  {
    slug: "why-team-capacity-matters-more-than-hours-worked",
    title: "Why Team Capacity Matters More Than Hours Worked",
    excerpt:
      "Why measuring hours logged is a counterproductive metric, and how capacity forecasting leads to accurate delivery commitments.",
    date: "2026-07-15",
    readTime: "4 min read",
    author: "Marcus Doyle",
    featured: false,
    published: true,
    content: [
      "Measuring hours worked is an outdated manufacturing metric that breaks down in modern software engineering and knowledge work. A 60-hour week filled with cognitive overload often produces lower quality output than a focused 35-hour sprint.",
      "Capacity measures real available focus time against project complexity. When managers understand their team's true bandwidth, sprint planning transforms into a predictable science.",
      "Teams that plan around capacity rather than raw hours consistently ship with fewer defects and retain their top engineering talent longer.",
    ],
  },
  {
    slug: "a-practical-guide-to-workload-visibility",
    title: "A Practical Guide to Workload Visibility in Hybrid Teams",
    excerpt:
      "A structured framework for tracking project progress, cross-team dependencies, and effort distribution across remote time zones.",
    date: "2026-06-28",
    readTime: "6 min read",
    author: "Elena Rostova",
    featured: false,
    published: true,
    content: [
      "In hybrid and distributed organizations, the lack of informal hallway check-ins often creates information silos. Managers risk either over-communicating with tedious status meetings or losing touch with project reality.",
      "Workload visibility is about aggregating progress signals automatically. By centralizing project health and milestone tracking, everyone on the team stays aligned on priorities without interruption.",
      "Transparency builds autonomy. When teams can see where effort is concentrated, individuals self-organize around bottlenecks and resolve dependencies faster.",
    ],
  },
  {
    slug: "how-engineering-managers-track-project-health",
    title: "How Engineering Managers Can Track Project Health Without Micromanaging",
    excerpt:
      "How to maintain high standards of accountability and milestone accuracy while giving engineers full autonomy to build.",
    date: "2026-05-10",
    readTime: "5 min read",
    author: "Sarah Chen",
    featured: false,
    published: true,
    content: [
      "Micromanagement is usually the symptom of anxiety caused by a lack of visibility. When leaders do not know whether a milestone is on track, they ask for more updates, disrupting the very focus needed to ship.",
      "Objective project health metrics — velocity consistency, dependency resolution rate, and scope stability — provide the reassurance managers need while preserving team flow state.",
      "Setting clear health thresholds empowers engineering squads to flag risks early without fear, making delivery surprises a thing of the past.",
    ],
  },
];
