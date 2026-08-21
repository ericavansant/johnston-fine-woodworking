const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const dialog = document.getElementById('lightbox');
const dialogImg = dialog?.querySelector('img');
const closeBtn = dialog?.querySelector('.lightbox-close');
document.querySelectorAll('[data-lightbox]').forEach(item => {
  item.addEventListener('click', () => {
    if (!dialog || !dialogImg) return;
    dialogImg.src = item.dataset.lightbox;
    dialog.showModal();
  });
});
closeBtn?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});
