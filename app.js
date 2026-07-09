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
      // Снимаем класс active со всех вкладок и контента
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Добавляем класс active текущей вкладке
      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // 3. Укажите ваш Google Apps Script URL здесь:
  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/ВАШ_ИДЕНТИФИКАТОР_СКРИПТА/exec';

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
      // Google Apps Script Web App ожидает POST запрос
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Позволяет делать запросы к Apps Script без CORS проблем
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
