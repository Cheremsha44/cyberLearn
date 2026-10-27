const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('public'));

app.get('/api/view', (req, res) => {
   const filename = req.query.file;
   if (!filename) return res.status(400).send('> Ошибка: Файл не указан');

   // ТА САМАЯ "НАДЕЖНАЯ" ЗАЩИТА
   if (filename.includes('../')) {
      return res.status(403).send('> СИСТЕМНАЯ ЗАЩИТА: Попытка выхода из директории (../) заблокирована!');
   }

   const logsDir = path.join(__dirname, 'logs');
   const filePath = path.resolve(logsDir, filename);

   try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.send(content);
   } catch (err) {
      // Раскрываем путь для удобства дебага студентам
      res.status(404).send(`> Ошибка: Файл не найден (${filePath})`);
   }
});

const PORT = 80;
app.listen(PORT, () => console.log('Path Traversal Absolute Lab started'));