import React from 'react';
import { useParams } from 'react-router-dom';

export function ItemDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground">Item Detail: {id}</h1>
      <p className="text-muted-foreground mt-2">Coming soon...</p>
    </div>
  );
}
