document.addEventListener('DOMContentLoaded', () => {
  // 1. Инициализация системных часов
  const sysClock = document.getElementById('sys-clock');
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour12: false });
    sysClock.textContent = timeString;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Настройка URL вашего Google Apps Script:
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7zBxJVKDtAhYBZ6eiIm5qzS9CBButktQsmz7wgOB-_7-pvyeuccA_4IsT4wHC_jHiVg/exec';

  // Состояние админки
  let sessionToken = '';
  let siteData = {};

  const loginScreen = document.getElementById('login-screen');
  const adminDashboard = document.getElementById('admin-dashboard');
  const loginBtn = document.getElementById('login-btn');
  const loginStatus = document.getElementById('login-status');
  const saveAllBtn = document.getElementById('save-all-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const dashboardStatus = document.getElementById('dashboard-status');

  // Элементы редактора
  const editSubtitle = document.getElementById('edit-subtitle');
  const blogEditorList = document.getElementById('blog-editor-list');
  const softwareEditorList = document.getElementById('software-editor-list');
  const gamesEditorList = document.getElementById('games-editor-list');
  const readBooksEditorList = document.getElementById('read-books-editor-list');
  const myBooksEditorList = document.getElementById('my-books-editor-list');

  // Кнопки добавления
  const addBlogBtn = document.getElementById('add-blog-btn');
  const addSoftwareBtn = document.getElementById('add-software-btn');
  const addGameBtn = document.getElementById('add-game-btn');
  const addReadBookBtn = document.getElementById('add-read-book-btn');
  const addMyBookBtn = document.getElementById('add-my-book-btn');

  // --- ЛОГИКА АВТОРИЗАЦИИ ---

  loginBtn.addEventListener('click', async () => {
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!usernameInput || !passwordInput) {
      loginStatus.textContent = '❌ Введите логин и пароль!';
      return;
    }

    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('ВАШ_ИДЕНТИФИКАТОР_СКРИПТА')) {
      loginStatus.textContent = '❌ Настройте GOOGLE_APPS_SCRIPT_URL в файле anti/admin.js!';
      return;
    }

    loginStatus.textContent = '⚡ Проверка...';
    loginStatus.style.color = '#333';

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          username: usernameInput,
          password: passwordInput
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        sessionToken = result.token;
        siteData = result.site_data;
        
        // Переключение экрана
        loginScreen.style.display = 'none';
        adminDashboard.classList.add('active');
        
        loginStatus.textContent = '';
        dashboardStatus.textContent = '🔑 Успешно авторизовано.';
        dashboardStatus.style.color = '#2e7d32';
        
        // Инициализируем поля формы данными
        initDashboardFields();
      } else if (result.status === 'locked') {
        loginStatus.textContent = `❌ ${result.message}`;
        loginStatus.style.color = '#c62828';
      } else {
        loginStatus.textContent = `❌ ${result.message || 'Неверный логин или пароль.'}`;
        loginStatus.style.color = '#c62828';
      }
    } catch (error) {
      console.error(error);
      loginStatus.textContent = `❌ Системная ошибка соединения: ${error.message}`;
      loginStatus.style.color = '#c62828';
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionToken = '';
    siteData = {};
    adminDashboard.classList.remove('active');
    loginScreen.style.display = 'flex';
    document.getElementById('password').value = '';
    dashboardStatus.textContent = '';
  });

  // --- ИНИЦИАЛИЗАЦИЯ И РЕНДЕРИНГ ФОРМ РЕДАКТОРА ---

  function initDashboardFields() {
    // Подзаголовок
    editSubtitle.value = siteData.profile?.subtitle || '';

    // Рендер разделов
    renderBlogEditor();
    renderSoftwareEditor();
    renderGamesEditor();
    renderBooksEditor('read', readBooksEditorList);
    renderBooksEditor('mine', myBooksEditorList);
  }

  // Редактор блога
  function renderBlogEditor() {
    blogEditorList.innerHTML = '';
    if (!siteData.blog) siteData.blog = [];

    siteData.blog.forEach((post, index) => {
      const row = document.createElement('div');
      row.className = 'row-editor';
      const mediaType = post.mediaType || (post.image ? 'image' : 'none');
      const mediaUrl = post.mediaUrl || post.image || '';

      row.innerHTML = `
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Дата публикации:</label>
          <input type="text" class="admin-input blog-date" value="${post.date || ''}" placeholder="Например: 09 июля 2026 г.">
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Тип медиафайла:</label>
          <select class="admin-input blog-media-type" style="padding: 6px;">
            <option value="none" ${mediaType === 'none' ? 'selected' : ''}>Нет (только текст)</option>
            <option value="image" ${mediaType === 'image' ? 'selected' : ''}>Изображение (Имя файла или URL)</option>
            <option value="youtube" ${mediaType === 'youtube' ? 'selected' : ''}>YouTube (Ссылка или ID видео)</option>
            <option value="rutube" ${mediaType === 'rutube' ? 'selected' : ''}>Rutube (Ссылка или ID видео)</option>
            <option value="vk" ${mediaType === 'vk' ? 'selected' : ''}>VK Video (Встраиваемый URL-адрес iframe)</option>
          </select>
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Ссылка / Имя файла медиа:</label>
          <input type="text" class="admin-input blog-media-url" value="${mediaUrl}" placeholder="Например: photo.jpg или https://vk.com/video_ext.php?...">
        </div>
        <div class="admin-group">
          <label>Текст поста:</label>
          <textarea class="admin-textarea blog-text" placeholder="Текст сообщения...">${post.text || ''}</textarea>
        </div>
        <div class="row-editor-controls">
          <button class="classic-button danger-button delete-row-btn" data-index="${index}" data-type="blog">Удалить</button>
        </div>
      `;
      blogEditorList.appendChild(row);
    });

    bindDeleteButtons();
  }

  // Редактор ПО
  function renderSoftwareEditor() {
    softwareEditorList.innerHTML = '';
    if (!siteData.software) siteData.software = [];

    siteData.software.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'row-editor';
      row.innerHTML = `
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Название ПО:</label>
          <input type="text" class="admin-input soft-title" value="${item.title || ''}">
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Язык программирования:</label>
          <input type="text" class="admin-input soft-lang" value="${item.lang || ''}" placeholder="C# / .NET">
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Описание:</label>
          <textarea class="admin-textarea soft-desc">${item.description || ''}</textarea>
        </div>
        <div class="admin-group">
          <label>Теги (через запятую):</label>
          <input type="text" class="admin-input soft-tags" value="${item.tags ? item.tags.join(', ') : ''}" placeholder="КриптоПро CSP, Подпись">
        </div>
        <div class="row-editor-controls">
          <button class="classic-button danger-button delete-row-btn" data-index="${index}" data-type="software">Удалить</button>
        </div>
      `;
      softwareEditorList.appendChild(row);
    });

    bindDeleteButtons();
  }

  // Редактор Игр
  function renderGamesEditor() {
    gamesEditorList.innerHTML = '';
    if (!siteData.games) siteData.games = [];

    siteData.games.forEach((game, index) => {
      const row = document.createElement('div');
      row.className = 'row-editor';
      row.innerHTML = `
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Название игры:</label>
          <input type="text" class="admin-input game-title" value="${game.title || ''}">
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Описание:</label>
          <textarea class="admin-textarea game-desc">${game.description || ''}</textarea>
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Статус:</label>
          <input type="text" class="admin-input game-status" value="${game.status || ''}" placeholder="В разработке">
        </div>
        <div class="admin-group">
          <label>Жанр:</label>
          <input type="text" class="admin-input game-genre" value="${game.genre || ''}" placeholder="Симулятор">
        </div>
        <div class="row-editor-controls">
          <button class="classic-button danger-button delete-row-btn" data-index="${index}" data-type="games">Удалить</button>
        </div>
      `;
      gamesEditorList.appendChild(row);
    });

    bindDeleteButtons();
  }

  // Редактор Книг (Прочитанные / Мои)
  function renderBooksEditor(subKey, container) {
    container.innerHTML = '';
    if (!siteData.books) siteData.books = { read: [], mine: [] };
    if (!siteData.books[subKey]) siteData.books[subKey] = [];

    siteData.books[subKey].forEach((book, index) => {
      const row = document.createElement('div');
      row.className = 'row-editor';
      row.innerHTML = `
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Название книги:</label>
          <input type="text" class="admin-input book-title" value="${book.title || ''}">
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Автор:</label>
          <input type="text" class="admin-input book-author" value="${book.author || ''}">
        </div>
        <div class="admin-group" style="margin-bottom: 5px;">
          <label>Оценка (звезды):</label>
          <input type="text" class="admin-input book-rating" value="${book.rating || '☆☆☆☆☆'}" placeholder="★★★★★ или ☆☆☆☆☆">
        </div>
        <div class="admin-group">
          <label>Мой отзыв / Заметки:</label>
          <input type="text" class="admin-input book-review" value="${book.review || ''}">
        </div>
        <div class="row-editor-controls">
          <button class="classic-button danger-button delete-row-btn" data-index="${index}" data-type="books-${subKey}">Удалить</button>
        </div>
      `;
      container.appendChild(row);
    });

    bindDeleteButtons();
  }

  // Обработчик кнопок удаления
  function bindDeleteButtons() {
    document.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.onclick = (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        const type = e.target.getAttribute('data-type');

        if (type === 'blog') {
          siteData.blog.splice(index, 1);
          renderBlogEditor();
        } else if (type === 'software') {
          siteData.software.splice(index, 1);
          renderSoftwareEditor();
        } else if (type === 'games') {
          siteData.games.splice(index, 1);
          renderGamesEditor();
        } else if (type === 'books-read') {
          siteData.books.read.splice(index, 1);
          renderBooksEditor('read', readBooksEditorList);
        } else if (type === 'books-mine') {
          siteData.books.mine.splice(index, 1);
          renderBooksEditor('mine', myBooksEditorList);
        }
      };
    });
  }

  // --- ЛОГИКА ДОБАВЛЕНИЯ НОВЫХ ЭЛЕМЕНТОВ ---

  addBlogBtn.onclick = () => {
    siteData.blog.push({ date: 'Сегодня', image: '', text: '' });
    renderBlogEditor();
  };

  addSoftwareBtn.onclick = () => {
    siteData.software.push({ title: 'Новый проект', lang: 'JS', badgeClass: 'badge-csharp', description: '', tags: [] });
    renderSoftwareEditor();
  };

  addGameBtn.onclick = () => {
    siteData.games.push({ title: 'Новая игра', description: '', status: 'В разработке', genre: '' });
    renderGamesEditor();
  };

  addReadBookBtn.onclick = () => {
    siteData.books.read.push({ title: 'Новая книга', author: '', rating: '☆☆☆☆☆', review: '' });
    renderBooksEditor('read', readBooksEditorList);
  };

  addMyBookBtn.onclick = () => {
    siteData.books.mine.push({ title: 'Новая книга', author: 'Павел Байдуров', rating: '☆☆☆☆☆', review: '' });
    renderBooksEditor('mine', myBooksEditorList);
  };

  // --- СОХРАНЕНИЕ ДАННЫХ НА СЕРВЕР ---

  saveAllBtn.addEventListener('click', async () => {
    dashboardStatus.textContent = '⚡ Сохранение...';
    dashboardStatus.style.color = '#333';

    // Собираем данные с форм обратно в объект siteData
    siteData.profile = {
      subtitle: editSubtitle.value.trim()
    };

    // Собираем блоги
    const blogRows = blogEditorList.querySelectorAll('.row-editor');
    siteData.blog = Array.from(blogRows).map(row => ({
      date: row.querySelector('.blog-date').value.trim(),
      mediaType: row.querySelector('.blog-media-type').value,
      mediaUrl: row.querySelector('.blog-media-url').value.trim(),
      text: row.querySelector('.blog-text').value.trim()
    }));

    // Собираем ПО
    const softRows = softwareEditorList.querySelectorAll('.row-editor');
    siteData.software = Array.from(softRows).map(row => {
      const tagsStr = row.querySelector('.soft-tags').value;
      const tagsArr = tagsStr.split(',').map(t => t.trim()).filter(t => t !== '');
      return {
        title: row.querySelector('.soft-title').value.trim(),
        lang: row.querySelector('.soft-lang').value.trim(),
        badgeClass: 'badge-csharp', // по умолчанию
        description: row.querySelector('.soft-desc').value.trim(),
        tags: tagsArr
      };
    });

    // Собираем Игры
    const gameRows = gamesEditorList.querySelectorAll('.row-editor');
    siteData.games = Array.from(gameRows).map(row => ({
      title: row.querySelector('.game-title').value.trim(),
      description: row.querySelector('.game-desc').value.trim(),
      status: row.querySelector('.game-status').value.trim(),
      genre: row.querySelector('.game-genre').value.trim()
    }));

    // Собираем книги
    const readBookRows = readBooksEditorList.querySelectorAll('.row-editor');
    siteData.books.read = Array.from(readBookRows).map(row => ({
      title: row.querySelector('.book-title').value.trim(),
      author: row.querySelector('.book-author').value.trim(),
      rating: row.querySelector('.book-rating').value.trim(),
      review: row.querySelector('.book-review').value.trim()
    }));

    const myBookRows = myBooksEditorList.querySelectorAll('.row-editor');
    siteData.books.mine = Array.from(myBookRows).map(row => ({
      title: row.querySelector('.book-title').value.trim(),
      author: row.querySelector('.book-author').value.trim(),
      rating: row.querySelector('.book-rating').value.trim(),
      review: row.querySelector('.book-review').value.trim()
    }));

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'save',
          token: sessionToken,
          site_data: siteData
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        dashboardStatus.textContent = '✅ Все изменения успешно сохранены и применились к сайту!';
        dashboardStatus.style.color = '#2e7d32';
      } else {
        dashboardStatus.textContent = `❌ Ошибка сохранения: ${result.message || 'Неавторизовано.'}`;
        dashboardStatus.style.color = '#c62828';
        if (result.status === 'unauthorized') {
          // Выход, если сессия истекла
          setTimeout(() => logoutBtn.click(), 2000);
        }
      }
    } catch (error) {
      console.error(error);
      dashboardStatus.textContent = `❌ Ошибка сети: ${error.message}`;
      dashboardStatus.style.color = '#c62828';
    }
  });
});
