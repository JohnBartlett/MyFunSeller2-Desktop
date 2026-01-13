import React from 'react';

function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          MyFunSeller2
        </h1>
        <p className="text-lg text-muted-foreground">
          Multi-Platform Resale Posting Application
        </p>
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            Initializing application...
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
