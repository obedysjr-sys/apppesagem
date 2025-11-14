import React from 'react';

interface PageContentProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageContent({ title, subtitle, children }: PageContentProps) {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex items-center">
            <div className="grid gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
        {children}
    </main>
  );
}
