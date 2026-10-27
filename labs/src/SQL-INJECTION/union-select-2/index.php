<?php
// Подключаемся к локальному файлу SQLite
$db_path = '/var/www/html/database.sqlite';

$id = $_GET['id'] ?? '';
$error = "";
$products = [];

if ($id) {
    try {
        $pdo = new PDO("sqlite:" . $db_path);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // УЯЗВИМЫЙ ЗАПРОС
        // Порядок колонок: 1. String (name), 2. Int (stock), 3. Decimal (price)
        $sql = "SELECT name, stock_count, price FROM sqli_union_2_products WHERE id = $id";
        
        $stmt = $pdo->query($sql);
        
        if ($stmt) {
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } catch (PDOException $e) {
        // ВАЖНО: В этой лабе мы ВЫВОДИМ ошибку SQL студенту!
        $error = $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Характеристики товара - Склад v2</title>
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
        .product-item { margin-top: 15px; padding-bottom: 15px; border-bottom: 1px dashed #34495e; font-weight: normal; }
        .product-item:last-child { border-bottom: none; padding-bottom: 0; }
        .price { color: #38bdf8; font-weight: bold; }
        .stock { color: #94a3b8; font-size: 14px; }
        .help-text { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: right; }
    </style>
</head>
<body>
    <div class="terminal">
        <h2>[Система складского учета v2.1.0]</h2>
        <p>Получение характеристик и остатков товара по ID:</p>
        
        <form method="GET">
            <div class="input-group">
                <input type="text" name="id" placeholder="ID товара (например, 1)" required value="<?php echo htmlspecialchars($id); ?>">
                <button type="submit">CHECK</button>
            </div>
        </form>

        <?php if ($error): ?>
            <div class="result-box error">
                > СИСТЕМНАЯ ОШИБКА SQL: <br>
                <span style="font-weight: normal;"><?php echo htmlspecialchars($error); ?></span>
            </div>
        <?php elseif ($id): ?>
            <div class="result-box <?php echo count($products) > 0 ? 'success' : 'error'; ?>">
                > Результат запроса: <br>
                
                <?php if (count($products) > 0): ?>
                    <?php foreach ($products as $row): ?>
                        <div class="product-item">
                            <strong style="font-size: 18px;"><?php echo htmlspecialchars($row['name']); ?></strong><br>
                            <span class="stock">Остаток на складе: <strong><?php echo htmlspecialchars($row['stock_count']); ?></strong> шт.</span><br>
                            <span class="price">Цена: <?php echo htmlspecialchars($row['price']); ?> $</span>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    Товар с таким ID не найден.
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <div class="help-text">
            * Experimental Build. Возможны нестабильности в работе БД.
        </div>
    </div>
</body>
</html>