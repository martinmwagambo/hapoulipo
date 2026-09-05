import React from 'react';
import Badge from './ui/Badge';

const CATEGORY_VARIANTS: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'gray'> = {
  Food: 'green',
  Pharmacy: 'red',
  Groceries: 'amber',
  Electronics: 'blue',
  Clothing: 'amber',
  Other: 'gray',
};

interface CategoryBadgeProps {
  category: string;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const variant = CATEGORY_VARIANTS[category] ?? 'gray';
  return <Badge variant={variant}>{category}</Badge>;
}
