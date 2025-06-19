const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Раздаём папку public
app.use(express.static(path.join(__dirname, 'public')));

// --- Словарь ключевых слов ---
const keywords = {
  nodejs: [
    "https://nodejs.org",
    "https://www.digitalocean.com/community/tutorials/what-is-node-js"
  ],
  javascript: [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "https://www.javascript.info/"
  ],
  python: [
    "https://www.python.org",
    "https://docs.python.org/3/"
  ]
};

// --- Эндпоинт: поиск по ключевому слову ---
app.post('/search', (req, res) => {
  const keyword = req.body.keyword?.toLowerCase();
  if (keywords[keyword]) {
    res.json({ urls: keywords[keyword] });
  } else {
    res.status(404).json({ error: "Ключевое слово не найдено" });
  }
});

// --- Функция загрузки с поддержкой редиректов ---
function fetchWithRedirects(url, callback, depth = 0) {
  if (depth > 5) {
    return callback(new Error('Слишком много перенаправлений'));
  }

  https.get(url, (response) => {
    const statusCode = response.statusCode;
    const location = response.headers.location;

    if (statusCode >= 300 && statusCode < 400 && location) {
      // Обработка редиректа
      const redirectUrl = location.startsWith('http')
        ? location
        : new URL(location, url).href;
      console.log(`Redirecting to: ${redirectUrl}`);
      fetchWithRedirects(redirectUrl, callback, depth + 1);
    } else {
      let data = '';
      let loaded = 0;

      response.on('data', chunk => {
        data += chunk;
        loaded += chunk.length;
      });

      response.on('end', () => {
        callback(null, { data, size: loaded });
      });

      response.on('error', err => callback(err));
    }
  }).on('error', err => callback(err));
}

// --- Эндпоинт: загрузка контента по URL ---
app.post('/download', (req, res) => {
  const url = req.body.url;

  if (!url || !url.startsWith('https://')) {
    return res.status(400).json({ error: "Неверный или пустой URL. Только HTTPS поддерживается." });
  }

  fetchWithRedirects(url, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка загрузки: ' + err.message });
    }

    res.json({
      status: 'Готово',
      size: `${result.size} байт`,
      progress: '100%',
      content: result.data
    });
  });
});

// --- SPA fallback: отдаём index.html ---
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Запуск сервера ---
app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
});


