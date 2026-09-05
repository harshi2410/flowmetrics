import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { AnalyticsPreview } from "@/components/landing/AnalyticsPreview";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { BlogPreview } from "@/components/landing/BlogPreview";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <AnalyticsPreview />
        <Pricing />
        <Testimonials />
        <BlogPreview />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
