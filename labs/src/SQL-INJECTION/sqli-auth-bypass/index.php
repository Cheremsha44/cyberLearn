<?php
// Путь к файлу базы данных внутри контейнера (мы его прокинули через Binds в Node.js)
$db_path = '/var/www/html/database.sqlite';

$db_error = '';
$login_status = '';
$login_message = '';
$flag = '';

try {
    // Подключаемся к SQLite
    $pdo = new PDO("sqlite:" . $db_path);
    // Включаем вывод ошибок (для CTF это полезно, чтобы студент видел синтаксис при ошибке)
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Обработка формы
    if (isset($_POST['username']) && isset($_POST['password'])) {
        $username = $_POST['username'];
        $password = $_POST['password'];

        $query = "SELECT * FROM sqli_auth_bypass WHERE username = '$username' AND password = '$password'";
        
        $stmt = $pdo->query($query);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $login_status = 'success';
            
            // Если студент смог зайти под админом (например, введя username: admin' -- ), он увидит флаг
            if ($user['username'] === 'admin') {
                $login_message = "Добро пожаловать, Administrator.";
                $flag = $user['password'];
            } else {
                $login_message = "Добро пожаловать, " . htmlspecialchars($user['username']) . ". У тебя нет прав для просмотра флага.";
            }
        } else {
            $login_status = 'error';
            $login_message = "Неверный логин или пароль.";
        }
    }
} catch (PDOException $e) {
    // Сохраняем ошибку для вывода в интерфейсе
    $db_error = $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Authentication Bypass Lab</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #2c3e50; color: #ecf0f1; max-width: 450px; margin: 60px auto; padding: 20px; }
        .terminal { background-color: #1a252f; padding: 30px; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.5); border: 1px solid #34495e; }
        h2 { color: #3498db; margin-top: 0; border-bottom: 2px solid #34495e; padding-bottom: 10px; text-align: center; }
        
        form { margin-top: 20px; }
        label { display: block; margin-top: 15px; color: #95a5a6; font-size: 14px; }
        input[type="text"], input[type="password"] { width: 100%; box-sizing: border-box; padding: 12px; margin-top: 5px; font-family: 'Courier New', Courier, monospace; font-size: 16px; background: #ecf0f1; border: none; border-radius: 4px; outline: none; }
        button { margin-top: 25px; width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; font-weight: bold; font-family: 'Courier New', Courier, monospace; font-size: 16px; cursor: pointer; border-radius: 4px; transition: 0.3s; }
        button:hover { background-color: #2980b9; }

        .result-box { margin-bottom: 20px; padding: 15px; border-radius: 4px; font-weight: bold; font-size: 14px; }
        .result-box.success { background-color: rgba(46, 204, 113, 0.2); border-left: 5px solid #2ecc71; color: #2ecc71; }
        .result-box.error { background-color: rgba(231, 76, 60, 0.2); border-left: 5px solid #e74c3c; color: #e74c3c; }
        .result-box.warning { background-color: rgba(241, 196, 15, 0.2); border-left: 5px solid #f1c40f; color: #f1c40f; }
        
        .flag { display: block; margin-top: 10px; padding: 10px; background: #1a252f; border: 1px dashed #2ecc71; color: #2ecc71; text-align: center; word-break: break-all; }
        .help-text { font-size: 12px; color: #7f8c8d; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="terminal">
        <h2>[AUTH TERMINAL]</h2>

        <?php if ($db_error): ?>
            <div class="result-box warning">
                > СИСТЕМНАЯ ОШИБКА SQL: <br>
                <span style="font-weight: normal; color: #ecf0f1;"><?php echo htmlspecialchars($db_error); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($login_status === 'success'): ?>
            <div class="result-box success">
                > УСПЕШНАЯ АВТОРИЗАЦИЯ <br>
                <span style="font-weight: normal; color: #ecf0f1;"><?php echo htmlspecialchars($login_message); ?></span>
                
                <?php if ($flag): ?>
                    <div class="flag">Твой флаг: <?php echo htmlspecialchars($flag); ?></div>
                <?php endif; ?>
            </div>
        <?php elseif ($login_status === 'error'): ?>
            <div class="result-box error">
                > ДОСТУП ЗАПРЕЩЕН <br>
                <span style="font-weight: normal; color: #ecf0f1;"><?php echo htmlspecialchars($login_message); ?></span>
            </div>
        <?php endif; ?>

        <?php if (!$flag): ?>
            <form method="POST">
                <label>> Username:</label>
                <input type="text" name="username" placeholder="admin" required value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">
                
                <label>> Password:</label>
                <input type="password" name="password" required>
                
                <button type="submit">LOGIN</button>
            </form>
        <?php endif; ?>

        <div class="help-text">
            * Unauthorized access is strictly prohibited.
        </div>
    </div>
</body>
</html>