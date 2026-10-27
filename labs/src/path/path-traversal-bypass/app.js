// БЛОК 1: Импорты
const express = require('express');
const fs = require('fs');
const path = require('path');

// БЛОК 2: Инициализация
const app = express();
app.use(express.static('public'));

// БЛОК 3: Маршрут (ТВОЙ ВЫХОД!)
app.get('/api/view', (req, res) => {
   // Пиши код здесь по шагам 1-5
   const filename = req.query.file;
   if (!filename) {
      return res.status(400).send('> Ошибка: Файл не указан');
   }

   let cleanFilename = filename.replaceAll('../', '');

   const filepath = path.join(__dirname, 'logs', cleanFilename);

   try {
      const content = fs.readFileSync(filepath, 'utf8');
      res.send(content);
   } catch (err) {
      res.status(404).send(`> Ошибка: Файл не найден (${filepath})`);
   }

});

// БЛОК 4: Слушатель
const PORT = 80;
app.listen(PORT, () => console.log('Path Traversal Bypass Lab started'));