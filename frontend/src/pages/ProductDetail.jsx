import { useParams } from 'react-router-dom';
import { sampleProducts, conditionPalette } from '../data/sampleProducts';
import { useCart } from '../context/CartContext';
import { ShieldCheckIcon, TruckIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export default function ProductDetail() {
  const { id } = useParams();
  const product = sampleProducts.find(p => p.id === Number(id));
  const { addToCart } = useCart();

  if (!product) return <div className="max-w-6xl mx-auto p-6">Product not found</div>;
  const badge = conditionPalette[product.condition] || 'bg-gray-100 text-gray-800';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <img src={product.images?.[0]} alt={product.name} className="h-80 w-full rounded-2xl object-cover shadow" />
          <div className="grid grid-cols-4 gap-3">
            {product.images?.map((img, idx) => (
              <img key={idx} src={img} alt={`${product.name}-${idx}`} className="h-20 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`badge ${badge}`}>{product.condition}</span>
            {product.verified && <span className="badge bg-primary text-white flex items-center gap-1"><ShieldCheckIcon className="h-4 w-4"/> Audical Verified</span>}
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">{product.description}</p>
          <p className="text-4xl font-extrabold text-primary">${product.price.toLocaleString()}</p>
          <div className="rounded-xl border border-gray-200 p-4 space-y-2 text-sm dark:border-gray-700">
            <p><strong>Compliance:</strong> {product.compliance}</p>
            <p><strong>Calibration:</strong> {product.calibrationDate || 'Scheduled in calibration lab'}</p>
            <p><strong>Warranty:</strong> {product.warranty || 'Warranty available on request'}</p>
            <p><strong>Shipping:</strong> {product.shipping}</p>
            <p><strong>Stock:</strong> {product.stock} units</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={() => addToCart(product.id)}>Add to Cart</button>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <TruckIcon className="h-5 w-5" /> Freight-safe packaging
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <WrenchScrewdriverIcon className="h-5 w-5" /> Install support
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
