<?php
// Подключаемся к локальному файлу SQLite
$db_path = '/var/www/html/database.sqlite';

$id = $_GET['id'] ?? '';
$message = "";
$status_class = "";
$product_data = null;

if ($id) {
    try {
        $pdo = new PDO("sqlite:" . $db_path);
        // Включаем выброс исключений
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // УЯЗВИМОСТЬ: Прямая вставка $id без кавычек
        $sql = "SELECT name, category, price FROM sqli_union WHERE id = $id"; 
        
        $stmt = $pdo->query($sql);

        if ($stmt) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                // Товар найден
                $product_data = $row;
                $status_class = "success";
            } else {
                // Запрос отработал, но пусто
                $message = "Такого продукта нет на складе.";
                $status_class = "error";
            }
        }
    } catch (PDOException $e) {
        // Как и в примере, скрываем ошибки синтаксиса от студента
        $message = "Такого продукта нет на складе.";
        $status_class = "error";
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Лаба 2: Склад запчастей | Union SQLi Lab</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #2c3e50; color: #ecf0f1; max-width: 600px; margin: 50px auto; padding: 20px; }
        .terminal { background-color: #1a252f; padding: 30px; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); border: 1px solid #34495e; }
        h2 { color: #3498db; margin-top: 0; border-bottom: 2px solid #34495e; padding-bottom: 10px; }
        .input-group { margin-top: 20px; display: flex; }
        input[type="text"] { flex-grow: 1; padding: 12px; font-family: 'Courier New', Courier, monospace; font-size: 16px; background: #ecf0f1; border: none; border-radius: 4px 0 0 4px; outline: none; }
        button { padding: 12px 25px; background-color: #3498db; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 0 4px 4px 0; transition: 0.3s; }
        button:hover { background-color: #2980b9; }
        .result-box { margin-top: 25px; padding: 15px; border-radius: 4px; font-weight: bold; }
        .result-box.success { background-color: rgba(46, 204, 113, 0.2); border-left: 5px solid #2ecc71; color: #2ecc71; }
        .result-box.error { background-color: rgba(231, 76, 60, 0.2); border-left: 5px solid #e74c3c; color: #e74c3c; }
        .product-detail { margin-top: 10px; font-weight: normal; font-size: 14px; }
        .help-text { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: right; }
    </style>
</head>
<body>
    <div class="terminal">
        <h2>[Проверка наличия товара v2.0]</h2>
        <p>Введите идентификатор (ID) товара для просмотра данных:</p>
        
        <form method="GET">
            <div class="input-group">
                <input type="text" name="id" placeholder="ID товара (например, 1)" required value="<?php echo htmlspecialchars($id); ?>">
                <button type="submit">CHECK</button>
            </div>
        </form>

        <?php if ($id): ?>
            <div class="result-box <?php echo $status_class; ?>">
                > Результат запроса: <br>
                <?php if ($product_data): ?>
                    <div class="product-detail">
                        <strong>Название:</strong> <?php echo htmlspecialchars($product_data['name']); ?><br>
                        <strong>Категория:</strong> <?php echo htmlspecialchars($product_data['category']); ?><br>
                        <strong>Цена:</strong> <?php echo htmlspecialchars($product_data['price']); ?> $
                    </div>
                <?php else: ?>
                    <?php echo $message; ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <div class="help-text">
            * Доступ к системе только для авторизованного персонала SOC.
        </div>
    </div>
</body>
</html>