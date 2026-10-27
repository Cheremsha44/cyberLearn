CREATE DATABASE IF NOT EXISTS sqli_labs;
USE sqli_labs;
-- ==========================================
-- Таблицы для разных лаб
-- ==========================================
-- Лаба 1: Простая sqli_auth_bypass-- Лаба 1: Простая sqli_auth_bypass-- Лаба 1: Простая sqli_auth_bypass-- Лаба 1: Простая sqli_auth_bypass-- Лаба 1: Простая sqli_auth_bypass
CREATE TABLE sqli_auth_bypass (
   id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(50),
   password VARCHAR(50)
);
INSERT INTO sqli_auth_bypass (username, password)
VALUES ('admin', 'flag{easy_union_sqli_done}'),
   ('user', 'qwerty');
-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind-- Лаба 2: sqli_blind
CREATE TABLE sqli_blind (
   id INT PRIMARY KEY,
   name VARCHAR(50),
   secret_key VARCHAR(100)
);
INSERT INTO sqli_blind
VALUES (1, 'Laptop', 'public_info'),
   (2, 'Admin_Panel', 'flag{error_based_master}');
-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union-- Лаба 3:  sqli-union
CREATE TABLE sqli_union (
   id INT PRIMARY KEY,
   name VARCHAR(100),
   category VARCHAR(50),
   price DECIMAL(10, 2),
   secret_key VARCHAR(100)
);
INSERT INTO sqli_union
VALUES (
      1,
      'Laptop',
      'Electronics',
      999.99,
      'flag{try_another_id}'
   ),
   (
      2,
      'Computer',
      'Electronics',
      500.00,
      'flag{try_another_category}'
   ),
   (
      3,
      'Flag',
      'Flags',
      300.00,
      'flag{union_select_master}'
   );
-- Лаба 4:  Hidden-data--Лаба 4:  Hidden-data--Лаба 4:  Hidden-data--Лаба 4:  Hidden-data--Лаба 4:  Hidden-data--Лаба 4:  Hidden-data--Лаба 4:  Hidden-data--
CREATE TABLE sqli_hidden_data (
   id INT PRIMARY KEY,
   name VARCHAR(100),
   category VARCHAR(50),
   price DECIMAL(10, 2),
   secret_key VARCHAR(100),
   is_relized boolean DEFAULT false
);
INSERT INTO sqli_hidden_data (
      id,
      name,
      category,
      price,
      secret_key,
      is_relized
   )
VALUES (
      1,
      'Intel Core i9-13900K',
      'Processors',
      589.99,
      'info_public',
      true
   ),
   (
      2,
      'AMD Ryzen 7 7800X3D',
      'Processors',
      449.00,
      'info_public',
      true
   ),
   (
      3,
      'NVIDIA RTX 4090 Founders Edition',
      'GPU',
      1599.99,
      'info_public',
      true
   ),
   (
      4,
      'ASUS ROG Strix Z790-E',
      'Motherboards',
      499.99,
      'info_public',
      true
   ),
   (
      5,
      'Samsung 990 Pro 2TB',
      'Storage',
      170.00,
      'info_public',
      true
   ),
   (
      6,
      'Corsair Dominator Platinum 32GB',
      'RAM',
      210.00,
      'info_public',
      true
   ),
   (
      7,
      'NZXT H9 Flow Case',
      'Cases',
      159.00,
      'info_public',
      true
   ),
   (
      8,
      'RTX 5090 Prototype',
      'GPU',
      0.00,
      'info_public',
      true
   ),
   (
      9,
      'Intel Core i11-16900K (Early Access)',
      'Processors',
      9999.00,
      'flag{broken_logic_unlocked}',
      false
   );
-- Лаба 5: Union-Select-2 (Data Types)
CREATE TABLE sqli_union_2_products (
   id INT PRIMARY KEY,
   name VARCHAR(100),
   stock_count INT,
   -- <--- ЛОВУШКА: Тут число
   price DECIMAL(10, 2) -- <--- ЛОВУШКА: Тут тоже число
);
CREATE TABLE sqli_union_2_users (
   id INT PRIMARY KEY,
   username VARCHAR(50),
   password VARCHAR(50)
);
INSERT INTO sqli_union_2_products
VALUES (1, 'Gaming PC High-End', 5, 2500.00);
INSERT INTO sqli_union_2_users
VALUES (1, 'admin', 'flag{union_data_types_matter}');
-- ==========================================
-- Настройка прав доступа (САМОЕ ВАЖНОЕ)
-- ==========================================
-- Настройка прав доступа
CREATE USER IF NOT EXISTS 'readonly_user' @'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON sqli_labs.* TO 'readonly_user' @'%';
FLUSH PRIVILEGES;