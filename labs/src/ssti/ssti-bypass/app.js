const express = require('express');
const ejs = require('ejs');

const app = express();
app.use(express.static('public'));

app.get('/api/greet', (req, res) => {
   const name = req.query.name || 'Гость';

   // "Надежный" WAF: блокируем все известные слова для RCE
   const blacklist = ['process', 'require', 'exec', 'child_process', 'mainModule'];
   for (let word of blacklist) {
      if (name.includes(word)) {
         return res.status(403).send('> WAF ALERT: Обнаружена хакерская атака! Запрос заблокирован.');
      }
   }

   // УЯЗВИМОСТЬ: Ввод все равно попадает в шаблон
   const template = `<h1>Привет, ${name}!</h1>`;

   try {
      const html = ejs.render(template);
      res.send(html);
   } catch (err) {
      res.status(500).send(`> Ошибка: Недопустимый синтаксис шаблона`);
   }
});

const PORT = 80;
app.listen(PORT, () => console.log('SSTI Bypass Lab started'));