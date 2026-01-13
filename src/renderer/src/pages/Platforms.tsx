import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Platform } from '../../../shared/types';

export function Platforms(): JSX.Element {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const allPlatforms = await window.api.platforms.findAll();
      setPlatforms(allPlatforms);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Platforms</h1>
        <p className="text-muted-foreground mt-2">
          Manage your marketplace connections
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading platforms...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {platform.display_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {platform.automation_type}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    platform.is_enabled
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-gray-500/10 text-gray-500'
                  }`}
                >
                  {platform.is_enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
