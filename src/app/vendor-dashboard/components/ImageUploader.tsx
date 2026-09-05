'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, ImageIcon, CheckCircle } from 'lucide-react';
import { processImages, formatFileSize } from '@/lib/imageUtils';
import type { ProcessedImage } from '@/lib/imageUtils';
import AppImage from '@/components/ui/AppImage';

interface ImageUploaderProps {
  value: string[];
  onChange: (dataUrls: string[]) => void;
  maxImages?: number;
}

interface UploadedImage {
  id: string;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  format: string;
}

export default function ImageUploader({ value, onChange, maxImages = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(() =>
    value.map((url, i) => ({
      id: `img-existing-${i}`,
      dataUrl: url,
      originalSize: 0,
      compressedSize: 0,
      format: 'webp',
    }))
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const remaining = maxImages - uploadedImages.length;
      const toProcess = files.slice(0, remaining);
      if (!toProcess.length) return;

      setProcessing(true);
      try {
        const results: ProcessedImage[] = await processImages(toProcess);
        const newImages: UploadedImage[] = results.map((r, i) => ({
          id: `img-${Date.now()}-${i}`,
          dataUrl: r.dataUrl,
          originalSize: r.originalSize,
          compressedSize: r.compressedSize,
          format: r.format,
        }));
        const all = [...uploadedImages, ...newImages];
        setUploadedImages(all);
        onChange(all.map((img) => img.dataUrl));
      } catch {
        // silent — images won't upload
      } finally {
        setProcessing(false);
      }
    },
    [uploadedImages, maxImages, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    processFiles(files);
  };

  const removeImage = (id: string) => {
    const updated = uploadedImages.filter((img) => img.id !== id);
    setUploadedImages(updated);
    onChange(updated.map((img) => img.dataUrl));
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {uploadedImages.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
            dragOver
              ? 'border-primary bg-accent/30'
              : 'border-border hover:border-primary hover:bg-green-50'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Upload product images"
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-2">
            {processing ? (
              <>
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
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
                <p className="text-sm font-medium text-primary">Converting & optimizing...</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Upload size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    Drop photos here or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP up to 10MB each · Max {maxImages} photos
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
        <CheckCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Photos are automatically converted to WebP and optimized for fast loading. Images are
          resized to max 1200px.
        </p>
      </div>

      {/* Image previews */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {uploadedImages.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-xl overflow-hidden border border-border aspect-square"
            >
              <AppImage
                src={img.dataUrl}
                alt="Product photo preview"
                fill
                className="object-cover"
                unoptimized
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  className="p-1.5 rounded-full bg-white/90 text-red-500 hover:bg-white transition-colors"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Size info */}
              {img.compressedSize > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="text-xs text-white font-medium text-center">
                    {formatFileSize(img.compressedSize)}
                  </p>
                </div>
              )}
              {/* Format badge */}
              <div className="absolute top-1.5 left-1.5">
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-500 text-white uppercase">
                  {img.format}
                </span>
              </div>
            </div>
          ))}
          {/* Add more slot */}
          {uploadedImages.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-green-50 transition-all duration-150 text-muted-foreground hover:text-primary"
              aria-label="Add more images"
            >
              <ImageIcon size={20} />
              <span className="text-xs font-medium">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
