import { useState } from 'react';
import { sampleProducts } from '../data/sampleProducts';

export default function Admin() {
  const [products, setProducts] = useState(sampleProducts);
  const [form, setForm] = useState({ name: '', price: '', category: '', condition: 'NEW', stock: 1 });
  const [events, setEvents] = useState([{ date: '2024-07-01', title: 'Clinic delivery - Audiometer', location: 'Dallas Logistics Hub' }]);

  const submitProduct = (e) => {
    e.preventDefault();
    const next = { ...form, id: products.length + 1, price: Number(form.price), images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'] };
    setProducts([next, ...products]);
    setForm({ name: '', price: '', category: '', condition: 'NEW', stock: 1 });
  };

  const addEvent = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    setEvents([{ date: data.get('date'), title: data.get('title'), location: data.get('location') }, ...events]);
    e.target.reset();
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <p className="text-sm text-gray-500">Use the forms below to seed inventory, view orders, and manage logistics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submitProduct} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-semibold">Add Product</h2>
          <input className="w-full rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input type="number" className="rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
          </div>
          <select className="w-full rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="NEW">NEW</option>
            <option value="USED_A">USED_A</option>
            <option value="USED_B">USED_B</option>
            <option value="USED_C">USED_C</option>
            <option value="REFURB">REFURB</option>
            <option value="FOR_PARTS">FOR_PARTS</option>
          </select>
          <button className="btn-primary w-full" type="submit">Save Product</button>
        </form>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-semibold">Recent Orders (sample)</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <span>Order #12014</span>
              <span className="badge bg-emerald-100 text-emerald-800">Paid</span>
              <span className="text-gray-500">Audiometer + OAE kit</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <span>Order #12013</span>
              <span className="badge bg-yellow-100 text-yellow-800">Pending</span>
              <span className="text-gray-500">Tympanometer refurb</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Order #12012</span>
              <span className="badge bg-red-100 text-red-800">Dispute</span>
              <span className="text-gray-500">Probe tips</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-semibold">Inventory Snapshot</h2>
          <ul className="space-y-2 text-sm">
            {products.map(p => (
              <li key={p.id} className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-800">
                <span>{p.name}</span>
                <span className="text-gray-500">{p.condition} • {p.stock} units</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Logistics Calendar</h2>
            <span className="badge bg-primary text-white">Ops</span>
          </div>
          <form onSubmit={addEvent} className="grid grid-cols-1 gap-2 text-sm">
            <input name="title" className="rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Event title" required />
            <input name="location" className="rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Location" required />
            <input type="date" name="date" className="rounded border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" required />
            <button className="btn-secondary" type="submit">Add Event</button>
          </form>
          <ul className="space-y-2 text-sm">
            {events.map((event, idx) => (
              <li key={idx} className="flex items-center justify-between rounded border border-gray-100 p-2 dark:border-gray-800">
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-gray-500">{event.location}</p>
                </div>
                <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{event.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
