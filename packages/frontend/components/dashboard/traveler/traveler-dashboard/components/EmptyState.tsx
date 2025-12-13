"use client";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

/**
 * Empty state placeholder for lists
 */
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
      {icon}
      {title && <p className="mb-2 text-lg font-semibold">{title}</p>}
      <p className="text-muted-foreground mb-4 text-sm">{subtitle}</p>
      {action}
    </div>
  );
}
