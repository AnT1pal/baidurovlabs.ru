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

  // Текущая страница блога. Записей на странице — пять; всё, что дальше,
  // прячется за перелистыванием, иначе главная растёт без конца.
  let blogPage = 1;

  function driveFileId(url) {
    const m = String(url).match(/(?:googleusercontent\.com\/d\/|[?&]id=|\/file\/d\/)([-\w]{20,})/);
    return m ? m[1] : '';
  }

  // Перелистывание страниц. Вид взят у остальных кнопок сайта (.classic-btn),
  // чтобы не выбиваться из общего оформления.
  function renderBlogPager(container, pages, data) {
    const old = document.getElementById('blog-pager');
    if (old) old.remove();
    if (pages <= 1) return;

    const pager = document.createElement('div');
    pager.id = 'blog-pager';
    pager.style.cssText =
      'display: flex; justify-content: center; align-items: center; gap: 8px; ' +
      'margin-top: 20px; padding-top: 15px; border-top: 1px solid #c0c0c0;';

    const mkBtn = (label, targetPage, disabled) => {
      const b = document.createElement('button');
      b.className = 'classic-btn';
      b.textContent = label;
      b.style.alignSelf = 'auto';
      if (disabled) {
        b.disabled = true;
        b.style.color = '#a0a0a0';
        b.style.cursor = 'default';
      } else {
        b.onclick = () => {
          blogPage = targetPage;
          renderSiteData(data);
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      }
      return b;
    };

    pager.appendChild(mkBtn('◄ Назад', blogPage - 1, blogPage <= 1));

    const label = document.createElement('span');
    label.textContent = `Страница ${blogPage} из ${pages}`;
    label.style.cssText = 'font-size: 0.8rem; color: #404040; padding: 0 6px;';
    pager.appendChild(label);

    pager.appendChild(mkBtn('Вперёд ►', blogPage + 1, blogPage >= pages));

    container.parentNode.appendChild(pager);
  }

  // Метод динамического рендеринга данных на страницу
  function renderSiteData(data) {
    if (data.profile && data.profile.subtitle) {
      document.querySelector('.subtitle').textContent = data.profile.subtitle;
    }

    const blogPostsContainer = document.querySelector('#tab-blog .blog-posts');
    if (blogPostsContainer && data.blog) {
      // Записи без текста и медиа отсекаем заранее: они не должны занимать
      // место на странице и сбивать счёт страниц.
      const posts = data.blog.filter(p =>
        ((p.mediaUrl || p.image || '').trim() !== '') || ((p.text || '').trim() !== ''));

      const perPage = 5;
      const pages = Math.max(1, Math.ceil(posts.length / perPage));
      if (blogPage > pages) blogPage = pages;

      blogPostsContainer.innerHTML = '';
      posts.slice((blogPage - 1) * perPage, blogPage * perPage).forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'blog-post';
        postElement.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center;';
        
        let mediaHtml = '';
        const mediaType = post.mediaType || (post.image ? 'image' : 'none');
        const mediaUrl = post.mediaUrl || post.image || '';

        if (mediaType === 'image' && mediaUrl) {
          // Картинки из Google Drive отдаются по двум разным адресам, и какой
          // из них жив — со временем меняется. Если первый не открылся,
          // подставляем второй; для обычных ссылок и файлов из репозитория
          // запасной адрес не строится и ничего не меняется.
          const driveId = driveFileId(mediaUrl);
          const fallback = driveId
            ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`
            : '';
          const onErr = fallback
            ? ` onerror="if(this.dataset.retry!=='1'){this.dataset.retry='1';this.src='${fallback}';}"`
            : '';
          mediaHtml = `
            <div class="blog-image-container">
              <img src="${mediaUrl}" alt="Изображение блога" id="blog-image"${onErr} style="max-width: 100%; max-height: 70vh; height: auto; border: 1px solid #808080;">
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

      renderBlogPager(blogPostsContainer, pages, data);
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
          ${item.downloadUrl ? `
            <div style="margin-top: 10px; margin-bottom: 10px;">
              <a href="${item.downloadUrl}" target="_blank" class="classic-button" style="text-decoration: none; display: inline-block;">Скачать</a>
            </div>
          ` : ''}
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
            <div class="game-meta" style="margin-bottom: 10px;">
              <span><strong>Статус:</strong> ${game.status}</span>
              <span><strong>Жанр:</strong> ${game.genre}</span>
            </div>
            ${game.downloadUrl ? `
              <div>
                <a href="${game.downloadUrl}" target="_blank" class="classic-button" style="text-decoration: none; display: inline-block;">Скачать</a>
              </div>
            ` : ''}
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
          const reviewText = book.review || '';
          const downloadHtml = book.downloadUrl ? `<a href="${book.downloadUrl}" target="_blank" style="margin-left: 8px; font-size: 0.8rem; color: #2a4d7c; text-decoration: underline;">[Скачать]</a>` : '';
          
          row.innerHTML = `
            <td><strong>${book.title}</strong></td>
            <td>${book.author || '—'}</td>
            <td class="rating">${book.rating || '☆☆☆☆☆'}</td>
            <td>
              ${reviewText || (downloadHtml ? '' : '—')}
              ${downloadHtml}
            </td>
          `;
          readBooksTableBody.appendChild(row);
        });
      }

      const myBooksTableBody = booksTab.querySelector('.table-responsive:nth-of-type(2) tbody');
      if (myBooksTableBody && data.books.mine) {
        myBooksTableBody.innerHTML = '';
        data.books.mine.forEach(book => {
          const row = document.createElement('tr');
          const reviewText = book.review || '';
          const downloadHtml = book.downloadUrl ? `<a href="${book.downloadUrl}" target="_blank" style="margin-left: 8px; font-size: 0.8rem; color: #2a4d7c; text-decoration: underline;">[Скачать]</a>` : '';
          
          row.innerHTML = `
            <td><strong>${book.title}</strong></td>
            <td>${book.author || '—'}</td>
            <td class="rating">${book.rating || '☆☆☆☆☆'}</td>
            <td>
              ${reviewText || (downloadHtml ? '' : '—')}
              ${downloadHtml}
            </td>
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

      formStatus.textContent = '✅ Сообщение отправлено!';
      formStatus.className = 'form-status-msg success';
      contactForm.reset();

    } catch (error) {
      console.error('Ошибка отправки:', error);
      formStatus.textContent = `❌ Не удалось отправить сообщение: ${error.message}`;
      formStatus.className = 'form-status-msg error';
    }
  });
});
