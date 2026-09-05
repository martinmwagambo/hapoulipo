'use client';

import React from 'react';
import { ShoppingBag, MapPin } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { ProductCardSkeleton } from '@/components/ui/LoadingSkeleton';
import CategoryBadge from '@/components/CategoryBadge';
import type { VendorItem } from '@/lib/mockData';
import AppImage from '@/components/ui/AppImage';

interface ItemWithDistance extends VendorItem {
  distance?: number;
}

interface ProductGridProps {
  items: ItemWithDistance[];
  onSelect: (item: ItemWithDistance) => void;
  isLoading: boolean;
  emptyMessage?: string;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80';

export default function ProductGrid({
  items,
  onSelect,
  isLoading,
  emptyMessage,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={`skel-${i + 1}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No products found"
        description={emptyMessage ?? 'No products available yet. Check back soon!'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <ClientProductCard key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}

interface ClientProductCardProps {
  item: ItemWithDistance;
  onSelect: (item: ItemWithDistance) => void;
}

function ClientProductCard({ item, onSelect }: ClientProductCardProps) {
  const firstImage = item.images[0] || PLACEHOLDER_IMAGE;

  return (
    <button
      onClick={() => onSelect(item)}
      className="group card overflow-hidden text-left transition-all duration-200 hover:card-shadow-md hover:-translate-y-0.5 active:scale-[0.98] w-full"
      aria-label={`View ${item.item_name} — KES ${item.price_kes}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <AppImage
          src={firstImage}
          alt={`${item.item_name} product photo`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={firstImage.startsWith('data:')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
        />
        {/* Distance badge */}
        {item.distance !== undefined && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
            <MapPin size={10} />
            {item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance} km`}
          </div>
        )}
        {/* Multiple images indicator */}
        {item.images.length > 1 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-semibold">
            1/{item.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-card-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.item_name}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-primary font-tabular">
            KES {item.price_kes.toLocaleString()}
          </span>
          <CategoryBadge category={item.category} />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1">
            <MapPin size={11} />
            <span className="truncate max-w-[100px]">{item.vendor_name ?? item.city}</span>
          </div>
          <span className="text-primary font-semibold">View details →</span>
        </div>
      </div>
    </button>
  );
}
