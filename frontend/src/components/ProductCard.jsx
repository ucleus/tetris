import { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import QuickViewModal from './QuickViewModal';
import { conditionPalette } from '../data/sampleProducts';

export default function ProductCard({ product, onAddToCart }) {
  const [open, setOpen] = useState(false);
  const badge = conditionPalette[product.condition] || 'bg-gray-100 text-gray-800';

  return (
    <div className="group rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="relative cursor-pointer" onClick={() => setOpen(true)}>
        <img src={product.images?.[0]} alt={product.name} className="h-48 w-full rounded-t-xl object-cover" />
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <span className={`badge ${badge}`}>{product.condition}</span>
          {product.verified && (
            <span className="badge bg-primary text-white flex items-center gap-1">
              <ShieldCheckIcon className="h-4 w-4" /> Audical Verified
            </span>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p>
            <h3 className="text-lg font-semibold">{product.name}</h3>
          </div>
          <p className="text-xl font-bold text-primary">${product.price.toLocaleString()}</p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-300">{product.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{product.calibrationDate ? `Calibrated ${product.calibrationDate}` : 'Calibration pending'}</span>
          <span>{product.warranty || 'Warranty on request'}</span>
        </div>
        <div className="flex items-center justify-between">
          <button className="btn-primary" onClick={() => onAddToCart(product.id)}>Add to Cart</button>
          <button className="btn-secondary" onClick={() => setOpen(true)}>Quick View</button>
        </div>
      </div>
      {open && (
        <QuickViewModal product={product} onClose={() => setOpen(false)} onAdd={() => onAddToCart(product.id)} />
      )}
    </div>
  );
}
