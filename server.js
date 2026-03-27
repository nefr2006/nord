const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8008;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// ==================== БАЗА ДАННЫХ ====================
const db = new sqlite3.Database('./nord.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Подключено к SQLite базе данных');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS menu (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER,
            category TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS reservations (
            id TEXT PRIMARY KEY,
            guest_name TEXT NOT NULL,
            guest_phone TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            guests_count INTEGER DEFAULT 2,
            reservation_date TEXT NOT NULL,
            reservation_time TEXT NOT NULL,
            comment TEXT,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            visits_count INTEGER DEFAULT 0,
            first_visit TIMESTAMP,
            last_visit TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
            if (!row) {
                const adminPass = process.env.ADMIN_PASSWORD || 'nord2026';
                db.run("INSERT INTO admins (username, password) VALUES ('admin', ?)", [adminPass]);
                console.log('👑 Создан администратор: admin / ' + adminPass);
            }
        });

        db.get("SELECT COUNT(*) as count FROM menu", (err, row) => {
            if (row && row.count === 0) {
                const items = [
                    // Кофе
                    ['Эспрессо', 'Крепкий классический эспрессо из зёрен арабики', 180, 'coffee', 'espresso.jpg'],
                    ['Капучино', 'Нежный капучино с бархатистой молочной пенкой', 260, 'coffee', 'cappuccino.jpg'],
                    ['Латте', 'Мягкий кофе с большим количеством молока', 280, 'coffee', 'latte.jpg'],
                    ['Флэт уайт', 'Двойной эспрессо с небольшим количеством молока', 290, 'coffee', 'flat_white.jpg'],
                    ['Раф кофе', 'Кофе со сливками и ванильным сахаром', 320, 'coffee', 'raf.jpg'],
                    ['Американо', 'Эспрессо разбавленный горячей водой', 200, 'coffee', 'americano.jpg'],
                    // Десерты
                    ['Тирамису', 'Классический итальянский десерт с маскарпоне', 380, 'dessert', 'tiramisu.jpg'],
                    ['Брауни', 'Тёплый шоколадный брауни со шариком мороженого', 340, 'dessert', 'brownie.jpg'],
                    ['Чизкейк нью-йорк', 'Нью-йоркский чизкейк с ягодным соусом', 360, 'dessert', 'cheesecake.jpg'],
                    ['Вафли с мороженым', 'Бельгийские вафли с шариком ванильного мороженого', 390, 'dessert', 'waffles.jpg'],
                    // Завтраки
                    ['Яйца бенедикт', 'Яйца пашот с голландским соусом на тосте', 480, 'breakfast', 'eggs_benedict.jpg'],
                    ['Авокадо тост', 'Тост с авокадо, яйцом пашот и микрозеленью', 420, 'breakfast', 'avocado_toast.jpg'],
                    ['Сырники со сметаной', 'Пышные творожные сырники со свежими ягодами', 360, 'breakfast', 'syrniki.jpg'],
                    ['Гранола с йогуртом', 'Домашняя гранола с греческим йогуртом и ягодами', 320, 'breakfast', 'granola.jpg'],
                    // Напитки
                    ['Матча латте', 'Японский зелёный чай матча с молоком', 300, 'drinks', 'matcha.jpg'],
                    ['Какао', 'Насыщенное какао на молоке с маршмеллоу', 260, 'drinks', 'cocoa.jpg'],
                    ['Апельсиновый фреш', 'Свежевыжатый апельсиновый сок', 280, 'drinks', 'orange_juice.jpg'],
                    ['Чай ассам', 'Крепкий индийский чай в чайнике', 220, 'drinks', 'tea.jpg'],
                    // Закуски
                    ['Круассан с лососем', 'Маслянистый круассан с лососем и сливочным сыром', 420, 'snacks', 'croissant_salmon.jpg'],
                    ['Сэндвич с индейкой', 'Сэндвич с индейкой, авокадо и свежими овощами', 380, 'snacks', 'sandwich.jpg'],
                    ['Брускетта томат', 'Хрустящий хлеб с томатами и базиликом', 290, 'snacks', 'bruschetta.jpg'],
                    ['Суп дня', 'Суп по рецепту шефа, уточняйте у официанта', 320, 'snacks', 'soup.jpg'],
                    // Торты
                    ['Медовик', 'Нежный медовый торт со сметанным кремом', 350, 'cakes', 'medovik.jpg'],
                    ['Морковный торт', 'Классический морковный торт с кремом чиз', 370, 'cakes', 'carrot_cake.jpg'],
                    ['Шоколадный фондан', 'Горячий шоколадный кекс с жидкой начинкой', 420, 'cakes', 'fondant.jpg'],
                ];
                const stmt = db.prepare("INSERT INTO menu (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)");
                items.forEach(p => stmt.run(p));
                stmt.finalize();
                console.log('☕ Добавлено меню');
            }
        });

        console.log('✅ База данных инициализирована');
    });
}

// ==================== API ====================

// 1. Меню
app.get('/api/menu', (req, res) => {
    db.all("SELECT * FROM menu ORDER BY id", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Создать бронь
app.post('/api/reservations', (req, res) => {
    const { guest_name, guest_phone, guest_email, guests_count, reservation_date, reservation_time, comment } = req.body;

    if (!guest_name || !guest_phone || !guest_email || !reservation_date || !reservation_time) {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const resId = 'NORD-' + Date.now();
    const createdAt = new Date().toISOString();

    db.run(
        `INSERT INTO reservations (id, guest_name, guest_phone, guest_email, guests_count, reservation_date, reservation_time, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [resId, guest_name, guest_phone, guest_email, guests_count || 2, reservation_date, reservation_time, comment || '', createdAt],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });

            db.get("SELECT * FROM guests WHERE email = ?", [guest_email], (err, guest) => {
                if (guest) {
                    db.run(
                        `UPDATE guests SET visits_count = visits_count + 1, last_visit = ? WHERE email = ?`,
                        [createdAt, guest_email]
                    );
                } else {
                    db.run(
                        `INSERT INTO guests (name, phone, email, visits_count, first_visit, last_visit) VALUES (?, ?, ?, 1, ?, ?)`,
                        [guest_name, guest_phone, guest_email, createdAt, createdAt]
                    );
                }
            });

            res.json({ success: true, resId });
        }
    );
});

// 3. Все брони
app.get('/api/reservations', (req, res) => {
    const { status } = req.query;
    let query = "SELECT * FROM reservations";
    const params = [];

    if (status && status !== 'all') {
        query += " WHERE status = ?";
        params.push(status);
    }
    query += " ORDER BY created_at DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. Обновить статус брони
app.put('/api/reservations/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['new', 'confirmed', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Некорректный статус' });
    }

    db.run("UPDATE reservations SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Бронь не найдена' });
        res.json({ success: true });
    });
});

// 5. Все гости
app.get('/api/guests', (req, res) => {
    db.all("SELECT * FROM guests ORDER BY last_visit DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 6. Авторизация
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, admin) => {
        if (err) return res.status(500).json({ error: err.message });
        if (admin) {
            res.json({ success: true, user: { username: admin.username } });
        } else {
            res.status(401).json({ error: 'Неверные логин или пароль' });
        }
    });
});

// 7. Статистика
app.get('/api/stats', (req, res) => {
    db.get("SELECT COUNT(*) as total_res FROM reservations", (err, resStats) => {
        db.get("SELECT COUNT(*) as total_guests FROM guests", (err2, guestStats) => {
            db.get("SELECT COUNT(*) as new_res FROM reservations WHERE status = 'new'", (err3, newRes) => {
                db.get("SELECT COUNT(*) as today_res FROM reservations WHERE date(created_at) = date('now')", (err4, todayRes) => {
                    res.json({
                        total_reservations: resStats.total_res || 0,
                        total_guests: guestStats.total_guests || 0,
                        new_reservations: newRes.new_res || 0,
                        today_reservations: todayRes.today_res || 0
                    });
                });
            });
        });
    });
});

// 8. Экспорт CSV
app.get('/api/export/reservations', (req, res) => {
    db.all("SELECT * FROM reservations ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let csv = 'ID,Имя,Телефон,Email,Гостей,Дата,Время,Комментарий,Статус,Создано\n';
        rows.forEach(r => {
            csv += `"${r.id}","${r.guest_name}","${r.guest_phone}","${r.guest_email}",${r.guests_count},"${r.reservation_date}","${r.reservation_time}","${r.comment || ''}","${r.status}","${r.created_at}"\n`;
        });

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', 'attachment; filename="reservations_export.csv"');
        res.send('\uFEFF' + csv);
    });
});

// ==================== СТАТИЧЕСКИЕ МАРШРУТЫ ====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ==================== ЗАПУСК ====================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Сайт:    http://localhost:${PORT}/`);
    console.log(`🔧 Админка: http://localhost:${PORT}/admin.html`);
    console.log('='.repeat(50));
});
