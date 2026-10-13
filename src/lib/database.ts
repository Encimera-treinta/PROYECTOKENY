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
    /* stock NULL = sin control de inventario (se vende siempre).
       stock 0 = agotado explicitamente. */
    stock INTEGER CHECK (stock IS NULL OR stock >= 0),
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

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);

  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('card', 'yappy')),
    label TEXT NOT NULL,
    card_last4 TEXT,
    card_brand TEXT,
    card_holder TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    yappy_phone TEXT,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS payment_methods_customer_idx ON payment_methods(customer_id);

  /*
    Carritos compartidos: el cliente arma su carrito y se genera un link
    corto (/pedido/CODE) que puede mandar por WhatsApp a quien quiera
    (por ejemplo su madre). Quien abre el link solo ve la lista y la
    confirma. No necesita cuenta ni pagar por la pagina.

    OJO: este bloque se parte por punto y coma, asi que ni el
    comentario ni el SQL pueden contener uno.
  */
  CREATE TABLE IF NOT EXISTS shared_carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    sender_name TEXT,
    sender_phone TEXT,
    recipient_name TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'ordered')),
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    total REAL NOT NULL CHECK (total >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS shared_carts_status_idx ON shared_carts(status, created_at);

  CREATE TABLE IF NOT EXISTS shared_cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL REFERENCES shared_carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    image TEXT,
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );

  CREATE INDEX IF NOT EXISTS shared_cart_items_cart_idx ON shared_cart_items(cart_id);

  /*
    Links de acceso directo al panel (magic link).
    Solo se guarda el SHA-256 del token, jamas el token en claro.
    OJO: ni el comentario ni el SQL pueden contener punto y coma.
  */
  CREATE TABLE IF NOT EXISTS admin_login_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    label TEXT,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    last_used_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS admin_login_links_user_idx ON admin_login_links(user_id);
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
          sql: `
            INSERT INTO users (email, password_hash, role, active)
            VALUES (?, ?, 'admin', 1)
            ON CONFLICT(email) DO UPDATE SET
              password_hash = excluded.password_hash,
              role = 'admin',
              active = 1
          `,
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
            sql: "INSERT INTO products (name, category, price, old_price, image, badge, stock, sort_order) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)",
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
  /* NULL = sin control de inventario. 0 = agotado. */
  stock: number | null;
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
    stock:
      row.stock === null || row.stock === undefined
        ? null
        : Number(row.stock),
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
  stock: number | null;
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
    stock: number | null;
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

/* Vista publica de una orden por su codigo (para el link que
   se manda por WhatsApp). Solo necesita el codigo, que es
   aleatorio y unico. */
export async function getPublicOrderByCode(code: string): Promise<{
  order: Order;
  items: Array<
    OrderItem & { image: string | null }
  >;
} | undefined> {
  await ensureSchema();

  const result = await database.execute({
    sql: "SELECT id FROM orders WHERE order_code = ? LIMIT 1",
    args: [code.trim().toUpperCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return undefined;

  const full = await getOrderWithItems(Number(row.id));

  if (!full) return undefined;

  /* La imagen viene del producto por si el pedido guarda
     el nombre pero el producto luego cambia o se borra. */
  const withImages = await Promise.all(
    full.items.map(async (item) => {
      if (!item.product_id) {
        return { ...item, image: null };
      }

      const product = await getProductById(
        item.product_id
      );

      return {
        ...item,
        image: product?.image ?? null,
      };
    })
  );

  return {
    order: full.order,
    items: withImages,
  };
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

/* =====================================
   CLIENTES (cuentas de usuario tienda)
===================================== */

export type Customer = {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
};

export async function findCustomerByEmail(
  email: string
): Promise<{ id: number; email: string; password_hash: string } | undefined> {
  await ensureSchema();
  const result = await database.execute({
    sql: "SELECT id, email, password_hash FROM customers WHERE email = ? LIMIT 1",
    args: [email.trim().toLowerCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return undefined;

  return {
    id: Number(row.id),
    email: String(row.email),
    password_hash: String(row.password_hash),
  };
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  await ensureSchema();
  const result = await database.execute({
    sql: "SELECT id, email, full_name, phone FROM customers WHERE id = ? LIMIT 1",
    args: [id],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return undefined;

  return {
    id: Number(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    phone: row.phone == null ? null : String(row.phone),
  };
}

export async function createCustomer(data: {
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
}): Promise<number> {
  await ensureSchema();
  const result = await database.execute({
    sql: "INSERT INTO customers (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)",
    args: [
      data.email.trim().toLowerCase(),
      data.password_hash,
      data.full_name.trim(),
      data.phone,
    ],
  });

  return Number(result.lastInsertRowid);
}

export async function updateCustomerProfile(
  id: number,
  data: { full_name: string; phone: string | null }
): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: "UPDATE customers SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [data.full_name.trim(), data.phone, id],
  });
}

export async function updateCustomerPassword(
  id: number,
  passwordHash: string
): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: "UPDATE customers SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [passwordHash, id],
  });
}

/* =====================================
   MÉTODOS DE PAGO DEL CLIENTE
   Tarjetas: solo se guardan últimos 4,
   marca, titular y vencimiento (sin el
   número completo por seguridad).
   Yappy: teléfono vinculado.
===================================== */

export type PaymentMethod = {
  id: number;
  method: "card" | "yappy";
  label: string;
  card_last4: string | null;
  card_brand: string | null;
  card_holder: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  yappy_phone: string | null;
  is_default: number;
};

export async function listPaymentMethods(
  customerId: number
): Promise<PaymentMethod[]> {
  await ensureSchema();
  const result = await database.execute({
    sql: `
      SELECT id, method, label, card_last4, card_brand, card_holder,
             card_exp_month, card_exp_year, yappy_phone, is_default
      FROM payment_methods
      WHERE customer_id = ?
      ORDER BY is_default DESC, id DESC
    `,
    args: [customerId],
  });

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: Number(r.id),
      method: (r.method === "yappy" ? "yappy" : "card") as "card" | "yappy",
      label: String(r.label),
      card_last4: r.card_last4 == null ? null : String(r.card_last4),
      card_brand: r.card_brand == null ? null : String(r.card_brand),
      card_holder: r.card_holder == null ? null : String(r.card_holder),
      card_exp_month:
        r.card_exp_month == null ? null : Number(r.card_exp_month),
      card_exp_year: r.card_exp_year == null ? null : Number(r.card_exp_year),
      yappy_phone: r.yappy_phone == null ? null : String(r.yappy_phone),
      is_default: Number(r.is_default),
    };
  });
}

export async function addPaymentMethod(data: {
  customer_id: number;
  method: "card" | "yappy";
  label: string;
  card_last4?: string | null;
  card_brand?: string | null;
  card_holder?: string | null;
  card_exp_month?: number | null;
  card_exp_year?: number | null;
  yappy_phone?: string | null;
}): Promise<number> {
  await ensureSchema();

  /* Si es el primer método del cliente, se marca como predeterminado. */
  const existing = await database.execute({
    sql: "SELECT COUNT(*) AS count FROM payment_methods WHERE customer_id = ?",
    args: [data.customer_id],
  });
  const isFirst = Number(existing.rows[0]?.count ?? 0) === 0;

  const result = await database.execute({
    sql: `
      INSERT INTO payment_methods
        (customer_id, method, label, card_last4, card_brand, card_holder,
         card_exp_month, card_exp_year, yappy_phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.customer_id,
      data.method,
      data.label,
      data.card_last4 ?? null,
      data.card_brand ?? null,
      data.card_holder ?? null,
      data.card_exp_month ?? null,
      data.card_exp_year ?? null,
      data.yappy_phone ?? null,
      isFirst ? 1 : 0,
    ],
  });

  return Number(result.lastInsertRowid);
}

export async function setDefaultPaymentMethod(
  customerId: number,
  methodId: number
): Promise<void> {
  await ensureSchema();

  const tx = await database.transaction("write");
  try {
    await tx.execute({
      sql: "UPDATE payment_methods SET is_default = 0 WHERE customer_id = ?",
      args: [customerId],
    });
    await tx.execute({
      sql: "UPDATE payment_methods SET is_default = 1 WHERE id = ? AND customer_id = ?",
      args: [methodId, customerId],
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function deletePaymentMethod(
  customerId: number,
  methodId: number
): Promise<void> {
  await ensureSchema();
  await database.execute({
    sql: "DELETE FROM payment_methods WHERE id = ? AND customer_id = ?",
    args: [methodId, customerId],
  });
}

/* =====================================
   PEDIDOS DEL CLIENTE
===================================== */

export async function listOrdersByCustomerEmail(
  email: string
): Promise<Array<Order & { item_count: number }>> {
  await ensureSchema();
  const result = await database.execute({
    sql: `
      SELECT o.*, COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_email = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
    `,
    args: [email.trim().toLowerCase()],
  });

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: Number(r.id),
      order_code: String(r.order_code),
      customer_name: String(r.customer_name),
      customer_email: String(r.customer_email),
      customer_phone: r.customer_phone == null ? null : String(r.customer_phone),
      delivery_address:
        r.delivery_address == null ? null : String(r.delivery_address),
      subtotal: Number(r.subtotal),
      total: Number(r.total),
      status: String(r.status),
      payment_method: String(r.payment_method),
      payment_reference:
        r.payment_reference == null ? null : String(r.payment_reference),
      notes: r.notes == null ? null : String(r.notes),
      created_at: String(r.created_at),
      item_count: Number(r.item_count),
    };
  });
}

/* ==========================================
   CARRITOS COMPARTIDOS
   ========================================== */

export type SharedCartItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  image: string | null;
  unit_price: number;
  quantity: number;
};

export type SharedCart = {
  id: number;
  code: string;
  sender_name: string | null;
  sender_phone: string | null;
  recipient_name: string | null;
  note: string | null;
  status: "pending" | "confirmed" | "declined" | "ordered";
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
  items: SharedCartItem[];
};

/* Sin letras ni numeros que se confundan al leerlos en voz alta
   (0/O, 1/I/L, 5/S, 8/B, 2/Z). */
const CODE_ALPHABET = "34679ACDEFGHJKMNPQRTUVWXY";

export function generateSharedCartCode(): string {
  let code = "";

  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }

  return `SCZ-${code}`;
}

export async function createSharedCart(data: {
  sender_name?: string | null;
  sender_phone?: string | null;
  recipient_name?: string | null;
  note?: string | null;
  items: Array<{
    product_id: number | null;
    product_name: string;
    image?: string | null;
    unit_price: number;
    quantity: number;
  }>;
}): Promise<SharedCart> {
  await ensureSchema();

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  /* Reintenta por si el codigo aleatorio ya existe (colision). */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateSharedCartCode();

    const existing = await database.execute({
      sql: "SELECT 1 AS found FROM shared_carts WHERE code = ? LIMIT 1",
      args: [code],
    });

    if (existing.rows.length > 0) continue;

    let result;

    try {
      result = await database.execute({
        sql: `
          INSERT INTO shared_carts
            (code, sender_name, sender_phone, recipient_name, note, subtotal, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          code,
          data.sender_name?.trim() || null,
          data.sender_phone?.trim() || null,
          data.recipient_name?.trim() || null,
          data.note?.trim() || null,
          subtotal,
          subtotal,
        ],
      });
    } catch {
      continue;
    }

    const cartId = Number(result.lastInsertRowid);

    for (const item of data.items) {
      await database.execute({
        sql: `
          INSERT INTO shared_cart_items
            (cart_id, product_id, product_name, image, unit_price, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          cartId,
          item.product_id,
          item.product_name,
          item.image ?? null,
          item.unit_price,
          item.quantity,
        ],
      });
    }

    const created = await getSharedCartByCode(code);

    if (created) return created;

    throw new Error("No se pudo leer el carrito recien creado.");
  }

  throw new Error("No se pudo generar un codigo de pedido unico.");
}

export async function getSharedCartByCode(
  code: string
): Promise<SharedCart | undefined> {
  await ensureSchema();

  const result = await database.execute({
    sql: "SELECT * FROM shared_carts WHERE code = ? LIMIT 1",
    args: [code.trim().toUpperCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return undefined;

  const cartId = Number(row.id);

  const itemsResult = await database.execute({
    sql: `
      SELECT id, product_id, product_name, image, unit_price, quantity
      FROM shared_cart_items
      WHERE cart_id = ?
      ORDER BY id ASC
    `,
    args: [cartId],
  });

  return {
    id: cartId,
    code: String(row.code),
    sender_name: row.sender_name == null ? null : String(row.sender_name),
    sender_phone: row.sender_phone == null ? null : String(row.sender_phone),
    recipient_name:
      row.recipient_name == null ? null : String(row.recipient_name),
    note: row.note == null ? null : String(row.note),
    status: String(row.status) as SharedCart["status"],
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    items: itemsResult.rows.map((itemRow) => {
      const r = itemRow as Record<string, unknown>;
      return {
        id: Number(r.id),
        product_id: r.product_id == null ? null : Number(r.product_id),
        product_name: String(r.product_name),
        image: r.image == null ? null : String(r.image),
        unit_price: Number(r.unit_price),
        quantity: Number(r.quantity),
      };
    }),
  };
}

export async function updateSharedCartStatus(
  code: string,
  status: SharedCart["status"]
): Promise<SharedCart | undefined> {
  await ensureSchema();

  await database.execute({
    sql: `
      UPDATE shared_carts
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE code = ?
    `,
    args: [status, code.trim().toUpperCase()],
  });

  return getSharedCartByCode(code);
}

export async function listSharedCarts(
  limit = 50
): Promise<Array<SharedCart & { item_count: number; unit_count: number }>> {
  await ensureSchema();

  const result = await database.execute({
    sql: `
      SELECT c.*,
        COUNT(i.id) AS item_count,
        COALESCE(SUM(i.quantity), 0) AS unit_count
      FROM shared_carts c
      LEFT JOIN shared_cart_items i ON i.cart_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ?
    `,
    args: [limit],
  });

  const carts: Array<
    SharedCart & { item_count: number; unit_count: number }
  > = [];

  for (const row of result.rows) {
    const r = row as Record<string, unknown>;

    const full = await getSharedCartByCode(String(r.code));

    if (!full) continue;

    carts.push({
      ...full,
      item_count: Number(r.item_count),
      unit_count: Number(r.unit_count),
    });
  }

  return carts;
}

/* ==========================================
   MAGIC LINKS (acceso directo al panel)
   ========================================== */

import {
  createHash,
  randomBytes,
} from "crypto";

import { getAdminSession } from "@/lib/admin-auth";

/* SHA-256 del token. El token en claro nunca se guarda. */
export function hashLoginToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export type AdminLoginLink = {
  id: number;
  user_id: number;
  label: string | null;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export function generateLoginToken(): string {
  /* 32 bytes = 256 bits de entropia. */
  return randomBytes(32).toString("base64url");
}

export type NewLoginLink = {
  token: string;
  link: AdminLoginLink;
};

/**
 * Crea un link de acceso y devuelve el token en claro.
 * El token solo existe en esta respuesta: despues solo queda su hash.
 */
export async function createAdminLoginLink(data: {
  userId: number;
  label?: string | null;
  expiresInDays: number;
}): Promise<NewLoginLink> {
  await ensureSchema();

  const days = Math.min(
    Math.max(1, Math.floor(data.expiresInDays)),
    90
  );

  const token = generateLoginToken();
  const tokenHash = hashLoginToken(token);

  const expiresAt = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toISOString();

  const result = await database.execute({
    sql: `
      INSERT INTO admin_login_links (user_id, token_hash, label, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    args: [
      data.userId,
      tokenHash,
      data.label?.trim() || null,
      expiresAt,
    ],
  });

  const linkId = Number(result.lastInsertRowid);

  return {
    token,
    link: {
      id: linkId,
      user_id: data.userId,
      label: data.label?.trim() || null,
      expires_at: expiresAt,
      revoked_at: null,
      last_used_at: null,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Valida un token y devuelve el admin asociado.
 * NULL si no existe, esta revocado o expiro.
 */
export async function consumeAdminLoginToken(token: string): Promise<{
  userId: number;
  email: string;
} | null> {
  await ensureSchema();

  if (!token || token.length < 20 || token.length > 200) {
    return null;
  }

  const tokenHash = hashLoginToken(token);

  const result = await database.execute({
    sql: "SELECT * FROM admin_login_links WHERE token_hash = ? LIMIT 1",
    args: [tokenHash],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return null;

  if (row.revoked_at != null) return null;

  const expiresAt = Date.parse(String(row.expires_at));

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  const userResult = await database.execute({
    sql: "SELECT id, email, active FROM users WHERE id = ? LIMIT 1",
    args: [Number(row.user_id)],
  });

  const user = userResult.rows[0] as Record<string, unknown> | undefined;

  if (!user || Number(user.active) !== 1) return null;

  await database.execute({
    sql: `
      UPDATE admin_login_links
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    args: [Number(row.id)],
  });

  return {
    userId: Number(user.id),
    email: String(user.email),
  };
}

/** Invalida un link puntual. */
export async function revokeAdminLoginLink(id: number): Promise<void> {
  await ensureSchema();

  await database.execute({
    sql: `
      UPDATE admin_login_links
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ? AND revoked_at IS NULL
    `,
    args: [id],
  });
}

/** Invalida todos los links de un admin. */
export async function revokeAllAdminLoginLinks(
  userId: number
): Promise<void> {
  await ensureSchema();

  await database.execute({
    sql: `
      UPDATE admin_login_links
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND revoked_at IS NULL
    `,
    args: [userId],
  });
}

export type LinkState =
  | "activo"
  | "usado"
  | "vencido"
  | "revocado";

export async function listAdminLoginLinks(
  userId: number
): Promise<Array<AdminLoginLink & { state: LinkState }>> {
  await ensureSchema();

  const result = await database.execute({
    sql: `
      SELECT * FROM admin_login_links
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 50
    `,
    args: [userId],
  });

  const now = Date.now();

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;

    const expiresAt = Date.parse(String(r.expires_at));

    let state: LinkState;

    if (r.revoked_at != null) {
      state = "revocado";
    } else if (Number.isFinite(expiresAt) && expiresAt < now) {
      state = "vencido";
    } else if (r.last_used_at != null) {
      state = "usado";
    } else {
      state = "activo";
    }

    return {
      id: Number(r.id),
      user_id: Number(r.user_id),
      label: r.label == null ? null : String(r.label),
      expires_at: String(r.expires_at),
      revoked_at: r.revoked_at == null ? null : String(r.revoked_at),
      last_used_at: r.last_used_at == null ? null : String(r.last_used_at),
      created_at: String(r.created_at),
      state,
    };
  });
}

/* ------------------------------------------------------------
   Guard de la pagina de accesos: solo un admin con sesion
   activa puede crear o revocar links.
   ------------------------------------------------------------ */

export async function requireAdminForLinks() {
  const session = await getAdminSession();

  if (!session) return null;

  const result = await database.execute({
    sql: "SELECT id, email FROM users WHERE email = ? AND active = 1 LIMIT 1",
    args: [session.email.trim().toLowerCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) return null;

  return { id: Number(row.id), email: String(row.email) };
}
