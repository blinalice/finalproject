document.getElementById('searchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('keyword').value.trim();
    fetch('http://localhost:3000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.urls) {
            const urlList = document.getElementById('urlList');
            urlList.innerHTML = '';
            data.urls.forEach(url => {
                const li = document.createElement('li');
                li.textContent = url;
                li.onclick = () => downloadContent(url);
                urlList.appendChild(li);
            });
            document.getElementById('urls-list').style.display = 'block';
        } else {
            alert(data.error);
        }
    })
    .catch(err => alert('Ошибка поиска: ' + err.message));
});

function downloadContent(url) {
    document.getElementById('download-status').style.display = 'block';
    document.getElementById('status').textContent = 'Загрузка...';
    document.getElementById('progress').textContent = '0%';

    fetch('http://localhost:3000/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        // Сохраняем контент в LocalStorage
        const saved = JSON.parse(localStorage.getItem('downloadedContent') || '{}');
        saved[url] = data.content;
        localStorage.setItem('downloadedContent', JSON.stringify(saved));

        document.getElementById('status').textContent = `Статус: ${data.status}, Размер: ${data.size}`;
        document.getElementById('progress').textContent = data.progress;
        document.getElementById('content').style.display = 'block';
        document.getElementById('contentView').textContent = data.content;

        updateSavedList();
    })
    .catch(err => alert('Ошибка загрузки: ' + err.message));
}

// Отображение сохранённых данных
function updateSavedList() {
    const saved = JSON.parse(localStorage.getItem('downloadedContent') || '{}');
    const list = document.getElementById('savedList');
    const view = document.getElementById('savedView');

    list.innerHTML = '<option value="">Выбери сохранённый URL</option>';

    for (const url in saved) {
        const option = document.createElement('option');
        option.value = url;
        option.textContent = url;
        list.appendChild(option);
    }

    list.onchange = () => {
        const url = list.value;
        view.textContent = saved[url] || '';
    };
}

window.addEventListener('DOMContentLoaded', updateSavedList);

