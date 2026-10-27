const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const templatesDir = path.join(__dirname, '../', 'active_dbs', 'templates');

if (!fs.existsSync(templatesDir)) {
   fs.mkdirSync(templatesDir, { recursive: true });
}

console.log("🛠 Начинаю генерацию шаблонов баз данных для лабок...");

// ==========================================
// Лаба 1: sqli_auth_bypass
// ==========================================
const dbAuth = new sqlite3.Database(path.join(templatesDir, 'sqli-auth-bypass.sqlite'));
dbAuth.serialize(() => {
   dbAuth.run(`
      CREATE TABLE sqli_auth_bypass (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         username VARCHAR(50),
         password VARCHAR(50)
      )
   `);
   // Вставляем только обычного юзера. Админа с флагом добавит контроллер.
   dbAuth.run(`INSERT INTO sqli_auth_bypass (username, password) VALUES ('user', 'qwerty')`);
   console.log("✅ Шаблон 'sqli-auth-bypass' создан.");
});
dbAuth.close();

// ==========================================
// Лаба 2: sqli_blind
// ==========================================
const dbBlind = new sqlite3.Database(path.join(templatesDir, 'sqli-blind.sqlite'));
dbBlind.serialize(() => {
   dbBlind.run(`
      CREATE TABLE sqli_blind (
         id INTEGER PRIMARY KEY,
         name VARCHAR(50),
         secret_key VARCHAR(100)
      )
   `);
   // Вставляем только публичную инфу. Флаг (id=2) добавит контроллер.
   dbBlind.run(`INSERT INTO sqli_blind (id, name, secret_key) VALUES (1, 'Laptop', 'public_info')`);
   console.log("✅ Шаблон 'sqli-blind' создан.");
});
dbBlind.close();

// ==========================================
// Лаба 3: sqli-union
// ==========================================
const dbUnion = new sqlite3.Database(path.join(templatesDir, 'sqli-union.sqlite'));
dbUnion.serialize(() => {
   dbUnion.run(`
      CREATE TABLE sqli_union (
         id INTEGER PRIMARY KEY,
         name VARCHAR(100),
         category VARCHAR(50),
         price DECIMAL(10, 2),
         secret_key VARCHAR(100)
      )
   `);
   // Вставляем обычные товары. Товар с флагом (id=3) добавит контроллер.
   dbUnion.run(`
      INSERT INTO sqli_union (id, name, category, price, secret_key) 
      VALUES 
      (1, 'Laptop', 'Electronics', 999.99, 'info_public'),
      (2, 'Computer', 'Electronics', 500.00, 'info_public')
   `);
   console.log("✅ Шаблон 'sqli-union' создан.");
});
dbUnion.close();

// ==========================================
// Лаба 4: Hidden-data
// ==========================================
const dbHidden = new sqlite3.Database(path.join(templatesDir, 'hidden-data.sqlite'));
dbHidden.serialize(() => {
   dbHidden.run(`
      CREATE TABLE sqli_hidden_data (
         id INTEGER PRIMARY KEY,
         name VARCHAR(100),
         category VARCHAR(50),
         price DECIMAL(10, 2),
         secret_key VARCHAR(100),
         is_relized INTEGER DEFAULT 0
      )
   `);
   // Вставляем релизнутые товары (is_relized = 1). 
   // Скрытый товар с флагом (id=9, is_relized=0) добавит контроллер.
   dbHidden.run(`
      INSERT INTO sqli_hidden_data (id, name, category, price, secret_key, is_relized) 
      VALUES 
      (1, 'Intel Core i9-13900K', 'Processors', 589.99, 'info_public', 1),
      (2, 'AMD Ryzen 7 7800X3D', 'Processors', 449.00, 'info_public', 1),
      (3, 'NVIDIA RTX 4090 Founders Edition', 'GPU', 1599.99, 'info_public', 1),
      (4, 'ASUS ROG Strix Z790-E', 'Motherboards', 499.99, 'info_public', 1),
      (5, 'Samsung 990 Pro 2TB', 'Storage', 170.00, 'info_public', 1),
      (6, 'Corsair Dominator Platinum 32GB', 'RAM', 210.00, 'info_public', 1),
      (7, 'NZXT H9 Flow Case', 'Cases', 159.00, 'info_public', 1),
      (8, 'RTX 5090 Prototype', 'GPU', 0.00, 'info_public', 1)
   `);
   console.log("✅ Шаблон 'sqli-hidden-data' создан.");
});
dbHidden.close();

// ==========================================
// Лаба 5: Union-Select-2 (Data Types)
// ==========================================
const dbUnionTypes = new sqlite3.Database(path.join(templatesDir, 'union-2.sqlite'));
dbUnionTypes.serialize(() => {
   dbUnionTypes.run(`
      CREATE TABLE sqli_union_2_products (
         id INTEGER PRIMARY KEY,
         name VARCHAR(100),
         stock_count INTEGER,
         price DECIMAL(10, 2)
      )
   `);
   dbUnionTypes.run(`
      CREATE TABLE sqli_union_2_users (
         id INTEGER PRIMARY KEY,
         username VARCHAR(50),
         password VARCHAR(50)
      )
   `);
   dbUnionTypes.run(`INSERT INTO sqli_union_2_products (id, name, stock_count, price) VALUES (1, 'Gaming PC High-End', 5, 2500.00)`);
   // Таблицу юзеров оставляем пустой. Админа с флагом добавит контроллер.
   console.log("✅ Шаблон 'sqli-union-2' создан.");
});
dbUnionTypes.close();