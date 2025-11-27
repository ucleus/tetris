import { Link, NavLink } from 'react-router-dom';
import { ShoppingCartIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

export default function NavBar() {
  const { cartItems } = useCart();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('audical-theme');
    const isDark = stored === 'dark';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('audical-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <header className="bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center font-black">AS</div>
          <div>
            <p className="font-bold text-lg">Audical Services</p>
            <p className="text-xs text-gray-500">Verified audiology marketplace</p>
          </div>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}>Marketplace</NavLink>
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}>Admin</NavLink>
          <NavLink to="/cart" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}>
            <div className="relative inline-flex items-center gap-1">
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Cart</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-primary text-white rounded-full text-xs px-2 py-0.5">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>
          </NavLink>
          <button onClick={toggleTheme} className="rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
