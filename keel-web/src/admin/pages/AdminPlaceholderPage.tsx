// keel-web/src/admin/pages/AdminPlaceholderPage.tsx
// keel-web/src/admin/pages/AdminPlaceholderPage.tsx
// Reusable placeholder page component used until each screen is built.

type AdminPlaceholderPageProps = {
  title: string;
  description?: string;
};

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {description || "Placeholder. Screen will be implemented next."}
      </p>
    </div>
  );
}
