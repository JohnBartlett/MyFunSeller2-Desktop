import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

interface Stats {
  totalItems: number;
  activeListings: number;
  soldItems: number;
  totalRevenue: number;
}

export function Dashboard(): JSX.Element {
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    activeListings: 0,
    soldItems: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total items
      const itemsCount = await window.api.items.count();

      // Get active listings
      const activeListings = await window.api.listings.findByStatus('active');

      // Get sold listings
      const soldListings = await window.api.listings.findByStatus('sold');

      // Calculate total revenue from sold items
      const revenue = soldListings.reduce((sum: number, listing: any) => sum + (listing.price || 0), 0);

      setStats({
        totalItems: itemsCount,
        activeListings: activeListings.length,
        soldItems: soldListings.length,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Package,
      label: 'Total Items',
      value: stats.totalItems,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: ShoppingCart,
      label: 'Active Listings',
      value: stats.activeListings,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Sold Items',
      value: stats.soldItems,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your overview.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading stats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#/items?action=new"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Package className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Add New Item</p>
              <p className="text-sm text-muted-foreground">
                Create a new item for resale
              </p>
            </div>
          </a>
          <a
            href="#/platforms"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Manage Platforms</p>
              <p className="text-sm text-muted-foreground">
                Connect to marketplaces
              </p>
            </div>
          </a>
          <a
            href="#/templates"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Use Template</p>
              <p className="text-sm text-muted-foreground">
                Quick create from template
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* Getting Started */}
      {stats.totalItems === 0 && !loading && (
        <div className="mt-8 bg-card border border-border rounded-lg p-8 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Get Started
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't added any items yet. Create your first item to start
            listing on multiple platforms.
          </p>
          <a
            href="#/items?action=new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Package className="w-5 h-5" />
            <span>Create Your First Item</span>
          </a>
        </div>
      )}
    </div>
  );
}
