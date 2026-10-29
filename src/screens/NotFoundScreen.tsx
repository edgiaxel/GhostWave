import React from 'react';
import { useApp } from '../context/AppContext';

export const NotFoundScreen: React.FC = () => {
  const { setRoute } = useApp();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-4xl">ghost</span>
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h1 className="font-headline font-semibold text-xl text-on-surface">Unknown Deck Route</h1>
        <p className="text-xs text-on-surface-variant">
          The requested deck compartment could not be located in the current workspace. Return to your local library to continue.
        </p>
      </div>
      <button
        onClick={() => setRoute('library')}
        className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md"
      >
        Return to Library
      </button>
    </div>
  );
};
