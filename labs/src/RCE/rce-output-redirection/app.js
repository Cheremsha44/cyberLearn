const express = require('express');
const { exec } = require('child_process');

const app = express();
app.use(express.json());

// Открываем доступ к папке public, чтобы студент мог скачать оттуда свой сгенерированный файл
app.use(express.static('public'));

app.post('/api/ping', (req, res) => {
   const { ip } = req.body;

   // УЯЗВИМОСТЬ: Ввод подставляется в системную команду без фильтрации
   const command = `ping -c 1 ${ip}`;

   exec(command, (error, stdout, stderr) => {
      // СЛЕПОЕ RCE: Мы игнорируем вывод консоли и отдаем только заглушку
      res.json({ message: '> Диагностика завершена. Отчет сохранен во внутренний лог системы.' });
   });
});

const PORT = 80;
app.listen(PORT, () => {
   console.log(`Blind RCE Lab running on port ${PORT}`);
});