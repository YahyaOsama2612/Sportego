import React from 'react';

const Navbar = ({ brandName = 'Sportego' }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {brandName}
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#overview" className="hover:text-primary transition-colors">Overview</a>
          <a href="#hooks" className="hover:text-primary transition-colors">Hooks</a>
          <a href="#components" className="hover:text-primary transition-colors">Components</a>
          <span className="px-3 py-1 bg-primary-100 text-primary rounded-full text-xs font-semibold">
            Primary Purple
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

