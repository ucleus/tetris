# Audical Services — B2B Audiology Marketplace

Audical Services is a light-mode-first B2B marketplace for verified audiology equipment. Doctors, clinics, ENT centers, and hospitals can browse calibrated devices, view compliance data, and complete secure Stripe checkout. The stack pairs a React + Tailwind storefront with a lightweight PHP API that runs well on shared Hostinger plans.

## Frontend Setup Commands
1. Install dependencies
   `npm install`

2. Build the React app for production
   `npm run build`

3. Optional local preview of prod build
   `npx serve build`

## Database Setup Commands
4. Login to MySQL (local or remote)
   `mysql -u DB_USER -p`

5. Create database manually if needed
   `CREATE DATABASE audicalservices;`

6. Load the schema
   `mysql -u DB_USER -p audicalservices < database/schema.sql`

## Backend Testing & Deployment (shared hosting aware)
7. PHP built-in local API test (if running locally)
   `php -S localhost:8000 -t public`

8. Hostinger deployment note:
   Place the contents of `backend/public` inside `public_html` on Hostinger. Keep API routes lightweight and stateless; environment variables should be configured via the hosting panel and loaded into `.env`.

## Stripe CLI Test Helpers
9. If developing locally, login to Stripe
   `stripe login`

10. Forward webhook events locally
    `stripe listen --forward-to localhost:8000/api/webhooks/stripe.php`

11. Trigger webhook tests manually
    `stripe trigger payment_intent.succeeded`

## Project Structure
- `frontend/` — React + Tailwind storefront with product catalog, quick-view modal, product detail page, cart, and admin UI.
- `backend/` — PHP API (PDO MySQL, cart/order/shipping/inventory logic, Stripe webhook handler).
- `database/schema.sql` — Normalized schema with seed products and logistics calendar table.

## Environment
Copy `.env.example` to `.env` in `/backend` and set MySQL + Stripe credentials. Do not commit secrets.
