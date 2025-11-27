import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { itemsWithData, subtotal, estimatedShipping, total, updateQty, removeFromCart } = useCart();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <h1 className="text-3xl font-bold">Cart</h1>
      {itemsWithData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300">No items yet. Browse the marketplace to add devices.</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">Back to marketplace</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            {itemsWithData.map(item => (
              <div key={item.productId} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <img src={item.product.images?.[0]} alt={item.product.name} className="h-24 w-24 rounded-lg object-cover" />
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">{item.product.condition} • {item.product.category}</p>
                  <p className="text-sm text-gray-500">{item.product.warranty}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <label>Qty:</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(item.productId, Number(e.target.value))} className="w-16 rounded border border-gray-300 p-1 dark:border-gray-600 dark:bg-gray-800" />
                    <button className="text-red-500" onClick={() => removeFromCart(item.productId)}>Remove</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">${item.lineTotal.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">${item.product.price.toLocaleString()} each</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated shipping</span>
              <span>${estimatedShipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="btn-primary w-full">Proceed to Checkout (Stripe)</button>
            <p className="text-xs text-gray-500">Stripe secure checkout handles PHI-safe billing; we never store card details.</p>
          </div>
        </div>
      )}
    </main>
  );
}
