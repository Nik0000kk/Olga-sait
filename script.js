/* ========================================
ОЛЬГА ПАРАДИСИ — КОУЧ-СТИЛИСТ
Главный скрипт сайта (многостраничная версия)
======================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* 1. Навигация между страницами и управление адресной строкой */
    const navPageLinks = document.querySelectorAll('.nav-links a[data-page]');
    let isTransitioning = false;

    const pageTitles = {
        home: 'Ольга Парадиси — коуч-стилист и эксперт по стилю',
        about: 'Обо мне — Ольга Парадиси',
        services: 'Услуги и программы — Ольга Парадиси',
        cases: 'Кейсы — Ольга Парадиси',
        reviews: 'Отзывы — Ольга Парадиси',
        contact: 'Контакты — Ольга Парадиси'
    };

    // Сопоставляет хеш URL с существующим разделом сайта.
    function getPageIdFromHash() {
        const hash = location.hash.replace('#', '');
        if (hash && document.getElementById('page-' + hash)) return hash;
        return 'home';
    }

    // Обновляет визуальное состояние активного пункта навигации.
    function updateNav(pageId) {
        navPageLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });
    }

    // Анимирует появление карточек при открытии раздела.
    function staggerItems(page) {
        const items = page.querySelectorAll('.service-card, .case-item, .comparison-card, .format-card, .stat, .story, .video-review, .ba-set, .ba-pair');
        items.forEach((el, i) => {
            el.style.animation = 'none';
            void el.offsetWidth; // Принудительный reflow перезапускает CSS-анимацию.
            el.style.opacity = '0';
            el.style.animation = 'fadeIn 0.7s ease forwards';
            el.style.animationDelay = (0.15 + i * 0.07) + 's';
        });
    }

    // Переключает раздел с коротким переходом прозрачности.
    function showPage(pageId, pushHash = true) {
        const target = document.getElementById('page-' + pageId);
        const current = document.querySelector('.page.active');
        if (!target || target === current || isTransitioning) return;

        isTransitioning = true;

        // Шаг 1: скрываем текущий раздел.
        if (current) {
            current.style.animation = 'none';
            current.style.transition = 'opacity 0.3s ease';
            current.style.opacity = '0';
        }

        setTimeout(() => {
            // Шаг 2: активируем целевой раздел и обновляем навигацию.
            if (current) {
                current.classList.remove('active');
                current.style.cssText = '';
            }
            staggerItems(target);
            target.classList.add('active');
            window.scrollTo(0, 0);
            updateNav(pageId);
            document.title = pageTitles[pageId] || pageTitles.home;
            if (pushHash) history.pushState(null, '', '#' + pageId);
            isTransitioning = false;
        }, current ? 300 : 0);
    }

    // Подключает единый обработчик ко всем ссылкам перехода между разделами.
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileMenu();
            showPage(el.dataset.page);
        });
    });

    // Поддерживает навигацию браузера «назад» и «вперёд».
    window.addEventListener('popstate', () => showPage(getPageIdFromHash(), false));
    window.addEventListener('hashchange', () => {
        const id = getPageIdFromHash();
        const current = document.querySelector('.page.active');
        if (current && current.id !== 'page-' + id) showPage(id, false);
    });

    // При прямом входе по URL с хешем открывает нужный раздел.
    const initialPage = getPageIdFromHash();
    if (initialPage !== 'home') {
        const home = document.getElementById('page-home');
        const target = document.getElementById('page-' + initialPage);
        home.classList.remove('active');
        home.style.cssText = '';
        staggerItems(target);
        target.classList.add('active');
        updateNav(initialPage);
        document.title = pageTitles[initialPage];
    } else {
        updateNav('home');
    }

    /* 2. Состояние шапки при прокрутке страницы */
    const header = document.querySelector('.header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

     /* 3. Отправка формы контактов через серверный обработчик send.php */
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const name = String(formData.get('name') || '').trim();
            const contact = String(formData.get('contact') || '').trim();
            const message = String(formData.get('message') || '').trim();
            const honeypot = String(formData.get('website') || '').trim();
            const consent = formData.get('consent') === '1';
            const submitButton = contactForm.querySelector('button[type="submit"]');

            if (!name || !contact) {
                showFormMessage('Пожалуйста, заполните имя и контакт для связи', 'error');
                return;
            }
            if (!consent) {
                showFormMessage('Перед отправкой заявки подтвердите согласие на обработку персональных данных.', 'error');
                return;
            }
            if (!submitButton) {
                showFormMessage('Форма временно недоступна. Попробуйте позже.', 'error');
                return;
            }

            const originalLabel = submitButton.textContent;
            submitButton.textContent = 'Отправка...';
            submitButton.disabled = true;

            try {
                // Секретный токен хранится на сервере; браузер отправляет данные только в send.php.
                const response = await fetch('send.php', {
                    method: 'POST',
                    body: new URLSearchParams({ name, contact, message, website: honeypot, consent: consent ? '1' : '' })
                });
                const result = await response.json();

                if (response.ok && result.ok) {
                    showFormMessage('Спасибо! Я свяжусь с вами в ближайшее время.', 'success');
                    contactForm.reset();
                } else {
                    console.error('Ошибка обработки заявки:', result);
                    showFormMessage('Не удалось отправить заявку. Попробуйте ещё раз позже.', 'error');
                }
            } catch (error) {
                console.error('Ошибка отправки заявки:', error);
                showFormMessage('Не удалось отправить заявку. Проверьте подключение и попробуйте позже.', 'error');
            } finally {
                submitButton.textContent = originalLabel;
                submitButton.disabled = false;
            }
        });
    }

    // Показывает доступное для экранных дикторов сообщение о результате отправки.
    function showFormMessage(text, type) {
        const old = document.querySelector('.form-message');
        if (old) old.remove();

        const el = document.createElement('div');
        el.className = `form-message form-message--${type}`;
        el.textContent = text;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        Object.assign(el.style, {
            padding: '16px 20px',
            margin: '20px auto 0',
            maxWidth: '560px',
            textAlign: 'center',
            fontSize: '0.95rem',
            border: '1px solid',
            animation: 'messageIn 0.4s ease'
        });
        if (type === 'success') {
            el.style.background = 'rgba(165, 214, 167, 0.12)';
            el.style.color = '#C8E6C9';
            el.style.borderColor = 'rgba(165, 214, 167, 0.4)';
        } else {
            el.style.background = 'rgba(239, 154, 154, 0.12)';
            el.style.color = '#FFCDD2';
            el.style.borderColor = 'rgba(239, 154, 154, 0.4)';
        }
        contactForm.parentNode.insertBefore(el, contactForm.nextSibling);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.4s ease';
            setTimeout(() => el.remove(), 400);
        }, 5000);
    }

    /* 4. Мобильная навигация */
    const burger = document.createElement('button');
    burger.className = 'burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Открыть меню');
    burger.setAttribute('aria-controls', 'primary-navigation');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span><span></span>';

    const burgerStyles = document.createElement('style');
    burgerStyles.textContent = `
        .burger { display: none; flex-direction: column; justify-content: space-between; width: 28px; height: 20px; background: none; border: none; cursor: pointer; padding: 0; z-index: 101; }
        .burger span { display: block; width: 100%; height: 2px; background: var(--text); transition: all 0.3s ease; border-radius: 2px; }
        .burger.active span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
        .burger.active span:nth-child(2) { opacity: 0; }
        .burger.active span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }
        @media (max-width: 768px) {
            .burger { display: flex; }
            .nav-cta { display: none; }
            .nav-links { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: var(--bg); flex-direction: column; justify-content: center; align-items: center; gap: 32px; z-index: 99; }
            .nav-links.active { display: flex; }
            .nav-links a { font-size: 1.4rem; font-family: var(--font-serif); }
        }
        @keyframes messageIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(burgerStyles);
    document.querySelector('.nav').appendChild(burger);

    const navLinks = document.querySelector('.nav-links');
    burger.addEventListener('click', () => {
        const isOpen = burger.classList.toggle('active');
        navLinks.classList.toggle('active', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
        burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    function closeMobileMenu() {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
        document.body.style.overflow = '';
    }
});

/* 5. Модальные окна с юридическими документами */
(function () {
    // Управление открытием и закрытием юридических окон.
    const modals = document.querySelectorAll('.modal');

    function openModal(id) {
        const modal = document.getElementById('modal-' + id);
        if (!modal) return;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Открывает документ по соответствующей ссылке в подвале или форме.
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(btn.dataset.modalOpen);
        });
    });

    // Закрывает окно по кнопке закрытия или клику по затемнённому фону.
    modals.forEach(modal => {
        modal.querySelectorAll('[data-modal-close]').forEach(el => {
            el.addEventListener('click', () => closeModal(modal));
        });
    });

    // Поддерживает закрытие модального окна клавишей Escape.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(m => { if (m.classList.contains('open')) closeModal(m); });
        }
    });
})();

/* 6. Управление воспроизведением видеоотзывов */
(function () {
    const reviews = document.querySelectorAll('.video-review');

    reviews.forEach(item => {
        const video = item.querySelector('video');
        const btn = item.querySelector('.video-play');
        const bar = item.querySelector('.video-progress');
        const fill = bar ? bar.querySelector('i') : null;
        if (!video || !btn || !bar || !fill) return;

        const toggle = () => {
            if (video.paused) {
                // Не допускаем одновременного воспроизведения нескольких отзывов.
                reviews.forEach(other => {
                    const otherVideo = other.querySelector('video');
                    if (otherVideo && otherVideo !== video) otherVideo.pause();
                });
                const playRequest = video.play();
                if (playRequest && typeof playRequest.catch === 'function') {
                    playRequest.catch(() => item.classList.remove('is-playing'));
                }
            } else {
                video.pause();
            }
        };

        btn.addEventListener('click', toggle);
        video.addEventListener('click', toggle);
        video.addEventListener('play', () => item.classList.add('is-playing'));
        video.addEventListener('pause', () => item.classList.remove('is-playing'));
        video.addEventListener('ended', () => { item.classList.remove('is-playing'); fill.style.width = '0'; });
        video.addEventListener('timeupdate', () => {
            if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + '%';
        });

        // Перематывает видео при клике по полосе прогресса.
        bar.style.cursor = 'pointer';
        bar.addEventListener('click', (e) => {
            const rect = bar.getBoundingClientRect();
            if (video.duration && rect.width > 0) {
                const progress = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                video.currentTime = progress * video.duration;
            }
        });
    });

    // Останавливает видео при переходе в другой раздел сайта.
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-page]')) {
            document.querySelectorAll('.video-review video').forEach(v => v.pause());
        }
    });
})();

/* 7. Адаптивная карусель текстовых отзывов с автопрокруткой */
(function () {
  const slider = document.getElementById('reviewsSlider');
  if (!slider) return;

  const track = slider.querySelector('.reviews-track');
  const slides = track ? Array.from(track.querySelectorAll('.review-slide')) : [];
  const dotsBox = slider.querySelector('.reviews-dots');
  const counter = slider.querySelector('.reviews-counter');
  const prevBtn = slider.querySelector('.reviews-arrow[data-dir="-1"]');
  const nextBtn = slider.querySelector('.reviews-arrow[data-dir="1"]');
  if (!track || !slides.length || !dotsBox || !prevBtn || !nextBtn) return;

  const AUTOPLAY_MS = 5500;
  let index = 0;
  let starts = [];
  let timer = null;
  let isHovered = false;
  let isFocused = false;
  let pointerStartX = null;

  function perView() {
    if (window.innerWidth >= 1100) return 3;
    if (window.innerWidth >= 769) return 2;
    return 1;
  }

  function getStarts() {
    const visible = perView();
    const maxStart = Math.max(0, slides.length - visible);
    const values = [];
    for (let i = 0; i < slides.length; i += visible) {
      const position = Math.min(i, maxStart);
      if (!values.includes(position)) values.push(position);
    }
    return values.length ? values : [0];
  }

  function buildDots() {
    dotsBox.innerHTML = '';
    starts.forEach((_, pageIndex) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'reviews-dot';
      dot.setAttribute('aria-label', 'Показать страницу отзывов ' + (pageIndex + 1));
      dot.addEventListener('click', () => {
        go(pageIndex);
        restartAutoplay();
      });
      dotsBox.appendChild(dot);
    });
  }

  function update() {
    starts = getStarts();
    if (index >= starts.length) index = starts.length - 1;
    if (dotsBox.children.length !== starts.length) buildDots();

    const activeSlide = slides[starts[index]];
    const x = activeSlide.offsetLeft - slides[0].offsetLeft;
    track.style.transform = 'translate3d(-' + x + 'px, 0, 0)';

    Array.from(dotsBox.children).forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });

    if (counter) {
      counter.textContent = String(index + 1).padStart(2, '0') + ' / ' +
        String(starts.length).padStart(2, '0');
    }
    prevBtn.disabled = starts.length < 2;
    nextBtn.disabled = starts.length < 2;
  }

  function go(nextIndex) {
    if (!starts.length) starts = getStarts();
    index = (nextIndex + starts.length) % starts.length;
    update();
  }

  function canAutoplay() {
    const page = slider.closest('.page');
    const reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return (!page || page.classList.contains('active')) &&
      !document.hidden && !isHovered && !isFocused && !reducedMotion && starts.length > 1;
  }

  function stopAutoplay() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function syncAutoplay() {
    if (!canAutoplay()) {
      stopAutoplay();
      return;
    }
    if (timer === null) {
      timer = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    }
  }

  function restartAutoplay() {
    stopAutoplay();
    syncAutoplay();
  }

  prevBtn.addEventListener('click', () => {
    go(index - 1);
    restartAutoplay();
  });
  nextBtn.addEventListener('click', () => {
    go(index + 1);
    restartAutoplay();
  });

  slider.addEventListener('pointerdown', event => {
    pointerStartX = event.clientX;
  });
  slider.addEventListener('pointerup', event => {
    if (pointerStartX === null) return;
    const deltaX = event.clientX - pointerStartX;
    if (Math.abs(deltaX) > 50) {
      go(index + (deltaX < 0 ? 1 : -1));
      restartAutoplay();
    }
    pointerStartX = null;
  });
  slider.addEventListener('pointercancel', () => { pointerStartX = null; });

  slider.addEventListener('mouseenter', () => {
    isHovered = true;
    syncAutoplay();
  });
  slider.addEventListener('mouseleave', () => {
    isHovered = false;
    syncAutoplay();
  });
  slider.addEventListener('focusin', () => {
    isFocused = true;
    syncAutoplay();
  });
  slider.addEventListener('focusout', event => {
    if (!slider.contains(event.relatedTarget)) {
      isFocused = false;
      syncAutoplay();
    }
  });

  window.addEventListener('resize', () => {
    update();
    syncAutoplay();
  });
  document.addEventListener('visibilitychange', syncAutoplay);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-page]')) {
      window.setTimeout(() => {
        update();
        syncAutoplay();
      }, 350);
    }
  });

  update();
  syncAutoplay();

  // После активации скрытого раздела пересчитывает размеры слайдов и запускает автопрокрутку.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      update();
      syncAutoplay();
    }, { once: true });
  } else {
    window.setTimeout(() => {
      update();
      syncAutoplay();
    }, 0);
  }
})();
