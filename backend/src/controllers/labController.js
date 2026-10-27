const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const Docker = require('dockerode');
const db = require('../config/db');

// Dockerode автоматически найдет сокет или pipe (на Windows)
const docker = new Docker();

/**
 * Запуск лабораторной работы
 */
exports.startLab = async (req, res) => {
   try {
      const { exerciseId } = req.body;
      const userId = req.user.id;

      if (!exerciseId) {
         return res.status(400).json({ message: 'Exercise ID is required' });
      }

      // Проверка, не заморожена ли лабораторная или уязвимость
      const [[exerciseAccess]] = await db.query(
         `
         SELECT
            e.id,
            e.is_frozen,
            v.is_frozen AS course_is_frozen
         FROM exercises e
         JOIN vulnerabilities v ON v.id = e.vulnerability_id
         WHERE e.id = ?
         LIMIT 1
         `,
         [exerciseId]
      );

      if (!exerciseAccess) {
         return res.status(404).json({ message: 'Exercise not found' });
      }

      if (Number(exerciseAccess.is_frozen) === 1 || Number(exerciseAccess.course_is_frozen) === 1) {
         return res.status(403).json({
            status: 'error',
            message: 'Exercise is temporarily unavailable'
         });
      }

      // 1. Проверяем, есть ли уже активная сессия в БД
      const [sessions] = await db.query(
         'SELECT * FROM active_sessions WHERE user_id = ? AND exercise_id = ?',
         [userId, exerciseId]
      );

      if (sessions.length > 0) {
         const session = sessions[0];

         try {
            const container = docker.getContainer(session.container_id);
            const data = await container.inspect();

            if (data.State.Running) {
               console.log(`♻️ Возвращаю существующий контейнер ${session.container_id}`);

               const [[exercise]] = await db.query('SELECT lab_entry_path FROM exercises WHERE id = ?', [
                  exerciseId
               ]);

               const pathUrl = exercise?.lab_entry_path || '/';

               return res.json({
                  status: 'success',
                  url: `http://localhost:${session.port}${pathUrl}`,
                  container_id: session.container_id
               });
            } else {
               // Контейнер мертв, зачищаем следы
               await db.query('DELETE FROM active_sessions WHERE id = ?', [session.id]);
               await container.remove({ force: true }).catch(() => { });
               if (session.db_path) await fs.unlink(session.db_path).catch(() => { });
            }
         } catch (err) {
            // Ошибка инспекта (контейнера нет), зачищаем
            await db.query('DELETE FROM active_sessions WHERE id = ?', [session.id]);
            if (session.db_path) await fs.unlink(session.db_path).catch(() => { });
         }
      }

      // 2. Получаем информацию об образе
      const [exercises] = await db.query(
         'SELECT lab_key, lab_entry_path FROM exercises WHERE id = ?',
         [exerciseId]
      );

      if (exercises.length === 0) {
         return res.status(404).json({ message: 'Exercise not found' });
      }

      const { lab_key, lab_entry_path } = exercises[0];

      // ========================================================
      // 2.5 ПОДГОТОВКА ДАННЫХ ДЛЯ ЛАБОРАТОРНОЙ (SQLite или Txt-флаг)
      // ========================================================

      // Добавляем поле type: 'sqlite' или 'text_flag'
      const labConfigs = {
         // --- SQL Injection ---
         'sqli-auth-bypass': { type: 'sqlite', templateFile: 'sqli-auth-bypass.sqlite', insertQuery: "INSERT INTO sqli_auth_bypass (username, password) VALUES ('admin', ?)" },
         'sqli-blind': { type: 'sqlite', templateFile: 'sqli-blind.sqlite', insertQuery: "INSERT INTO sqli_blind (id, name, secret_key) VALUES (2, 'Admin_Panel', ?)" },
         'sqli-union': { type: 'sqlite', templateFile: 'sqli-union.sqlite', insertQuery: "INSERT INTO sqli_union (id, name, category, price, secret_key) VALUES (3, 'Flag', 'Flags', 300.00, ?)" },
         'hidden-data': { type: 'sqlite', templateFile: 'hidden-data.sqlite', insertQuery: "INSERT INTO sqli_hidden_data (id, name, category, price, secret_key, is_relized) VALUES (9, 'Intel Core i11-16900K (Early Access)', 'Processors', 9999.00, ?, 0)" },
         'union-2': { type: 'sqlite', templateFile: 'union-2.sqlite', insertQuery: "INSERT INTO sqli_union_2_users (id, username, password) VALUES (1, 'admin', ?)" },
         // --- RCE ---
         'rce-simple': { type: 'text_flag', targetPath: '/flag.txt' },
         'rce-redirection': { type: 'text_flag', targetPath: '/flag.txt' },
         'rce-time-delays': { type: 'text_flag', targetPath: '/flag.txt' },
         // --- Path Traversal ---
         'path-traversal-simple': { type: 'text_flag', targetPath: '/flag.txt' },
         'path-traversal-absolute': { type: 'text_flag', targetPath: '/flag.txt' },
         'path-traversal-bypass': { type: 'text_flag', targetPath: '/flag.txt' },
         // --- SSTI ---
         'ssti-simple': { type: 'text_flag', targetPath: '/flag.txt' },
         'ssti-read': { type: 'text_flag', targetPath: '/flag.txt' },
         'ssti-rce': { type: 'text_flag', targetPath: '/flag.txt' }
      };

      const labConfig = labConfigs[lab_key];
      if (!labConfig) {
         return res.status(500).json({ message: `Configuration for lab '${lab_key}' is missing in controller.` });
      }

      const uniqueSuffix = crypto.randomBytes(4).toString('hex');
      const dynamicFlag = `flag{cyber_learn_${crypto.randomBytes(6).toString('hex')}}`;

      const activeDbsDir = path.join(__dirname, '../active_dbs');
      let activeDbPath = ''; // Сохраняем это имя переменной, чтобы не ломать твою логику удаления!
      let containerBinds = []; // Динамические бинды для Докера

      // ЛОГИКА ДЛЯ БАЗ ДАННЫХ (SQLi)
      if (labConfig.type === 'sqlite') {
         const dbFilename = `db_${uniqueSuffix}.sqlite`;
         activeDbPath = path.join(activeDbsDir, dbFilename);
         const templatePath = path.join(activeDbsDir, 'templates', labConfig.templateFile);

         try {
            await fs.copyFile(templatePath, activeDbPath);
            await new Promise((resolve, reject) => {
               const localDb = new sqlite3.Database(activeDbPath, (err) => { if (err) reject(err); });
               localDb.run(labConfig.insertQuery, [dynamicFlag], function (err) {
                  localDb.close();
                  if (err) reject(err); else resolve();
               });
            });
            containerBinds = [`${activeDbPath}:/var/www/html/database.sqlite`];
         } catch (dbError) {
            console.error('Ошибка подготовки SQLite БД:', dbError);
            await fs.unlink(activeDbPath).catch(() => { });
            return res.status(500).json({ message: `Failed to setup DB for ${labConfig.templateFile}.` });
         }

         // ЛОГИКА ДЛЯ ТЕКСТОВЫХ ФЛАГОВ (RCE, Path Traversal, SSTI)
      } else if (labConfig.type === 'text_flag') {
         const flagFilename = `flag_${uniqueSuffix}.txt`;
         activeDbPath = path.join(activeDbsDir, flagFilename); // Кладем туда же, в active_dbs

         try {
            // Просто создаем текстовый файл с флагом
            await fs.writeFile(activeDbPath, dynamicFlag);
            containerBinds = [`${activeDbPath}:${labConfig.targetPath}`];
         } catch (err) {
            console.error('Ошибка записи файла флага:', err);
            await fs.unlink(activeDbPath).catch(() => { });
            return res.status(500).json({ message: 'Failed to create flag file.' });
         }
      }
      // ========================================================

      console.log(`🚀 Запускаю новый контейнер для образа: ${lab_key}`);

      // 3. Создаем и запускаем контейнер
      const container = await docker.createContainer({
         Image: lab_key,
         AttachStdin: false, AttachStdout: false, AttachStderr: false, Tty: false,
         HostConfig: {
            PortBindings: {
               '80/tcp': [{ HostPort: '0' }]
            },
            Binds: containerBinds, // Прокидываем либо БД, либо txt-файл
            NetworkMode: 'diploma_network',
            Memory: 128 * 1024 * 1024,
            NanoCpus: 500000000
         }
      });

      await container.start();

      // 4. Узнаем порт
      const inspectData = await container.inspect();
      const ports = inspectData.NetworkSettings.Ports['80/tcp'];

      if (!ports || !ports[0]) {
         throw new Error('Container started but port 80 is not exposed');
      }

      const hostPort = ports[0].HostPort;

      // 5. Сохраняем сессию в БД вместе с динамическим флагом и путем к файлу БД
      try {
         await db.query(
            'INSERT INTO active_sessions (user_id, exercise_id, container_id, port, expected_flag, db_path) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, exerciseId, container.id, hostPort, dynamicFlag, activeDbPath]
         );
      } catch (dbError) {
         console.error('❌ Ошибка записи сессии в БД. Удаляю контейнер и файл БД...', dbError.message);
         await container.stop().catch(() => { });
         await container.remove().catch(() => { });
         await fs.unlink(activeDbPath).catch(() => { });
         throw dbError;
      }

      // ТАЙМЕР ЖИЗНИ КОНТЕЙНЕРА НА 15 МИНУТ
      setTimeout(async () => {
         try {
            console.log(`⏳ Время вышло (15 мин)! Удаляю контейнер ${container.id}`);
            const targetContainer = docker.getContainer(container.id);
            await targetContainer.stop().catch(() => { });
            await targetContainer.remove({ force: true }).catch(() => { });
            await db.query('DELETE FROM active_sessions WHERE container_id = ?', [container.id]);
            await fs.unlink(activeDbPath).catch(() => { }); // Удаляем файл БД
            console.log(`🗑️ Контейнер ${container.id} и БД успешно уничтожены по таймеру.`);
         } catch (err) {
            console.error('Ошибка при автоматическом удалении по таймеру:', err);
         }
      }, 15 * 60 * 1000);

      const fullUrl = `http://localhost:${hostPort}${lab_entry_path || '/'}`;

      return res.json({
         status: 'success',
         url: fullUrl,
         container_id: container.id
      });
   } catch (error) {
      console.error('Lab Start Error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
   }
};

/**
 * Остановка лабораторной
 */
exports.stopLab = async (req, res) => {
   try {
      const { container_id } = req.body;
      const userId = req.user.id;

      // Сначала достаем путь к файлу БД, чтобы его удалить
      const [sessions] = await db.query(
         'SELECT db_path FROM active_sessions WHERE container_id = ? AND user_id = ?',
         [container_id, userId]
      );

      if (sessions.length > 0) {
         const dbPath = sessions[0].db_path;

         // Удаляем запись из БД
         await db.query('DELETE FROM active_sessions WHERE container_id = ? AND user_id = ?', [container_id, userId]);

         // Убиваем контейнер
         const container = docker.getContainer(container_id);
         await container.stop().catch(() => { });
         await container.remove().catch(() => { });

         // Удаляем файл SQLite
         if (dbPath) {
            await fs.unlink(dbPath).catch(() => { });
         }
      }

      return res.json({ status: 'success' });
   } catch (error) {
      return res.status(500).json({ message: error.message });
   }
};

/**
 * Проверка CTF-флага и зачисление прогресса
 */
exports.submitFlag = async (req, res) => {
   try {
      const { exerciseId, flag } = req.body;
      const userId = req.user.id;

      if (!exerciseId || !flag) {
         return res.status(400).json({ message: 'Необходим ID задания и флаг' });
      }

      let expectedFlag = null;

      // 1. Сначала ищем динамический флаг в активной сессии (для новых SQLite лаб)
      const [sessions] = await db.query(
         'SELECT expected_flag FROM active_sessions WHERE user_id = ? AND exercise_id = ?',
         [userId, exerciseId]
      );

      if (sessions.length > 0 && sessions[0].expected_flag) {
         expectedFlag = sessions[0].expected_flag;
      } else {
         // 2. Фолбэк: если лаба статическая или сессии нет, ищем в таблице exercises
         const [exercises] = await db.query(
            'SELECT flag FROM exercises WHERE id = ?',
            [exerciseId]
         );

         if (exercises.length === 0) {
            return res.status(404).json({ message: 'Задание не найдено' });
         }
         expectedFlag = exercises[0].flag;
      }

      // 3. Сверяем флаги
      if (!expectedFlag || flag.trim() !== expectedFlag.trim()) {
         return res.status(400).json({ status: 'error', message: 'Неверный флаг. Ищи лучше!' });
      }

      // 4. Сохраняем прогресс
      await db.query(
         'INSERT IGNORE INTO user_exercises (user_id, exercise_id) VALUES (?, ?)',
         [userId, exerciseId]
      );

      return res.json({
         status: 'success',
         message: 'Флаг верный! Задание успешно выполнено 🏆'
      });

   } catch (error) {
      console.error('Ошибка проверки флага:', error);
      return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
   }
};