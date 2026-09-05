'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  MapPin,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Store,
  ShoppingCart,
} from 'lucide-react';
import CategoryBadge from '@/components/CategoryBadge';
import AppImage from '@/components/ui/AppImage';
import { useToast } from '@/components/ui/Toast';
import type { VendorItem } from '@/lib/mockData';
import { addToCart } from '@/lib/cartStore';

interface ItemWithDistance extends VendorItem {
  distance?: number;
}

interface ProductDetailModalProps {
  item: ItemWithDistance;
  onClose: () => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80';

export default function ProductDetailModal({ item, onClose }: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const { showToast } = useToast();
  const images = item.images.length > 0 ? item.images : [PLACEHOLDER_IMAGE];

  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);

  const whatsappMessage = encodeURIComponent(
    `Hello! I found your product "${item.item_name}" on HapoUlipo and I'd like to order. Price: KES ${item.price_kes.toLocaleString()}`
  );
  const whatsappUrl = item.vendor_whatsapp
    ? `https://wa.me/${item.vendor_whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  const handleBuyNow = () => {
    addToCart(item, 1);
    showToast(`${item.item_name} added to your cart`, 'success');
    onClose();
    router.push(`/checkout?item_id=${item.id}&qty=1`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl card-shadow-lg animate-slide-up max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 text-card-foreground hover:bg-white shadow-sm transition-all duration-150"
          aria-label="Close product details"
        >
          <X size={18} />
        </button>

        {/* Image carousel */}
        <div className="relative h-64 sm:h-72 bg-muted shrink-0 overflow-hidden">
          <AppImage
            src={images[currentImageIndex]}
            alt={`${item.item_name} — photo ${currentImageIndex + 1} of ${images.length}`}
            fill
            className="object-cover"
            unoptimized={images[currentImageIndex].startsWith('data:')}
            priority
            sizes="(max-width: 640px) 100vw, 512px"
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-card-foreground shadow-sm transition-all duration-150"
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-card-foreground shadow-sm transition-all duration-150"
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={`dot-${idx + 1}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`rounded-full transition-all duration-150 ${
                      idx === currentImageIndex ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/60'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Distance badge */}
          {item.distance !== undefined && (
            <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
              <MapPin size={11} />
              {item.distance < 1
                ? `${Math.round(item.distance * 1000)}m away`
                : `${item.distance} km away`}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Title + price */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2
                id="product-detail-title"
                className="text-xl font-bold text-card-foreground leading-snug flex-1"
              >
                {item.item_name}
              </h2>
              <CategoryBadge category={item.category} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-primary font-tabular">
                KES {item.price_kes.toLocaleString()}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {item.is_available ? 'Available now' : 'Currently unavailable'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-card-foreground mb-1.5">About this product</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>

          {/* Vendor info */}
          <div className="rounded-xl bg-muted p-4 space-y-2.5">
            <h3 className="text-sm font-bold text-card-foreground">Vendor info</h3>
            <div className="flex items-center gap-2 text-sm text-card-foreground">
              <Store size={15} className="text-primary shrink-0" />
              <span className="font-semibold">{item.vendor_name ?? 'Local Vendor'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={15} className="text-muted-foreground shrink-0" />
              <span>{item.city}</span>
              {item.distance !== undefined && (
                <span className="text-primary font-semibold">
                  ·{' '}
                  {item.distance < 1
                    ? `${Math.round(item.distance * 1000)}m away`
                    : `${item.distance} km away`}
                </span>
              )}
            </div>
            {item.vendor_whatsapp && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={15} className="text-muted-foreground shrink-0" />
                <span className="font-mono">{item.vendor_whatsapp}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA footer */}
        <div className="px-5 py-4 border-t border-border bg-white shrink-0 space-y-2">
          {/* Buy Now — online payment */}
          <button
            onClick={handleBuyNow}
            disabled={!item.is_available}
            className={`btn-primary w-full py-3.5 text-base justify-center ${!item.is_available ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ShoppingCart size={20} />
            {item.is_available ? 'Buy Now — Pay Online' : 'Currently Unavailable'}
          </button>

          {/* WhatsApp fallback */}
          {whatsappUrl && item.is_available && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <MessageCircle size={16} />
              Or contact via WhatsApp
            </a>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Secure payment via Flutterwave · M-Pesa or bank
          </p>
        </div>
      </div>
    </div>
  );
}
