'use client';

import React from 'react';
import { Package, Edit2, Trash2, MapPin } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';
import EmptyState from '@/components/ui/EmptyState';
import CategoryBadge from '@/components/CategoryBadge';
import type { VendorItem } from '@/lib/mockData';
import AppImage from '@/components/ui/AppImage';

interface ProductWallProps {
  items: VendorItem[];
  onToggleAvailability: (id: string) => void;
  onEdit: (item: VendorItem) => void;
  onDelete: (item: VendorItem) => void;
  onAddFirst: () => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80';

export default function ProductWall({
  items,
  onToggleAvailability,
  onEdit,
  onDelete,
  onAddFirst,
}: ProductWallProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Your Wall is empty"
        description="Add your first product to start selling on HapoUlipo. Customers nearby will be able to find and order from you."
        action={{ label: 'Add Your First Product', onClick: onAddFirst }}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            onToggle={() => onToggleAvailability(item.id)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductCardProps {
  item: VendorItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductCard({ item, onToggle, onEdit, onDelete }: ProductCardProps) {
  const firstImage = item.images[0] || PLACEHOLDER_IMAGE;

  return (
    <div
      className={`group card overflow-hidden transition-all duration-200 hover:card-shadow-md ${!item.is_available ? 'opacity-70' : ''}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <AppImage
          src={firstImage}
          alt={`Product photo of ${item.item_name}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={firstImage.startsWith('data:')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Unavailable overlay */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-gray-800/80 text-white text-xs font-bold uppercase tracking-wide">
              Unavailable
            </span>
          </div>
        )}
        {/* Image count badge */}
        {item.images.length > 1 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-semibold">
            +{item.images.length - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3
          className="font-bold text-card-foreground text-sm leading-snug line-clamp-2"
          title={item.item_name}
        >
          {item.item_name}
        </h3>

        {/* Price + Category */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-primary font-tabular">
            KES {item.price_kes.toLocaleString()}
          </span>
          <CategoryBadge category={item.category} />
        </div>

        {/* City */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={11} />
          <span>{item.city}</span>
        </div>

        {/* Availability toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-2">
            <Toggle checked={item.is_available} onChange={onToggle} size="sm" />
            <span
              className={`text-xs font-semibold ${item.is_available ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              {item.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-green-50 transition-all duration-150"
              title="Edit product"
              aria-label={`Edit ${item.item_name}`}
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all duration-150"
              title="Remove product"
              aria-label={`Remove ${item.item_name}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
