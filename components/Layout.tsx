
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative overflow-hidden">
      {/* Spacer to replace status bar */}
      <div className="w-full h-6 shrink-0"></div>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* iOS Home Indicator */}
      <div className="w-full flex justify-center pb-3 pt-6 shrink-0">
        <div className="w-36 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
};

export default Layout;
