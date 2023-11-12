import { captureException, showReportDialog } from '@sentry/react';
import React, { useState } from 'react';

export default function App() {
  const [hasError, setHasError] = useState(false);

  const handleClick = () => {
    setHasError(true);
    const eventId = captureException(
      `This is testing Sentry's Report Dialog onClose callback`,
    );
    showReportDialog({ eventId, onClose: () => setHasError(false) });
  };

  return (
    <div
      className={`flex h-screen w-screen flex-col items-center justify-center text-black ${
        hasError ? 'bg-red-400' : 'bg-green-400'
      }`}
    >
      <div className="mx-auto my-8 mt-10 w-[480px] rounded border border-gray-200 bg-white p-4 shadow-md">
        <h1 className="mb-4 text-center text-4xl">
          Sentry Report Dialog onClose demo
        </h1>
        <p className="mb-8 mt-4 px-4">
          The background will turn{' '}
          <span className="font-bold text-red-400">red</span> when the report
          dialog is open and{' '}
          <span className="font-bold text-green-400">green</span> after closing
          it.
        </p>
        <button className="Button mx-auto" onClick={handleClick}>
          <span>Capture Exception</span>
        </button>
      </div>
    </div>
  );
}
