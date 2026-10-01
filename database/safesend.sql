-- SafeSend / Rivoshoppa MySQL database
-- Import this file in XAMPP phpMyAdmin or with:
-- mysql -u root -p < database/safesend.sql

DROP DATABASE IF EXISTS safesend;
CREATE DATABASE safesend
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE safesend;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS shop_products;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS customers;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE customers (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  location VARCHAR(160) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_customers_created_at (created_at),
  INDEX idx_customers_email (email),
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id VARCHAR(32) PRIMARY KEY,
  customer_id VARCHAR(32) NULL,
  name VARCHAR(160) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  pickup VARCHAR(255) NOT NULL,
  dropoff VARCHAR(255) NOT NULL,
  details TEXT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method ENUM('mtn_mobile_money', 'airtel_money', 'card', 'cash_on_delivery') NOT NULL,
  payment_status VARCHAR(40) NOT NULL,
  payment_reference VARCHAR(100) NOT NULL,
  status ENUM('requested', 'picked_up', 'in_transit', 'delivered') NOT NULL DEFAULT 'requested',
  source VARCHAR(40) NOT NULL DEFAULT 'cart',
  submitted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_contact (contact)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  customer_id VARCHAR(32) NULL,
  provider VARCHAR(32) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
  phone VARCHAR(40) NULL,
  internal_reference VARCHAR(100) NOT NULL,
  provider_reference VARCHAR(100) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  provider_response JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NULL,
  confirmed_at DATETIME(3) NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_payments_order_id (order_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_internal_reference (internal_reference)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  item_id VARCHAR(120) NULL,
  item_type VARCHAR(160) NULL,
  label VARCHAR(160) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  item_source VARCHAR(40) NULL,
  market_id VARCHAR(120) NULL,
  market_category VARCHAR(120) NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order_id (order_id)
) ENGINE=InnoDB;

CREATE TABLE order_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  status ENUM('requested', 'picked_up', 'in_transit', 'delivered') NOT NULL,
  changed_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_history_order_id (order_id),
  INDEX idx_order_history_changed_at (changed_at)
) ENGINE=InnoDB;

CREATE TABLE shops (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(160) NOT NULL,
  description TEXT NULL,
  image TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NULL,
  INDEX idx_shops_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE shop_products (
  id VARCHAR(120) PRIMARY KEY,
  shop_id VARCHAR(100) NOT NULL,
  name VARCHAR(160) NOT NULL,
  price_label VARCHAR(80) NOT NULL,
  price_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT NULL,
  image TEXT NULL,
  CONSTRAINT fk_shop_products_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_shop_products_shop_id (shop_id)
) ENGINE=InnoDB;

-- Current customer data from data/customers.json
INSERT INTO customers (id, name, email, phone, location, notes, created_at) VALUES
('SS-7505', 'Aline Uwase', 'aline@example.com', '+250788000000', 'Kigali', 'Business account', '2026-09-24 18:09:39.176'),
('SS-2194', 'Aline Uwase', 'aline@example.com', '+250788000000', 'Kigali', 'Business account', '2026-09-25 04:18:33.011'),
('SS-8535', 'Aline Uwase', 'aline@example.com', '+250788000000', 'Kigali', 'Business account', '2026-09-25 04:39:17.497');

-- Current order data from data/orders.json
INSERT INTO orders (id, name, contact, pickup, dropoff, details, total, payment_method, payment_status, payment_reference, status, source, submitted_at, created_at) VALUES
('SS-1921', 'Nguweneza David', '0791322129', 'kicukiro', 'masaka', '12 minutes', 52200, 'mtn_mobile_money', 'awaiting_payment', 'PAY-1790274206588-885', 'requested', 'cart', '2026-09-24 18:23:26.505', '2026-09-24 18:23:26.588'),
('SS-8539', 'Maniraguha Regis', '0795019120', 'kicukiro', 'masaka', '12 minutes', 8100, 'mtn_mobile_money', 'awaiting_payment', 'PAY-1790275337825-672', 'requested', 'cart', '2026-09-24 18:42:17.751', '2026-09-24 18:42:17.826');

INSERT INTO order_items (order_id, item_id, item_type, label, price, quantity, item_source, market_id, market_category) VALUES
('SS-1921', 'market-daily-moisturizer', 'Daily Moisturizer', 'Daily Moisturizer', 9500, 1, 'marketplace', 'daily-moisturizer', 'Cosmetics'),
('SS-1921', 'market-lip-care-set', 'Lip Care Set', 'Lip Care Set', 6800, 1, 'marketplace', 'lip-care-set', 'Cosmetics'),
('SS-1921', 'market-body-mist', 'Fresh Body Mist', 'Fresh Body Mist', 11500, 1, 'marketplace', 'body-mist', 'Cosmetics'),
('SS-1921', 'market-makeup-brush-set', 'Makeup Brush Set', 'Makeup Brush Set', 14000, 1, 'marketplace', 'makeup-brush-set', 'Cosmetics'),
('SS-1921', 'market-rice-5kg', 'Rice 5kg', 'Rice 5kg', 7500, 1, 'marketplace', 'rice-5kg', 'Groceries'),
('SS-1921', 'market-milk-pack', 'Milk Pack', 'Milk Pack', 2900, 1, 'marketplace', 'milk-pack', 'Groceries'),
('SS-8539', 'market-milk-pack', 'Milk Pack', 'Milk Pack', 2900, 1, 'marketplace', 'milk-pack', 'Groceries'),
('SS-8539', 'market-veggie-bundle', 'Veggie Bundle', 'Veggie Bundle', 5200, 1, 'marketplace', 'veggie-bundle', 'Groceries');

INSERT INTO order_status_history (order_id, status, changed_at) VALUES
('SS-1921', 'requested', '2026-09-24 18:23:26.588'),
('SS-8539', 'requested', '2026-09-24 18:42:17.826');

-- Default marketplace shops currently defined by server.js
INSERT INTO shops (id, name, category, location, description, image) VALUES
('fresh-basket', 'Fresh Basket', 'Groceries', 'Kigali', 'Fresh produce and daily essentials.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'),
('circuit-hub', 'Circuit Hub', 'Electronics', 'Remera', 'Phones, accessories, and smart devices.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'),
('urban-thread', 'Urban Thread', 'Fashion', 'Nyamirambo', 'Affordable style for daily wear.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80');

INSERT INTO shop_products (id, shop_id, name, price_label, price_value, description, image) VALUES
('rice-5kg', 'fresh-basket', 'Rice 5kg', '7,500 RWF', 7500, 'Clean and easy-cook rice.', 'https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80'),
('fruit-box', 'fresh-basket', 'Fruit Box', '4,800 RWF', 4800, 'Assorted seasonal fruits.', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80'),
('milk-pack', 'fresh-basket', 'Milk Pack', '2,900 RWF', 2900, 'Family-size dairy pack.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80'),
('veggie-bundle', 'fresh-basket', 'Veggie Bundle', '5,200 RWF', 5200, 'Fresh vegetables mix.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'),
('wireless-headphones', 'circuit-hub', 'Wireless Headphones', '42,000 RWF', 42000, 'Travel and work audio.', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80'),
('smart-watch', 'circuit-hub', 'Smart Watch', '35,500 RWF', 35500, 'Health tracking and calls.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'),
('phone-stand', 'circuit-hub', 'Phone Stand', '8,200 RWF', 8200, 'Desk-friendly setup support.', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'),
('usb-cable', 'circuit-hub', 'USB-C Cable', '3,700 RWF', 3700, 'Fast charging cable.', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'),
('classic-tee', 'urban-thread', 'Classic Tee', '6,000 RWF', 6000, 'Comfortable cotton tee.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
('denim-jacket', 'urban-thread', 'Denim Jacket', '22,000 RWF', 22000, 'Casual jacket for daily wear.', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'),
('fashion-sneakers', 'urban-thread', 'Fashion Sneakers', '18,500 RWF', 18500, 'Lightweight everyday sneakers.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'),
('crossbody-bag', 'urban-thread', 'Crossbody Bag', '12,900 RWF', 12900, 'Compact everyday carry.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80');

CREATE OR REPLACE VIEW order_totals AS
SELECT o.id, o.name, o.status, o.payment_status, o.total, COUNT(oi.id) AS item_count, o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.name, o.status, o.payment_status, o.total, o.created_at;

SELECT 'Database ready' AS message;
SELECT 'customers' AS table_name, COUNT(*) AS row_count FROM customers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'order_status_history', COUNT(*) FROM order_status_history
UNION ALL SELECT 'shops', COUNT(*) FROM shops
UNION ALL SELECT 'shop_products', COUNT(*) FROM shop_products;
