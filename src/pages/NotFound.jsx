import React from 'react';
import Button from '../components/shared/Button';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mt-4">Page Not Found</h2>
      <p className="text-gray-500 mt-2 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Button onClick={() => (window.location.href = '/')}>Back to Home</Button>
      </div>
    </div>
  );
};

export default NotFound;

