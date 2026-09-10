import "server-only";

import { mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const databasePath =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "sportcrz.db");

mkdirSync(path.dirname(databasePath), { recursive: true });

const globalDatabase = globalThis as typeof globalThis & {
  sportcrzDatabase?: DatabaseSync;
};

export const database =
  globalDatabase.sportcrzDatabase || new DatabaseSync(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalDatabase.sportcrzDatabase = database;
}

database.exec(`
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'customer')),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('mujeres', 'hombres', 'ninos', 'rebajas')),
    price REAL NOT NULL CHECK (price >= 0),
    old_price REAL CHECK (old_price IS NULL OR old_price >= 0),
    image TEXT NOT NULL DEFAULT '/img/portfolio-1.jpg',
    badge TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS products_category_idx ON products(category, active, sort_order);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT,
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    total REAL NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'pending' CHECK (payment_method IN ('pending', 'yappy', 'card', 'bank_transfer')),
    payment_reference TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status, created_at);

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );

  CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
`);

// Migra una sola vez las credenciales de la versión anterior basada en .env.
const legacyAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const legacyAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

if (legacyAdminEmail && legacyAdminPasswordHash) {
  database
    .prepare(`
      INSERT OR IGNORE INTO users (email, password_hash, role)
      VALUES (?, ?, 'admin')
    `)
    .run(legacyAdminEmail, legacyAdminPasswordHash);
}

/* Siembra inicial: inserta el catálogo estático la primera vez que
   la tabla products queda vacía, para que la tienda arranque con datos. */
const productCount = database
  .prepare("SELECT COUNT(*) AS count FROM products")
  .get() as { count: number };

if (productCount.count === 0) {
  const insert = database.prepare(`
    INSERT INTO products (name, category, price, old_price, image, badge, stock, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `);

  const seed: Array<{
    name: string;
    category: string;
    price: number;
    old_price: number | null;
    image: string;
    badge: string | null;
    sort_order: number;
  }> = [
    { name: "Urban Black", category: "hombres", price: 29.99, old_price: null, image: "/img/portfolio-1.jpg", badge: null, sort_order: 1 },
    { name: "Street White", category: "hombres", price: 34.99, old_price: null, image: "/img/portfolio-2.jpg", badge: null, sort_order: 2 },
    { name: "Performance", category: "hombres", price: 39.99, old_price: null, image: "/img/portfolio-3.jpg", badge: null, sort_order: 3 },
    { name: "Active Pink", category: "mujeres", price: 27.99, old_price: null, image: "/img/portfolio-4.jpg", badge: null, sort_order: 1 },
    { name: "Urban Fit", category: "mujeres", price: 31.99, old_price: null, image: "/img/portfolio-5.jpg", badge: null, sort_order: 2 },
    { name: "Sport Essential", category: "mujeres", price: 36.99, old_price: null, image: "/img/portfolio-6.jpg", badge: null, sort_order: 3 },
    { name: "Kids Sport", category: "ninos", price: 19.99, old_price: null, image: "/img/service-1.jpg", badge: null, sort_order: 1 },
    { name: "Junior Urban", category: "ninos", price: 22.99, old_price: null, image: "/img/service-2.jpg", badge: null, sort_order: 2 },
    { name: "Urban Sale", category: "rebajas", price: 19.99, old_price: 39.99, image: "/img/portfolio-1.jpg", badge: "-50%", sort_order: 1 },
    { name: "Performance Sale", category: "rebajas", price: 24.99, old_price: 44.99, image: "/img/portfolio-3.jpg", badge: "SALE", sort_order: 2 },
  ];

  for (const p of seed) {
    insert.run(p.name, p.category, p.price, p.old_price, p.image, p.badge, p.sort_order);
  }
}

export type DatabaseUser = {
  id: number;
  email: string;
  password_hash: string;
  role: "admin" | "customer";
  active: number;
};

export function findActiveAdminByEmail(email: string) {
  return database
    .prepare(`
      SELECT id, email, password_hash, role, active
      FROM users
      WHERE email = ? AND role = 'admin' AND active = 1
      LIMIT 1
    `)
    .get(email.trim().toLowerCase()) as DatabaseUser | undefined;
}

/* =====================================
   PRODUCTOS
===================================== */

export type Product = {
  id: number;
  name: string;
  category: "mujeres" | "hombres" | "ninos" | "rebajas";
  price: number;
  old_price: number | null;
  image: string;
  badge: string | null;
  stock: number;
  active: number;
  sort_order: number;
};

const PRODUCT_COLUMNS = `
  id, name, category, price, old_price, image, badge, stock, active, sort_order
`;

export function listProductsByCategory(category: string): Product[] {
  return database
    .prepare(`
      SELECT ${PRODUCT_COLUMNS}
      FROM products
      WHERE category = ? AND active = 1
      ORDER BY sort_order ASC, id ASC
    `)
    .all(category) as Product[];
}

export function listAllProducts(): Product[] {
  return database
    .prepare(`
      SELECT ${PRODUCT_COLUMNS}
      FROM products
      ORDER BY category ASC, sort_order ASC, id ASC
    `)
    .all() as Product[];
}

export function getProductById(id: number): Product | undefined {
  return database
    .prepare(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`)
    .get(id) as Product | undefined;
}

export function createProduct(data: {
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  badge: string | null;
  stock: number;
  sort_order: number;
}): number {
  const result = database
    .prepare(`
      INSERT INTO products (name, category, price, old_price, image, badge, stock, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      data.name,
      data.category,
      data.price,
      data.old_price,
      data.image,
      data.badge,
      data.stock,
      data.sort_order
    );

  return Number(result.lastInsertRowid);
}

export function updateProduct(
  id: number,
  data: {
    name: string;
    category: string;
    price: number;
    old_price: number | null;
    image: string;
    badge: string | null;
    stock: number;
    active: number;
    sort_order: number;
  }
) {
  database
    .prepare(`
      UPDATE products
      SET name = ?, category = ?, price = ?, old_price = ?, image = ?, badge = ?, stock = ?, active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(
      data.name,
      data.category,
      data.price,
      data.old_price,
      data.image,
      data.badge,
      data.stock,
      data.active,
      data.sort_order,
      id
    );
}

export function deleteProduct(id: number) {
  database.prepare("DELETE FROM products WHERE id = ?").run(id);
}

/* =====================================
   PEDIDOS (preparado para TiloPay/Yappy)
===================================== */

export type Order = {
  id: number;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  subtotal: number;
  total: number;
  status: string;
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export function listOrders(): Array<Order & { item_count: number }> {
  return database
    .prepare(`
      SELECT o.*, COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
    `)
    .all() as Array<Order & { item_count: number }>;
}

export function getOrderByCode(code: string): Order | undefined {
  return database
    .prepare("SELECT * FROM orders WHERE order_code = ?")
    .get(code) as Order | undefined;
}

export function generateOrderCode(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `SCZ-${timestamp}${random}`;
}

export type NewOrderItem = {
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export function createOrder(data: {
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  subtotal: number;
  total: number;
  notes: string | null;
  items: NewOrderItem[];
}): number {
  const insertOrder = database.prepare(`
    INSERT INTO orders (order_code, customer_name, customer_email, customer_phone, delivery_address, subtotal, total, status, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
  `);

  const insertItem = database.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `);

  let orderId: number;

  try {
    database.exec("BEGIN");

    const result = insertOrder.run(
      data.order_code,
      data.customer_name,
      data.customer_email,
      data.customer_phone,
      data.delivery_address,
      data.subtotal,
      data.total,
      data.notes
    );

    orderId = Number(result.lastInsertRowid);

    for (const item of data.items) {
      insertItem.run(
        orderId,
        item.product_id,
        item.product_name,
        item.unit_price,
        item.quantity
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return orderId;
}

export function markOrderPaid(
  orderCode: string,
  paymentMethod: string,
  paymentReference: string
) {
  let success = false;

  try {
    database.exec("BEGIN");

    const order = database
      .prepare("SELECT id, status FROM orders WHERE order_code = ?")
      .get(orderCode) as { id: number; status: string } | undefined;

    if (!order) {
      database.exec("ROLLBACK");
      return false;
    }

    if (order.status === "paid") {
      database.exec("ROLLBACK");
      return true;
    }

    const items = database
      .prepare(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL"
      )
      .all(order.id) as Array<{ product_id: number; quantity: number }>;

    const updateStock = database.prepare(
      "UPDATE products SET stock = MAX(stock - ?, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    );

    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    database
      .prepare(
        "UPDATE orders SET status = 'paid', payment_method = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(paymentMethod, paymentReference, order.id);

    database.exec("COMMIT");
    success = true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return success;
}

export function markOrderCancelled(orderCode: string) {
  database
    .prepare(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE order_code = ? AND status = 'pending'"
    )
    .run(orderCode);
}

export function getOrderWithItems(
  orderId: number
): { order: Order; items: OrderItem[] } | undefined {
  const order = database
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(orderId) as Order | undefined;

  if (!order) return undefined;

  const items = database
    .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC")
    .all(orderId) as OrderItem[];

  return { order, items };
}

export function updateOrderStatus(orderId: number, status: string) {
  database
    .prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    .run(status, orderId);
}

export function getDatabaseStatus() {
  const users = database
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get() as { count: number };

  const products = database
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get() as { count: number };

  const orders = database
    .prepare("SELECT COUNT(*) AS count FROM orders")
    .get() as { count: number };

  return {
    connected: true,
    engine: "SQLite",
    users: users.count,
    products: products.count,
    orders: orders.count,
  };
}
