const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/api/subscribe', (req, res) => {
   const { email } = req.body;

   // УЯЗВИМОСТЬ: Прямая конкатенация ввода пользователя
   const command = `sh subscribe.sh ${email}`;

   // Выполняем команду
   exec(command, (error, stdout, stderr) => {
      // СЛЕПОЕ RCE: Никаких ошибок или результатов не возвращается.
      // Ответ всегда одинаковый и успешный.
      res.json({ message: '> Успешно! Ваш email добавлен в защищенную базу рассылки.' });
   });
});

const PORT = 80;
app.listen(PORT, () => {
   console.log(`Time Delays RCE Lab running on port ${PORT}`);
});