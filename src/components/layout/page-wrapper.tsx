import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">{children}</div>;
}
