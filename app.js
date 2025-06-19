// Функция для поиска URL по ключевому слову
const search = () => {
    const keyword = document.getElementById('keyword').value;

    // Проверка, если ключевое слово пустое
    if (!keyword) {
        alert("Please enter a keyword.");
        return;
    }

    // Отправляем запрос на сервер для получения списка URL
    fetch(`http://localhost:3000/keywords/${keyword}`)
        .then(response => response.json())
        .then(urls => {
            const urlsList = document.getElementById('urls-list');
            urlsList.innerHTML = ''; // Очищаем список перед новым отображением

            if (urls.length === 0) {
                urlsList.innerHTML = 'No URLs found for this keyword.';
            } else {
                // Отображаем список URL
                urls.forEach(url => {
                    const urlItem = document.createElement('div');
                    urlItem.classList.add('url-item');
                    urlItem.innerHTML = url;
                    urlItem.onclick = () => downloadContent(url);
                    urlsList.appendChild(urlItem);
                });
            }
        })
        .catch(error => alert('Error fetching URLs: ' + error));
};

// Функция для скачивания контента по выбранному URL
const downloadContent = (url) => {
    const statusDiv = document.getElementById('download-status');
    statusDiv.innerHTML = 'Downloading...';

    // Запрашиваем контент с сервера
    fetch(`http://localhost:3000/download?url=${url}`)
        .then(response => {
            // Получаем данные с прогрессом
            const reader = response.body.getReader();
            const contentLength = response.headers.get('Content-Length');
            let receivedLength = 0; // Текущий прогресс

            const progress = (chunk) => {
                receivedLength += chunk.length;
                const percentage = Math.floor((receivedLength / contentLength) * 100);
                statusDiv.innerHTML = `Downloaded ${receivedLength} bytes of ${contentLength} bytes (${percentage}%)`;

                // Прогресс загрузки
                if (receivedLength < contentLength) {
                    reader.read().then(({ done, value }) => {
                        if (done) return;
                        progress(value);
                    });
                } else {
                    statusDiv.innerHTML = "Download complete!";
                    // Сохраняем данные в LocalStorage
                    saveToLocalStorage(url, chunk);
                }
            };

            reader.read().then(({ done, value }) => {
                if (!done) {
                    progress(value);
                }
            });
        })
        .catch(error => {
            statusDiv.innerHTML = `Download failed: ${error}`;
        });
};

// Функция для сохранения контента в LocalStorage
const saveToLocalStorage = (url, data) => {
    // Преобразуем данные в строку (например, в JSON)
    const content = new TextDecoder().decode(data);
    localStorage.setItem(url, content);

    // Обновляем список загруженного контента
    updateContentList();
};

// Функция для отображения списка загруженного контента
const updateContentList = () => {
    const contentList = document.getElementById('content-list');
    contentList.innerHTML = ''; // Очищаем список перед новым отображением

    // Получаем все ключи (URL) из LocalStorage
    const keys = Object.keys(localStorage);

    if (keys.length === 0) {
        contentList.innerHTML = 'No content downloaded yet.';
    } else {
        keys.forEach(key => {
            const contentItem = document.createElement('div');
            contentItem.classList.add('content-item');
            contentItem.innerHTML = key;
            contentItem.onclick = () => showContent(key);
            contentList.appendChild(contentItem);
        });
    }
};

// Функция для отображения выбранного контента
const showContent = (url) => {
    const content = localStorage.getItem(url);
    alert(content); // Выводим контент (можно заменить на более красивое отображение)
};

// Инициализируем отображение загруженного контента при загрузке страницы
window.onload = updateContentList;
