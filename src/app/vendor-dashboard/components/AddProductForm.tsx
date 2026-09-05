'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import ImageUploader from './ImageUploader';
import { addItemAsync } from '@/lib/vendorItemsStore';
import { CATEGORIES } from '@/lib/mockData';
import type { VendorItem } from '@/lib/mockData';

interface AddProductFormProps {
  onSuccess: (item: VendorItem) => Promise<void> | void;
  vendorId: string;
  vendorCity: string;
  vendorLat: number;
  vendorLng: number;
}

interface FormData {
  item_name: string;
  description: string;
  price_kes: number;
  category: string;
  images: string[];
}

export default function AddProductForm({
  onSuccess,
  vendorId,
  vendorCity,
  vendorLat,
  vendorLng,
}: AddProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      item_name: '',
      description: '',
      price_kes: undefined,
      category: '',
      images: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const newItem: VendorItem = {
      id: `item-${Date.now()}`,
      vendor_id: vendorId,
      item_name: data.item_name,
      description: data.description,
      price_kes: Number(data.price_kes),
      category: data.category as VendorItem['category'],
      images: data.images,
      is_available: true,
      city: vendorCity,
      location_lat: vendorLat,
      location_lng: vendorLng,
      created_at: new Date().toISOString(),
    };

    await addItemAsync(newItem);
    await onSuccess(newItem);
    reset();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Product name */}
      <div>
        <label htmlFor="item_name" className="label-text">
          Product name
        </label>
        <p className="helper-text">
          Be specific — e.g. "Sukuma Wiki per bundle" not just "vegetables"
        </p>
        <input
          id="item_name"
          type="text"
          placeholder="e.g. Fresh Pilipili Hoho per kg"
          className={`input-field mt-1.5 ${errors.item_name ? 'input-error' : ''}`}
          {...register('item_name', {
            required: 'Product name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' },
          })}
        />
        {errors.item_name && <p className="error-text">{errors.item_name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label-text">
          Description
        </label>
        <p className="helper-text">
          Describe the product, quantity, freshness, and any important details
        </p>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Freshly harvested from Limuru farms. Sold per kilogram. Available daily 7am–7pm."
          className={`input-field mt-1.5 resize-none ${errors.description ? 'input-error' : ''}`}
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 10, message: 'Please add more detail' },
          })}
        />
        {errors.description && <p className="error-text">{errors.description.message}</p>}
      </div>

      {/* Price + Category row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price_kes" className="label-text">
            Price (KES)
          </label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              KES
            </span>
            <input
              id="price_kes"
              type="number"
              min="1"
              placeholder="0"
              className={`input-field pl-12 font-tabular ${errors.price_kes ? 'input-error' : ''}`}
              {...register('price_kes', {
                required: 'Price is required',
                min: { value: 1, message: 'Price must be at least KES 1' },
                valueAsNumber: true,
              })}
            />
          </div>
          {errors.price_kes && <p className="error-text">{errors.price_kes.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="label-text">
            Category
          </label>
          <select
            id="category"
            className={`input-field mt-1.5 ${errors.category ? 'input-error' : ''}`}
            {...register('category', { required: 'Select a category' })}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={`cat-${cat}`} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="error-text">{errors.category.message}</p>}
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="label-text">Product photos</label>
        <p className="helper-text mb-2">
          Tip: Upload clear product photos. Images will be automatically resized and compressed for
          faster loading.
        </p>
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} maxImages={5} />
          )}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 py-3"
          style={{ minHeight: '48px' }}
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
              Adding to Wall...
            </span>
          ) : (
            'Add to My Wall'
          )}
        </button>
      </div>
    </form>
  );
}
