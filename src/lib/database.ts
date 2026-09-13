import "server-only";

import { createClient, type Client } from "@libsql/client";

/* Conexión unificada:
   - Local: file:./data/sportcrz.db (DATABASE_PATH)
   - Turso (Vercel): TURSO_DATABASE_URL + TURSO_AUTH_TOKEN */

function createDatabase(): Client {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!token) {
      throw new Error("TURSO_AUTH_TOKEN no está configurado.");
    }
    return createClient({
      url: tursoUrl,
      authToken: token,
    });
  }

  const localPath = process.env.DATABASE_PATH || "file:data/sportcrz.db";
  return createClient({ url: localPath.startsWith("file:") ? localPath : `file:${localPath}` });
}

const globalDatabase = globalThis as typeof globalThis & {
  sportcrzDatabase?: Client;
};

export const database =
  globalDatabase.sportcrzDatabase || createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalDatabase.sportcrzDatabase = database;
}

let schemaReady: Promise<void> | null = null;

const SCHEMA_SQL = `
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
    description TEXT,
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

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL,
    data BLOB NOT NULL,
    bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

/* Ejecuta el esquema una sola vez por proceso. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const statements = SCHEMA_SQL
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await database.execute(statement + ";");
      }

      /* Migra la tabla products si vino de una versión sin description. */
      try {
        await database.execute("ALTER TABLE products ADD COLUMN description TEXT");
      } catch {
        /* La columna ya existe. */
      }

      /* Migra credenciales de la versión anterior basada en .env. */
      const legacyAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const legacyAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

      if (legacyAdminEmail && legacyAdminPasswordHash) {
        await database.execute({
          sql: "INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, 'admin')",
          args: [legacyAdminEmail, legacyAdminPasswordHash],
        });
      }

      /* Siembra inicial del catálogo si la tabla está vacía. */
      const countResult = await database.execute("SELECT COUNT(*) AS count FROM products");
      const productCount = Number(countResult.rows[0]?.count ?? 0);

      if (productCount === 0) {
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
          await database.execute({
            sql: "INSERT INTO products (name, category, price, old_price, image, badge, stock, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
            args: [p.name, p.category, p.price, p.old_price, p.image, p.badge, p.sort_order],
          });
        }
      }
    })();
  }

  return schemaReady;
}

/* =====================================
   UPLOADS (fotos de productos)
===================================== */

export async function saveUpload(
  name: string,
  contentType: string,
  data: Uint8Array
): Promise<void> {
  await database.execute({
    sql: "INSERT INTO uploads (name, content_type, data, bytes) VALUES (?, ?, ?, ?)",
    args: [name, contentType, data, data.byteLength],
  });
}

export async function getUploadByName(name: string): Promise<
  { name: string; content_type: string; data: Uint8Array } | undefined
> {
  const result = await database.execute({
    sql: "SELECT name, content_type, data FROM uploads WHERE name = ?",
    args: [name],
  });

  const row = result.rows[0];

  if (!row) return undefined;

  return {
    name: String(row.name),
    content_type: String(row.content_type),
    data: row.data instanceof Uint8Array
      ? row.data
      : new Uint8Array((row.data as ArrayBuffer) ?? new ArrayBuffer(0)),
  };
}

export async function deleteUploadByName(name: string): Promise<void> {
  await database.execute({
    sql: "DELETE FROM uploads WHERE name = ?",
    args: [name],
  });
}

/* =====================================
   USUARIOS
===================================== */

export type DatabaseUser = {
  id: number;
  email: string;
  password_hash: string;
  role: "admin" | "customer";
  active: number;
};

export async function findActiveAdminByEmail(email: string) {
  const result = await database.execute({
    sql: `
      SELECT id, email, password_hash, role, active
      FROM users
      WHERE email = ? AND role = 'admin' AND active = 1
      LIMIT 1
    `,
    args: [email.trim().toLowerCase()],
  });

  const row = result.rows[0];

  if (!row) return undefined;

  return {
    id: Number(row.id),
    email: String(row.email),
    password_hash: String(row.password_hash),
    role: (row.role === "customer" ? "customer" : "admin") as "admin" | "customer",
    active: Number(row.active),
  } satisfies DatabaseUser;
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
  description: string | null;
};

const PRODUCT_COLUMNS = `
  id, name, category, price, old_price, image, badge, stock, active, sort_order, description
`;

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    name: String(row.name),
    category: row.category as Product["category"],
    price: Number(row.price),
    old_price: row.old_price === null || row.old_price === undefined ? null : Number(row.old_price),
    image: String(row.image),
    badge: row.badge === null || row.badge === undefined ? null : String(row.badge),
    stock: Number(row.stock),
    active: Number(row.active),
    sort_order: Number(row.sort_order),
    description:
      row.description === null || row.description === undefined
        ? null
        : String(row.description),
  };
}

export async function listProductsByCategory(category: string): Promise<Product[]> {
  await ensureSchema();
  const result = await database.execute({
    sql: `
      SELECT ${PRODUCT_COLUMNS}
      FROM products
      WHERE category = ? AND active = 1
      ORDER BY sort_order ASC, id ASC
    `,
    args: [category],
  });
  return result.rows.map((row) => rowToProduct(row as Record<string, unknown>));
}

export async function listAllProducts(): Promise<Product[]> {
  await ensureSchema();
  const result = await database.execute(`
    SELECT ${PRODUCT_COLUMNS}
    FROM products
    ORDER BY category ASC, sort_order ASC, id ASC
  `);
  return result.rows.map((row) => rowToProduct(row as Record<string, unknown>));
}

export async function getProductById(id: number): Promise<Product | undefined> {
  await ensureSchema();
  const result = await database.execute({
    sql: `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`,
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToProduct(row as Record<string, unknown>) : undefined;
}

export async function createProduct(data: {
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  badge: string | null;
  stock: number;
  sort_order: number;
  description: string | null;
}): Promise<number> {
  await ensureSchema();
  const result = await database.execute({
    sql: `
      INSERT INTO products (name, category, price, old_price, image, badge, stock, sort_order, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.name,
      data.category,
      data.price,
      data.old_price,
      data.image,
      data.badge,
      data.stock,
      data.sort_order,
      data.description,
    ],
  });

  return Number(result.lastInsertRowid);
}

export async function updateProduct(
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
    description: string | null;
  }
): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: `
      UPDATE products
      SET name = ?, category = ?, price = ?, old_price = ?, image = ?, badge = ?, stock = ?, active = ?, sort_order = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    args: [
      data.name,
      data.category,
      data.price,
      data.old_price,
      data.image,
      data.badge,
      data.stock,
      data.active,
      data.sort_order,
      data.description,
      id,
    ],
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: "DELETE FROM products WHERE id = ?",
    args: [id],
  });
}

/* =====================================
   PEDIDOS (TiloPay/Yappy)
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

export async function listOrders(): Promise<Array<Order & { item_count: number }>> {
  await ensureSchema();
  const result = await database.execute(`
    SELECT o.*, COUNT(oi.id) AS item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC, o.id DESC
  `);

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: Number(r.id),
      order_code: String(r.order_code),
      customer_name: String(r.customer_name),
      customer_email: String(r.customer_email),
      customer_phone: r.customer_phone == null ? null : String(r.customer_phone),
      delivery_address: r.delivery_address == null ? null : String(r.delivery_address),
      subtotal: Number(r.subtotal),
      total: Number(r.total),
      status: String(r.status),
      payment_method: String(r.payment_method),
      payment_reference: r.payment_reference == null ? null : String(r.payment_reference),
      notes: r.notes == null ? null : String(r.notes),
      created_at: String(r.created_at),
      item_count: Number(r.item_count),
    };
  });
}

export async function getOrderByCode(code: string): Promise<Order | undefined> {
  await ensureSchema();
  const result = await database.execute({
    sql: "SELECT * FROM orders WHERE order_code = ?",
    args: [code],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return undefined;

  return {
    id: Number(row.id),
    order_code: String(row.order_code),
    customer_name: String(row.customer_name),
    customer_email: String(row.customer_email),
    customer_phone: row.customer_phone == null ? null : String(row.customer_phone),
    delivery_address: row.delivery_address == null ? null : String(row.delivery_address),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    status: String(row.status),
    payment_method: String(row.payment_method),
    payment_reference: row.payment_reference == null ? null : String(row.payment_reference),
    notes: row.notes == null ? null : String(row.notes),
    created_at: String(row.created_at),
  };
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

export async function createOrder(data: {
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  subtotal: number;
  total: number;
  notes: string | null;
  items: NewOrderItem[];
}): Promise<number> {
  await ensureSchema();

  const insertOrder = `
    INSERT INTO orders (order_code, customer_name, customer_email, customer_phone, delivery_address, subtotal, total, status, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
  `;

  const insertItem = `
    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `;

  /* Transacción real de libsql (multi-statement atómica). */
  const tx = await database.transaction("write");

  try {
    const orderResult = await tx.execute({
      sql: insertOrder,
      args: [
        data.order_code,
        data.customer_name,
        data.customer_email,
        data.customer_phone,
        data.delivery_address,
        data.subtotal,
        data.total,
        data.notes,
      ],
    });

    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of data.items) {
      await tx.execute({
        sql: insertItem,
        args: [orderId, item.product_id, item.product_name, item.unit_price, item.quantity],
      });
    }

    await tx.commit();
    return orderId;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function markOrderPaid(
  orderCode: string,
  paymentMethod: string,
  paymentReference: string
): Promise<boolean> {
  await ensureSchema();

  const tx = await database.transaction("write");

  try {
    const result = await tx.execute({
      sql: "SELECT id, status FROM orders WHERE order_code = ?",
      args: [orderCode],
    });

    const row = result.rows[0] as Record<string, unknown> | undefined;

    const order =
      row == null
        ? undefined
        : { id: Number(row.id), status: String(row.status) };

    if (!order) {
      await tx.rollback();
      return false;
    }

    if (order.status === "paid") {
      await tx.rollback();
      return true;
    }

    const orderId = order.id;

    const itemsResult = await tx.execute({
      sql: "SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL",
      args: [orderId],
    });

    for (const row of itemsResult.rows) {
      const r = row as Record<string, unknown>;
      await tx.execute({
        sql: "UPDATE products SET stock = MAX(stock - ?, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [Number(r.quantity), Number(r.product_id)],
      });
    }

    await tx.execute({
      sql: "UPDATE orders SET status = 'paid', payment_method = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [paymentMethod, paymentReference, orderId],
    });

    await tx.commit();
    return true;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function markOrderCancelled(orderCode: string): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE order_code = ? AND status = 'pending'",
    args: [orderCode],
  });
}

export async function getOrderWithItems(
  orderId: number
): Promise<{ order: Order; items: OrderItem[] } | undefined> {
  await ensureSchema();

  const orderResult = await database.execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [orderId],
  });

  const orderRow = orderResult.rows[0] as Record<string, unknown> | undefined;

  if (!orderRow) return undefined;

  const itemsResult = await database.execute({
    sql: "SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC",
    args: [orderId],
  });

  const order: Order = {
    id: Number(orderRow.id),
    order_code: String(orderRow.order_code),
    customer_name: String(orderRow.customer_name),
    customer_email: String(orderRow.customer_email),
    customer_phone: orderRow.customer_phone == null ? null : String(orderRow.customer_phone),
    delivery_address: orderRow.delivery_address == null ? null : String(orderRow.delivery_address),
    subtotal: Number(orderRow.subtotal),
    total: Number(orderRow.total),
    status: String(orderRow.status),
    payment_method: String(orderRow.payment_method),
    payment_reference: orderRow.payment_reference == null ? null : String(orderRow.payment_reference),
    notes: orderRow.notes == null ? null : String(orderRow.notes),
    created_at: String(orderRow.created_at),
  };

  const items: OrderItem[] = itemsResult.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: Number(r.id),
      order_id: Number(r.order_id),
      product_id: r.product_id == null ? null : Number(r.product_id),
      product_name: String(r.product_name),
      unit_price: Number(r.unit_price),
      quantity: Number(r.quantity),
    };
  });

  return { order, items };
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [status, orderId],
  });
}

export async function getDatabaseStatus() {
  await ensureSchema();

  const usersResult = await database.execute("SELECT COUNT(*) AS count FROM users");
  const productsResult = await database.execute("SELECT COUNT(*) AS count FROM products");
  const ordersResult = await database.execute("SELECT COUNT(*) AS count FROM orders");

  const users = Number(usersResult.rows[0]?.count ?? 0);
  const products = Number(productsResult.rows[0]?.count ?? 0);
  const orders = Number(ordersResult.rows[0]?.count ?? 0);

  return {
    connected: true,
    engine: process.env.TURSO_DATABASE_URL ? "Turso (libSQL)" : "SQLite",
    users,
    products,
    orders,
  };
}
