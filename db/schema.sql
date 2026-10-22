CREATE TABLE IF NOT EXISTS product_categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id               SERIAL PRIMARY KEY,
    inventory_number VARCHAR(50)    NOT NULL UNIQUE,
    category_id      INT            NOT NULL REFERENCES product_categories(id),
    name             VARCHAR(200)   NOT NULL,
    date_received    DATE           NOT NULL,
    shelf_life_days  INT,
    expiry_date      DATE,
    manufacturer_id  INT            NOT NULL REFERENCES manufacturers(id),
    price            NUMERIC(12,2)  NOT NULL CHECK (price >= 0),
    quantity         INT            NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    image_url        TEXT,
    description      TEXT,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    full_name     VARCHAR(200) NOT NULL,
    phone         VARCHAR(30),
    address       TEXT,
    role          VARCHAR(20)  NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id           SERIAL PRIMARY KEY,
    user_id      INT           NOT NULL REFERENCES users(id),
    status       VARCHAR(30)   NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
    total_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
    address      TEXT          NOT NULL,
    phone        VARCHAR(30)   NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id           SERIAL PRIMARY KEY,
    order_id     INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id INT           NOT NULL REFERENCES inventory(id),
    quantity     INT           NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(12,2) NOT NULL,
    subtotal     NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX IF NOT EXISTS idx_inventory_category     ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_manufacturer ON inventory(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user            ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order      ON order_items(order_id);

INSERT INTO product_categories (name) VALUES
    ('Электроника'),('Еда и напитки'),('Одежда'),('Инструменты'),('Фармацевтика'),('Мебель')
ON CONFLICT DO NOTHING;

INSERT INTO manufacturers (name) VALUES
    ('ООО Молоко'),('Жестко Corporation'),('Colombia Pictures'),('Stariy bog Incorporated')
ON CONFLICT DO NOTHING;

INSERT INTO inventory (inventory_number, category_id, name, date_received, manufacturer_id, price, quantity, description) VALUES
    ('INV-001', 1, 'Беспроводные наушники Про', NOW(), 3, 89.99,  25, 'Беспроводные науншники премимум класса с прорывным механизмом шумодава'),
    ('INV-002', 1, 'Usb-hub 6 в 1',        NOW(), 2, 34.99,  60, 'Мультипортовый адаптер: HDMI, USB 3.0 x3, SD, MicroSD'),
    ('INV-003', 1, 'Механическая клавиатура',  NOW(), 3, 129.99, 15, 'Механическая клавиатура премиум качества со свитчами Pajerik Pro Prime Ultra Extreme'),
    ('INV-004', 4, 'Отвертки премиум',NOW(), 2, 24.99,  40, 'Набор отверток премуим качества'),
    ('INV-005', 3, 'Тряпка на грудак',       NOW(), 4, 59.99,  30, 'Легкая тряпка на грудак'),
    ('INV-006', 2, 'Премуим кофе',NOW(), 1, 14.99, 100, 'Российский кофе премиум качества, вдохновленный российскими традициями кофепития (кофе 3в1)')
ON CONFLICT DO NOTHING;
