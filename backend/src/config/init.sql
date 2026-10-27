SET NAMES utf8mb4;
USE cyberlearn;
-- ==========================================
-- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- ==========================================
CREATE TABLE users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(50) NOT NULL,
   email VARCHAR(100) NOT NULL,
   password VARCHAR(255) NOT NULL,
   role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
   is_blocked TINYINT(1) NOT NULL DEFAULT 0,
   failed_login_attempts INT NOT NULL DEFAULT 0,
   login_locked_until DATETIME NULL,
   avatar VARCHAR(255) DEFAULT 'default-avatar.png',
   bio VARCHAR(250) DEFAULT 'Изучаю кибербезопасность и этичный хакинг',
   level VARCHAR(50) NOT NULL DEFAULT 'Beginner',
   experience INT NOT NULL DEFAULT 0,
   study_hours INT NOT NULL DEFAULT 0,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   UNIQUE KEY unique_username (username),
   UNIQUE KEY unique_email (email)
);
CREATE TABLE password_reset_tokens (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   token_hash CHAR(64) NOT NULL,
   expires_at DATETIME NOT NULL,
   used_at DATETIME NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE KEY uniq_password_reset_token_hash (token_hash),
   KEY idx_password_reset_user (user_id),
   KEY idx_password_reset_expires_at (expires_at),
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO users (username, email, password, role, level)
VALUES (
      'admin_user',
      'admin@cyberlearn.ru',
      'hashed_password_here',
      'admin',
      'Advanced'
   ),
   (
      'security_student',
      'student@example.com',
      'hashed_password_here',
      'user',
      'Beginner'
   ),
   (
      'pentester_pro',
      'pro@cyberlearn.ru',
      'hashed_password_here',
      'user',
      'Intermediate'
   );
UPDATE users
SET role = 'admin'
WHERE id = 3;
-- ==========================================
-- ТАБЛИЦА УЯЗВИМОСТЕЙ
-- ==========================================
CREATE TABLE vulnerabilities (
   id INT AUTO_INCREMENT PRIMARY KEY,
   code VARCHAR(50) UNIQUE NOT NULL,
   title VARCHAR(100) NOT NULL,
   description TEXT,
   is_frozen TINYINT(1) NOT NULL DEFAULT 0,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO vulnerabilities (code, title, description)
VALUES (
      'sql',
      'SQL Injection',
      'Внедрение SQL-кода для манипуляции базой данных'
   ),
   (
      'path',
      'Path Traversal',
      'Обход каталогов веб-сайта'
   ),
   (
      'SSTI',
      'Server-Side Template Injection',
      'Внедрение шаблонов на стороне сервера'
   ),
   (
      'rce',
      'Remote Code Execution (RCE)',
      'Удаленное выполнение произвольного кода'
   );
-- ==========================================
-- ТАБЛИЦА ЗАДАНИЙ (С ФЛАГАМИ)
-- ==========================================
CREATE TABLE exercises (
   id INT AUTO_INCREMENT PRIMARY KEY,
   vulnerability_id INT NOT NULL,
   slug VARCHAR(80) NOT NULL,
   title VARCHAR(255) NOT NULL,
   description TEXT,
   theory TEXT,
   difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
   order_index INT NOT NULL DEFAULT 1,
   estimated_minutes INT DEFAULT 10,
   is_published TINYINT(1) NOT NULL DEFAULT 1,
   is_frozen TINYINT(1) NOT NULL DEFAULT 0,
   lab_key VARCHAR(80) NOT NULL,
   lab_entry_path VARCHAR(255) DEFAULT '/',
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE KEY uniq_vuln_slug (vulnerability_id, slug),
   FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities(id) ON DELETE CASCADE
);
-- Инъекции SQL
INSERT INTO exercises (
      vulnerability_id,
      slug,
      title,
      description,
      theory,
      difficulty,
      order_index,
      estimated_minutes,
      lab_key,
      lab_entry_path
   )
VALUES (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'sql'
         LIMIT 1
      ), 'auth-bypass', 'Обход аутентификации', 'Получите доступ к системе без знания логина и пароля, используя SQL-инъекцию.', 'SQL Injection возникает, когда пользовательский ввод напрямую подставляется в SQL-запрос...', 'beginner', 1, 10, 'sqli-auth-bypass', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'sql'
         LIMIT 1
      ), 'union-select', 'UNION SELECT', 'Используйте оператор UNION для извлечения данных из других таблиц базы данных.', 'Оператор UNION позволяет объединять результаты нескольких SELECT...', 'intermediate', 3, 20, 'sqli-union', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'sql'
         LIMIT 1
      ), 'blind-sqli', 'Blind SQL Injection', 'Извлеките данные из базы без прямого отображения результата на странице.', 'Blind SQL Injection применяется, когда приложение не выводит результаты...', 'advanced', 5, 25, 'sqli-blind', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'sql'
         LIMIT 1
      ), 'union-select-2', 'UNION SELECT: Подбор типов', 'Продвинутое упражнение на UNION-инъекцию.', 'Определите количество столбцов и их типы данных, чтобы объединить запрос с таблицей пользователей.', 'beginner', 4, 15, 'union-2', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'sql'
         LIMIT 1
      ), 'hidden-data', 'Скрытые данные', 'Упражнение на обход бизнес-логики через SQL.', 'В приложении настроен фильтр, скрывающий секретные товары. Сможете ли вы увидеть то, что не предназначено для ваших глаз?', 'beginner', 2, 10, 'hidden-data', '/'
   );
-- Path Traversal
INSERT INTO exercises (
      vulnerability_id,
      slug,
      title,
      description,
      theory,
      difficulty,
      order_index,
      estimated_minutes,
      lab_key,
      lab_entry_path
   )
VALUES (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'path'
         LIMIT 1
      ), 'file-path-traversal-1', 'Базовый Path Traversal', 'Прочитайте содержимое скрытого файла на сервере, используя уязвимость обхода каталога.', 'Path Traversal (Directory Traversal) позволяет злоумышленнику выходить за пределы рабочей директории сервера с помощью последовательностей "../" и читать произвольные файлы.', 'beginner', 1, 10, 'path-traversal-simple', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'path'
         LIMIT 1
      ), 'file-path-traversal-2', 'Абсолютный путь (Absolute Path)', 'Прочитайте файл, обойдя простую защиту, которая блокирует символы "../".', 'Иногда приложения фильтруют последовательности обхода директорий, но по ошибке принимают полные (абсолютные) пути к файлам, например "/etc/passwd" или "/flag.txt".', 'beginner', 2, 15, 'path-traversal-absolute', '/'
   ),(
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'path'
         LIMIT 1
      ), 'file-path-traversal-3', 'Обход фильтра (Null-byte / URL Encode)', 'Обойдите строгую проверку расширения файла, чтобы получить флаг.', 'Если сервер проверяет, что файл заканчивается на конкретное расширение (например, .jpg), защиту можно попытаться обойти с помощью URL-кодирования (%2e%2e%2f) или внедрения нулевого байта (%00).', 'intermediate', 3, 20, 'path-traversal-bypass', '/'
   );
-- RCE (Command Injection)
INSERT INTO exercises (
      vulnerability_id,
      slug,
      title,
      description,
      theory,
      difficulty,
      order_index,
      estimated_minutes,
      lab_key,
      lab_entry_path
   )
VALUES (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'rce'
         LIMIT 1
      ), 'command-injection-simple', 'Базовое RCE', 'Выполните системную команду на сервере через уязвимый параметр.', 'Command Injection возникает, когда пользовательский ввод передаётся напрямую в интерпретатор командной строки (shell) без должной фильтрации. Разделителями команд могут выступать символы ";", "|", "&&".', 'beginner', 1, 15, 'rce-simple', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'rce'
         LIMIT 1
      ), 'rce-output-redirection', 'Слепое RCE с перенаправлением', 'Выполните команду, результат которой не выводится на экран, перенаправив вывод в доступную директорию.', 'Если сервер уязвим к RCE, но не возвращает результат в HTTP-ответе, можно перенаправить вывод команды (>) в публичную папку веб-сервера и прочитать созданный файл.', 'intermediate', 2, 20, 'rce-redirection', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'rce'
         LIMIT 1
      ), 'rce-time-delays', 'Слепое RCE через задержки', 'Подтвердите наличие уязвимости и извлеките данные, заставив сервер "уснуть".', 'Когда приложение никак не реагирует на инъекцию визуально, можно использовать команду sleep. Если ответ сервера задерживается, это подтверждает успешное выполнение инъекции.', 'advanced', 3, 25, 'rce-time-delays', '/'
   );
-- SSTI
INSERT INTO exercises (
      vulnerability_id,
      slug,
      title,
      description,
      theory,
      difficulty,
      order_index,
      estimated_minutes,
      lab_key,
      lab_entry_path
   )
VALUES (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'SSTI'
         LIMIT 1
      ), 'ssti-basic', 'Базовый SSTI', 'Найдите уязвимость в шаблонизаторе и выполните простую математическую операцию.', 'SSTI (Server-Side Template Injection) возникает, когда пользовательский ввод небезопасно встраивается в шаблон (например, EJS, Pug, Jinja2). Тестирование начинается с базовых выражений, таких как {{7*7}}.', 'beginner', 1, 10, 'ssti-simple', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'SSTI'
         LIMIT 1
      ), 'ssti-file-read', 'SSTI: Чтение файлов', 'Используйте уязвимость в шаблонизаторе для чтения файла /flag.txt.', 'Если шаблонизатор не работает в строгой изоляции (sandbox), атакующий может получить доступ к глобальным объектам или файловой системе сервера.', 'intermediate', 2, 20, 'ssti-read', '/'
   ), (
      (
         SELECT id
         FROM vulnerabilities
         WHERE code = 'SSTI'
         LIMIT 1
      ), 'ssti-rce', 'SSTI to RCE', 'Повысьте уязвимость от инъекции в шаблон до полноценного выполнения системных команд (RCE).', 'Используя цепочки вызовов стандартных объектов платформы (например, global.process.mainModule в Node.js), можно вызвать функции выполнения системных команд.', 'advanced', 3, 30, 'ssti-rce', '/'
   );
-- ==========================================
-- СЕССИИ И ПРОГРЕСС
-- ==========================================
CREATE TABLE active_sessions (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT NOT NULL,
   exercise_id INT NOT NULL,
   container_id VARCHAR(64) NOT NULL,
   port INT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
   UNIQUE KEY unique_user_lab (user_id, exercise_id)
);
CREATE TABLE IF NOT EXISTS user_exercises (
   user_id INT NOT NULL,
   exercise_id INT NOT NULL,
   completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (user_id, exercise_id),
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);
Select *
from users;
INSERT IGNORE INTO user_exercises (user_id, exercise_id)
SELECT 6,
   id
FROM exercises;
DELETE FROM user_exercises
WHERE user_id = 6;
INSERT IGNORE INTO user_exercises (user_id, exercise_id)
SELECT 6,
   id
FROM exercises
WHERE vulnerability_id = (
      SELECT id
      FROM vulnerabilities
      WHERE code = 'sql'
   );
ALTER TABLE active_sessions
ADD COLUMN expected_flag VARCHAR(255) DEFAULT NULL;
ALTER TABLE active_sessions
ADD COLUMN db_path VARCHAR(255) DEFAULT NULL;