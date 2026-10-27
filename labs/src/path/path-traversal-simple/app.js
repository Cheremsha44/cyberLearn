const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// Раздаем статику из папки public
app.use(express.static('public'));

app.get('/api/view', (req, res) => {
   const filename = req.query.file;
   if (!filename) {
      return res.status(400).send('> Ошибка: Файл не указан');
   }

   // УЯЗВИМОСТЬ: Склеиваем путь без фильтрации '../'
   // __dirname указывает на /var/www/html
   const logsDir = path.join(__dirname, 'logs');
   const filePath = path.join(logsDir, filename);

   try {
      // Читаем файл и отдаем текст
      const content = fs.readFileSync(filePath, 'utf8');
      res.send(content);
   } catch (err) {
      // Если файла нет, выводим ошибку и (внимание!) раскрываем путь, 
      // чтобы студенту было проще дебажить свой пейлоад.
      res.status(404).send(`> Ошибка: Файл не найден (${filePath})`);
   }
});

const PORT = 80;
app.listen(PORT, () => console.log('Path Traversal Lab started'));