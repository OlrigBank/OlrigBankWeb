// static/js/scrolltrack.js

document.addEventListener('DOMContentLoaded', function () {
  const menuLinks     = document.querySelectorAll('.side-menu a');
  const categoryCards = document.querySelectorAll('.category-card');

  function clearActive() {
    // Remove all existing highlights and expansions
    menuLinks.forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.side-menu li').forEach(li => {
      li.classList.remove('active-parent', 'open');
    });
  }

  function setActiveMenu(categoryId) {
    clearActive();

    // Find the matching link
    const activeLink = document.querySelector(`.side-menu a[href="#${categoryId}"]`);
    if (!activeLink) return;

    // Highlight the leaf
    activeLink.classList.add('active');

    // Walk up through parent <li>s
    let li = activeLink.closest('li');
    while (li) {
      // Mark parent link and expand submenu
      li.classList.add('active-parent', 'open');
      // Move up: the <li>'s parent is a <ul>; find that <ul>'s closest <li>
      li = li.parentElement.closest('li');
    }
  }

  function onScroll() {
    let current = '';
    categoryCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (rect.top <= 150 && rect.bottom >= 150) {
        current = card.dataset.category;
      }
    });
    if (current) setActiveMenu(current);
  }

  // Smooth scroll on click
  menuLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.getAttribute('href').slice(1);
      const target = document.querySelector(`.category-card[data-category="${id}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Fire on scroll & resize
  window.addEventListener('scroll', onScroll);
  window.addEventListener('resize', onScroll);

  // Initial highlight
  onScroll();
});
