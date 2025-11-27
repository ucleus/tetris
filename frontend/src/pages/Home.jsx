import ProductCard from '../components/ProductCard';
import { sampleProducts } from '../data/sampleProducts';
import { useCart } from '../context/CartContext';

export default function Home() {
  const { addToCart } = useCart();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Audical Verified Supply</p>
          <h1 className="text-3xl font-bold">Audiology equipment, ready for patient care</h1>
          <p className="text-gray-600 dark:text-gray-300">Calibrated and compliance-documented devices sourced for clinics, ENT centers, and hospital audiology suites.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge bg-primary text-white">Calibration-included</span>
          <span className="badge bg-emerald-100 text-emerald-800">HIPAA-safe checkout</span>
          <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">Stripe secure payments</span>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleProducts.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </div>
    </main>
  );
}
