const express = require('express');
const nunjucks = require('nunjucks'); // Сменили движок!

const app = express();
app.use(express.static('public'));

// Настраиваем Nunjucks (отключаем автоэкранирование HTML для чистоты эксперимента)
nunjucks.configure({ autoescape: false });

app.get('/api/greet', (req, res) => {
   const name = req.query.name || 'Гость';

   // УЯЗВИМОСТЬ: Ввод по-прежнему прошивается прямо в шаблон
   const template = `<h1>Привет, ${name}!</h1>`;

   try {
      // Рендерим строку через Nunjucks
      const html = nunjucks.renderString(template);
      res.send(html);
   } catch (err) {
      res.status(500).send(`> Ошибка компиляции шаблона Nunjucks`);
   }
});

const PORT = 80;
app.listen(PORT, () => console.log('SSTI Advanced (Nunjucks) Lab started'));