const API_BASE = '';

// ===== HEADER SCROLL =====
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 10);
});

// ===== BURGER / MOBILE NAV =====
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobile-nav');

burger.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});

document.querySelectorAll('.m-nav-link').forEach(link => {
  link.addEventListener('click', () => mobileNav.classList.remove('open'));
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const offset = document.getElementById('header').offsetHeight;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    mobileNav.classList.remove('open');
  });
});

// ===== FILTER =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.product-card').forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ===== SET MIN DATE =====
const dateInput = document.getElementById('res-date');
if (dateInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

// ===== RESERVATION FORM =====
const form = document.getElementById('reservationForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем...';

    const payload = {
      guest_name: document.getElementById('name').value.trim(),
      guest_phone: document.getElementById('phone').value.trim(),
      guest_email: document.getElementById('email').value.trim(),
      guests_count: parseInt(document.getElementById('guests').value),
      reservation_date: document.getElementById('res-date').value,
      reservation_time: document.getElementById('res-time').value,
      comment: document.getElementById('comment').value.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('✅ Стол забронирован! Мы свяжемся с вами для подтверждения.');
        form.reset();
      } else {
        showToast('❌ ' + (data.error || 'Ошибка. Попробуйте ещё раз.'));
      }
    } catch (err) {
      showToast('❌ Ошибка соединения. Позвоните нам напрямую.');
    }

    btn.disabled = false;
    btn.textContent = 'Забронировать стол';
  });
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== SNOW =====
(function() {
  const canvas = document.getElementById('snow-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, flakes = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = 120;

  function createFlake() {
    return {
      x: Math.random() * W,
      y: Math.random() * H - H,
      r: Math.random() * 3 + 1,
      speed: Math.random() * 0.6 + 0.2,
      wind: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.008 + 0.003
    };
  }

  for (let i = 0; i < COUNT; i++) {
    const f = createFlake();
    f.y = Math.random() * H; // распределяем сразу по всему экрану
    flakes.push(f);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    flakes.forEach(f => {
      f.wobble += f.wobbleSpeed;
      f.x += Math.sin(f.wobble) * 0.5 + f.wind;
      f.y += f.speed;

      if (f.y > H + 10) {
        Object.assign(f, createFlake());
        f.y = -10;
      }
      if (f.x > W + 10) f.x = -10;
      if (f.x < -10) f.x = W + 10;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();
