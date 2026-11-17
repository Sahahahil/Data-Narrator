import * as React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children, width = '100%', height = '100%', className = ''
}) => (
  <div className={`relative w-full h-full ${className}`} style={{ width, height }}>
    {children}
  </div>
);