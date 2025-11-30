

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 mt-auto select-none animate-fade-in">
      <div className="flex items-center justify-center gap-3 text-sm text-gray-400 dark:text-gray-500">
        <span className="font-bold tracking-tight">© Video Analyze</span>
        <span className="h-3 w-px bg-gray-300 dark:bg-gray-700"></span>
        <span className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium">
          Created by Harry-AI大航海
        </span>
      </div>
    </footer>
  );
};

export default Footer;
