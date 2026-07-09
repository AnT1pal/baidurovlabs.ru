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

  // 2. Логика переключения вкладок (Tabs)
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // 3. Укажите ваш Google Apps Script URL здесь:
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7zBxJVKDtAhYBZ6eiIm5qzS9CBButktQsmz7wgOB-_7-pvyeuccA_4IsT4wHC_jHiVg/exec';

  // Локальные резервные данные (fallback) на случай, если скрипт еще не настроен
  const fallbackData = {
    profile: { subtitle: "Тяп-ляп и в продакшн." },
    blog: [{ date: "09 июля 2026 г.", image: "photo_2026-05-21_09-45-08.jpg", text: "" }],
    software: [{ title: "КриптоПачка", lang: "C# / .NET", badgeClass: "badge-csharp", description: "Утилита для пакетного подписания файлов электронной подписью через КриптоПро CSP. Разработана для автоматизации документооборота, поддерживает отсоединенную подпись и создание отчетов в CSV.", tags: ["КриптоПро CSP", "Пакетная подпись"] }],
    games: [{ title: "Хрущевск", description: "Проект находится в процессе разработки.", status: "В разработке", genre: "Симулятор / Выживание" }],
    books: {
      read: [{ title: "Золотой Храм", author: "Юкио Мисима", rating: "★★★★★", review: "Красивое" }],
      mine: [{ title: "Серое Небо", author: "Павел Байдуров", rating: "☆☆☆☆☆", review: "делитед" }]
    }
  };

  // Метод динамического рендеринга данных на страницу
  function renderSiteData(data) {
    if (data.profile && data.profile.subtitle) {
      document.querySelector('.subtitle').textContent = data.profile.subtitle;
    }

    const blogPostsContainer = document.querySelector('#tab-blog .blog-posts');
    if (blogPostsContainer && data.blog) {
      blogPostsContainer.innerHTML = '';
      data.blog.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'blog-post';
        postElement.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
        
        let mediaHtml = '';
        const mediaType = post.mediaType || (post.image ? 'image' : 'none');
        const mediaUrl = post.mediaUrl || post.image || '';

        if (mediaType === 'image' && mediaUrl) {
          mediaHtml = `
            <div class="blog-image-container">
              <img src="${mediaUrl}" alt="Изображение блога" id="blog-image" style="max-width: 100%; max-height: 70vh; height: auto; border: 1px solid #808080;">
            </div>
          `;
        } else if (mediaType === 'youtube' && mediaUrl) {
          let videoId = mediaUrl;
          if (mediaUrl.includes('v=')) videoId = mediaUrl.split('v=')[1].split('&')[0];
          else if (mediaUrl.includes('youtu.be/')) videoId = mediaUrl.split('youtu.be/')[1].split('?')[0];
          
          mediaHtml = `
            <div class="video-container">
              <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
        } else if (mediaType === 'rutube' && mediaUrl) {
          let videoId = mediaUrl;
          if (mediaUrl.includes('rutube.ru/video/')) {
            videoId = mediaUrl.split('rutube.ru/video/')[1].split('/')[0];
          } else if (mediaUrl.includes('rutube.ru/play/embed/')) {
            videoId = mediaUrl.split('rutube.ru/play/embed/')[1].split('/')[0];
          }
          mediaHtml = `
            <div class="video-container">
              <iframe src="https://rutube.ru/play/embed/${videoId}" frameborder="0" allow="clipboard-write; autoplay" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
            </div>
          `;
        } else if (mediaType === 'vk' && mediaUrl) {
          mediaHtml = `
            <div class="video-container">
              <iframe src="${mediaUrl}" frameborder="0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
        }

        postElement.innerHTML = `
          <div class="post-header" style="justify-content: center; width: 100%; border-bottom: none; margin-bottom: 15px;">
            <span class="post-date">${post.date}</span>
          </div>
          ${mediaHtml}
          ${post.text ? `
            <p style="margin-top: 15px; font-style: italic; font-size: 0.95rem; max-width: 600px; line-height: 1.5;">${post.text}</p>
          ` : ''}
        `;
        blogPostsContainer.appendChild(postElement);
      });
    }

    const softwareGrid = document.querySelector('#tab-software .software-grid');
    if (softwareGrid && data.software) {
      softwareGrid.innerHTML = '';
      data.software.forEach(item => {
        const card = document.createElement('div');
        card.className = 'software-card';
        card.innerHTML = `
          <h3>${item.title}</h3>
          <span class="badge ${item.badgeClass || 'badge-csharp'}">${item.lang}</span>
          <p>${item.description}</p>
          <div class="card-footer">
            ${item.tags ? item.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('') : ''}
          </div>
        `;
        softwareGrid.appendChild(card);
      });
    }

    const gamesList = document.querySelector('#tab-games .games-list');
    if (gamesList && data.games) {
      gamesList.innerHTML = '';
      data.games.forEach(game => {
        const item = document.createElement('div');
        item.className = 'game-item';
        item.innerHTML = `
          <div class="game-info">
            <h3>${game.title}</h3>
            <p class="game-desc">${game.description}</p>
            <div class="game-meta">
              <span><strong>Статус:</strong> ${game.status}</span>
              <span><strong>Жанр:</strong> ${game.genre}</span>
            </div>
          </div>
        `;
        gamesList.appendChild(item);
      });
    }

    const booksTab = document.getElementById('tab-books');
    if (booksTab && data.books) {
      const readBooksTableBody = booksTab.querySelector('.table-responsive:nth-of-type(1) tbody');
      if (readBooksTableBody && data.books.read) {
        readBooksTableBody.innerHTML = '';
        data.books.read.forEach(book => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td class="rating">${book.rating}</td>
            <td>${book.review}</td>
          `;
          readBooksTableBody.appendChild(row);
        });
      }

      const myBooksTableBody = booksTab.querySelector('.table-responsive:nth-of-type(2) tbody');
      if (myBooksTableBody && data.books.mine) {
        myBooksTableBody.innerHTML = '';
        data.books.mine.forEach(book => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td class="rating">${book.rating}</td>
            <td>${book.review}</td>
          `;
          myBooksTableBody.appendChild(row);
        });
      }
    }
  }

  // Загрузка динамических данных при старте
  async function loadData() {
    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('ВАШ_ИДЕНТИФИКАТОР_СКРИПТА')) {
      console.warn("GOOGLE_APPS_SCRIPT_URL не настроен. Используются резервные локальные данные.");
      renderSiteData(fallbackData);
      return;
    }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
      if (!response.ok) throw new Error("HTTP error " + response.status);
      const data = await response.json();
      renderSiteData(data);
      console.log("Данные сайта успешно загружены из Google Apps Script.");
    } catch (err) {
      console.error("Ошибка при получении данных с сервера, используем резервную копию:", err);
      renderSiteData(fallbackData);
    }
  }

  loadData();

  // 4. Отправка формы контактов через Google Apps Script
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('ВАШ_ИДЕНТИФИКАТОР_СКРИПТА')) {
      formStatus.textContent = '❌ Ошибка: настройте GOOGLE_APPS_SCRIPT_URL в файле app.js!';
      formStatus.className = 'form-status-msg error';
      return;
    }

    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const message = document.getElementById('form-message').value.trim();

    formStatus.textContent = '⚡ Отправка сообщения...';
    formStatus.className = 'form-status-msg';

    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'contact',
          name: name,
          email: email,
          message: message
        })
      });

      formStatus.textContent = '✅ Сообщение отправлено! (Запрос передан в Google Apps Script)';
      formStatus.className = 'form-status-msg success';
      contactForm.reset();

    } catch (error) {
      console.error('Ошибка отправки:', error);
      formStatus.textContent = `❌ Не удалось отправить сообщение: ${error.message}`;
      formStatus.className = 'form-status-msg error';
    }
  });
});
