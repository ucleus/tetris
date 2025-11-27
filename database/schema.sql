CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('buyer','admin','seller') DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  condition_grade ENUM('NEW','USED_A','USED_B','USED_C','REFURB','FOR_PARTS') DEFAULT 'NEW',
  verified BOOLEAN DEFAULT FALSE,
  calibration_date DATE NULL,
  warranty VARCHAR(255),
  compliance VARCHAR(255),
  shipping VARCHAR(255),
  stock INT DEFAULT 0,
  weight_kg DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipping_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  contact_name VARCHAR(255),
  line1 VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  shipping_address_id INT NULL,
  status ENUM('PENDING','PAID','DISPUTED','REFUNDED') DEFAULT 'PENDING',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_total DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logistics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, description, price, category, condition_grade, verified, calibration_date, warranty, compliance, shipping, stock, weight_kg)
VALUES
('Clinical Audiometer Pro X1', 'Flagship two-channel audiometer with speech and pediatric modules.', 7499.00, 'Audiometer', 'NEW', TRUE, '2024-01-15', '24 months manufacturer warranty', 'FDA Class II | IEC 60645-1', 'Ships in 3 business days with white-glove setup', 6, 4.5),
('Tympanometer Versa 200', 'Mid-volume tympanometer refurbished and calibrated with new probes.', 2899.00, 'Tympanometer', 'REFURB', TRUE, '2024-03-02', '12 months clinic-grade warranty', 'CE | ISO 13485 workshop', 'Ships in 5 business days, foam crated', 3, 2.2),
('OAE Screener Pocket', 'Clinic-retired otoacoustic emissions screener with brand new tips.', 1299.00, 'OAE Screener', 'USED_A', TRUE, '2023-12-11', '6 months service warranty', 'FDA Class II | ISO 60645-6', 'Ships next day air with shock indicator', 5, 0.8);
