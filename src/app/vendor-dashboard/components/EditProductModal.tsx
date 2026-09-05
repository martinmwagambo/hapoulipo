'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import ImageUploader from './ImageUploader';
import Toggle from '@/components/ui/Toggle';
import { updateItemAsync } from '@/lib/vendorItemsStore';
import { CATEGORIES } from '@/lib/mockData';
import type { VendorItem } from '@/lib/mockData';

interface EditProductModalProps {
  item: VendorItem;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  item_name: string;
  description: string;
  price_kes: number;
  category: string;
  images: string[];
  is_available: boolean;
}

export default function EditProductModal({ item, onClose, onSaved }: EditProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      item_name: item.item_name,
      description: item.description,
      price_kes: item.price_kes,
      category: item.category,
      images: item.images,
      is_available: item.is_available,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    await updateItemAsync(item.id, {
      item_name: data.item_name,
      description: data.description,
      price_kes: Number(data.price_kes),
      category: data.category as VendorItem['category'],
      images: data.images,
      is_available: data.is_available,
    });
    setIsLoading(false);
    onSaved();
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Product" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Product name */}
        <div>
          <label htmlFor="edit-item_name" className="label-text">
            Product name
          </label>
          <input
            id="edit-item_name"
            type="text"
            className={`input-field ${errors.item_name ? 'input-error' : ''}`}
            {...register('item_name', { required: 'Product name is required' })}
          />
          {errors.item_name && <p className="error-text">{errors.item_name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="edit-description" className="label-text">
            Description
          </label>
          <textarea
            id="edit-description"
            rows={3}
            className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <p className="error-text">{errors.description.message}</p>}
        </div>

        {/* Price + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-price_kes" className="label-text">
              Price (KES)
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                KES
              </span>
              <input
                id="edit-price_kes"
                type="number"
                min="1"
                className={`input-field pl-12 font-tabular ${errors.price_kes ? 'input-error' : ''}`}
                {...register('price_kes', {
                  required: 'Price is required',
                  min: { value: 1, message: 'Must be at least KES 1' },
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.price_kes && <p className="error-text">{errors.price_kes.message}</p>}
          </div>

          <div>
            <label htmlFor="edit-category" className="label-text">
              Category
            </label>
            <select
              id="edit-category"
              className={`input-field mt-1.5 ${errors.category ? 'input-error' : ''}`}
              {...register('category', { required: 'Select a category' })}
            >
              {CATEGORIES.map((cat) => (
                <option key={`edit-cat-${cat}`} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="error-text">{errors.category.message}</p>}
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
          <div>
            <p className="text-sm font-semibold text-card-foreground">Product availability</p>
            <p className="text-xs text-muted-foreground">
              Toggle off to hide from customers temporarily
            </p>
          </div>
          <Controller
            name="is_available"
            control={control}
            render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} />}
          />
        </div>

        {/* Images */}
        <div>
          <label className="label-text">Product photos</label>
          <p className="helper-text mb-2">
            Replace or add photos. New uploads will be automatically optimized to WebP.
          </p>
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUploader value={field.value} onChange={field.onChange} maxImages={5} />
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1"
            style={{ minHeight: '44px' }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving changes...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
