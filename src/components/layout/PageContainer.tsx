import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageContainer({ children, title, description, action }: PageContainerProps) {
  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-foreground-secondary mt-1">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
