import { testimonials } from "@/lib/data";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Trusted by engineering leaders & agency owners
      </h2>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="flex flex-col rounded-xl border border-line bg-surface p-6">
            <blockquote className="flex-1 text-sm leading-relaxed text-text">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-medium text-text">{t.name}</p>
              <p className="mt-0.5 text-xs text-muted">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
