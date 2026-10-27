const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());
// Раздаем статику (наш HTML)
app.use(express.static('public'));

app.post('/api/stock', (req, res) => {
   const { productId, storeId } = req.body;

   // УЯЗВИМОСТЬ: Ввод пользователя (storeId) склеивается с командой без фильтрации!
   // Изменили bash на sh
   const command = `sh stock_checker.sh ${productId} ${storeId}`;
   exec(command, (error, stdout, stderr) => {
      if (error) {
         return res.json({ result: stdout || stderr || error.message });
      }
      res.json({ result: stdout });
   });
});

const PORT = 80;
app.listen(PORT, () => {
   console.log(`RCE Lab running on port ${PORT}`);
});