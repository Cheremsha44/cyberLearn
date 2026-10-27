// БЛОК 1: Импорты
const express = require('express');
const ejs = require('ejs'); // Наш шаблонизатор
// БЛОК 2: Инициализация
const app = express();
app.use(express.static('public'));

// БЛОК 3: Маршрут
app.get('/api/greet', (req, res) => {
   const name = req.query.name || 'Гость';
   const template = `<h1>Привет, ${name}!</h1>`; // Добавили const

   try {
      // Ошибка может возникнуть именно здесь, при компиляции кривого пейлоада
      const html = ejs.render(template);
      res.send(html);
   } catch (err) {
      res.status(500).send(`> Ошибка: Недопустимый синтаксис шаблона`);
   }
});

// БЛОК 4: Слушатель
const PORT = 80;
app.listen(PORT, () => console.log('SSTI Simple Lab started'));