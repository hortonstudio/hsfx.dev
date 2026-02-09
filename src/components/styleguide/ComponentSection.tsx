"use client";

interface ComponentSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ComponentSection({
  id,
  title,
  description,
  children,
}: ComponentSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <div className="mb-6">
        <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-text-muted max-w-2xl">{description}</p>
        )}
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}
