import { XMarkIcon, ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { conditionPalette } from '../data/sampleProducts';

export default function QuickViewModal({ product, onClose, onAdd }) {
  const badge = conditionPalette[product.condition] || 'bg-gray-100 text-gray-800';
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-3xl w-full overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Quick view</p>
            <h3 className="text-lg font-semibold">{product.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <img src={product.images?.[0]} alt={product.name} className="h-64 w-full rounded-xl object-cover" />
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${badge}`}>{product.condition}</span>
              {product.verified && <span className="badge bg-primary text-white flex items-center gap-1"><ShieldCheckIcon className="h-4 w-4" />Audical Verified</span>}
              <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">Compliance: {product.compliance}</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-3xl font-bold text-primary">${product.price.toLocaleString()}</p>
            <p className="text-gray-700 leading-relaxed dark:text-gray-200">{product.description}</p>
            <div className="rounded-lg border border-gray-200 p-4 text-sm space-y-2 dark:border-gray-700">
              <p><strong>Calibration:</strong> {product.calibrationDate || 'Scheduled in intake lab'}</p>
              <p><strong>Warranty:</strong> {product.warranty || 'Contact supply chain manager'}</p>
              <p><strong>Shipping:</strong> {product.shipping}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-primary" onClick={onAdd}>Add to Cart</button>
              <Link to={`/products/${product.id}`} className="btn-secondary" onClick={onClose}>
                View Details <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
