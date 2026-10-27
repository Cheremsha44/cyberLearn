<?php
// Подключаемся к локальному файлу SQLite
$db_path = '/var/www/html/database.sqlite';
$products = [];
$category_input = $_GET['category'] ?? '';
$db_error = '';

try {
    $pdo = new PDO("sqlite:" . $db_path);
    // Включаем выброс исключений для красивого вывода ошибок БД
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($category_input) {
        // УЯЗВИМОСТЬ: Прямая вставка переменной в кавычках
        // Фильтр is_relized = 1 скрывает невыпущенные товары (где лежит флаг)
        $sql = "SELECT name, category, price, secret_key FROM sqli_hidden_data WHERE category = '$category_input' AND is_relized = 1";
        
        $stmt = $pdo->query($sql);
        if ($stmt) {
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
} catch (PDOException $e) {
    $db_error = $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Каталог товаров | Hidden Data Lab</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #2c3e50; color: #ecf0f1; max-width: 800px; margin: 40px auto; padding: 20px; }
        .terminal { background-color: #1a252f; padding: 30px; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); border: 1px solid #34495e; }
        h2 { color: #3498db; margin-top: 0; border-bottom: 2px solid #34495e; padding-bottom: 10px; }
        
        .nav-links { margin-bottom: 25px; padding: 15px; background: #2c3e50; border-radius: 5px; border: 1px solid #34495e; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .nav-links span { color: #7f8c8d; }
        .nav-links a { text-decoration: none; padding: 8px 15px; background: #1a252f; color: #3498db; border-radius: 4px; font-weight: bold; border: 1px solid #34495e; transition: 0.3s; }
        .nav-links a:hover { background: #3498db; color: white; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px dashed #34495e; }
        th { color: #3498db; border-bottom: 2px solid #34495e; }
        tr:hover { background-color: rgba(52, 152, 219, 0.05); }
        
        .result-box { margin-bottom: 20px; padding: 15px; border-radius: 4px; font-weight: bold; }
        .result-box.error { background-color: rgba(231, 76, 60, 0.2); border-left: 5px solid #e74c3c; color: #e74c3c; }
        
        .flag-row { background-color: rgba(46, 204, 113, 0.1) !important; color: #2ecc71; font-weight: bold; }
        .help-text { font-size: 12px; color: #7f8c8d; margin-top: 30px; text-align: right; }
    </style>
</head>
<body>
    <div class="terminal">
        <h2>[База комплектующих оборудования]</h2>
        
        <div class="nav-links">
            <span>> Выберите категорию: </span>
            <a href="?category=Processors">Процессоры</a>
            <a href="?category=GPU">Видеокарты</a>
            <a href="?category=Motherboards">Материнские платы</a>
        </div>

        <?php if ($db_error): ?>
            <div class="result-box error">
                > СИСТЕМНАЯ ОШИБКА SQL: <br>
                <span style="font-weight: normal;"><?php echo htmlspecialchars($db_error); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($category_input && !$db_error): ?>
            <h3 style="color: #95a5a6;">> Поиск по категории: <?php echo htmlspecialchars($category_input); ?></h3>
            
            <?php if (!empty($products)): ?>
                <table>
                    <tr>
                        <th>Название</th>
                        <th>Категория</th>
                        <th>Цена</th>
                        <th>Доп. инфа</th>
                    </tr>
                    <?php foreach ($products as $p): ?>
                        <?php 
                        // Подсвечиваем строку зеленым, если юзер смог вытащить флаг
                        $is_flag = strpos($p['secret_key'] ?? '', 'flag{') !== false; 
                        ?>
                        <tr class="<?php echo $is_flag ? 'flag-row' : ''; ?>">
                            <td><?php echo htmlspecialchars($p['name']); ?></td>
                            <td><?php echo htmlspecialchars($p['category']); ?></td>
                            <td>$<?php echo htmlspecialchars($p['price']); ?></td>
                            <td><?php echo htmlspecialchars($p['secret_key']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php else: ?>
                <p style="color: #e74c3c;">> В этой категории пока нет доступных товаров.</p>
            <?php endif; ?>
            
        <?php elseif (!$category_input && !$db_error): ?>
            <p style="color: #7f8c8d;">> Ожидание ввода пользователя...</p>
        <?php endif; ?>

        <div class="help-text">
            * Скрытые товары (is_relized=0) не отображаются в стандартной выдаче.
        </div>
    </div>
</body>
</html>