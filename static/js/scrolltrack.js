// static/js/scrolltrack.js
document.addEventListener('DOMContentLoaded', initMenuTracking);

window.addEventListener('resize', onScroll);
document.querySelector('.content').addEventListener('scroll', onScroll);

function initMenuTracking() {
  // First, collapse all sub‑menus
  document.querySelectorAll('.side-menu ul ul')
          .forEach(ul => ul.style.display = 'none');

  // Highlight based on initial hash (if any)
  const initialHash = window.location.hash || '#home';
  setActiveMenu(initialHash.substring(1));

  // Then kick off the scroll handler to sync on load
  onScroll();
}

function onScroll() {
  // Find the category-card nearest the top of the .content pane
  const contentTop = document.querySelector('.content').scrollTop;
  let activeId = null;
  document.querySelectorAll('.category-card').forEach(card => {
    const offset = card.offsetTop;
    if (offset <= contentTop + 10) {
      activeId = card.getAttribute('data-category');
    }
  });
  if (activeId) {
    setActiveMenu(activeId);
    // Update the URL hash without jumping
    history.replaceState(null, '', `#${activeId}`);
  }
}

function setActiveMenu(categoryId) {
  // 1) remove all existing .active and collapse all branches
  document.querySelectorAll('.side-menu a.active')
      .forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.side-menu li.active-parent')
      .forEach(li => li.classList.remove('active-parent'));
  document.querySelectorAll('.side-menu ul ul')
      .forEach(ul => ul.style.display = 'none');

  // 2) highlight the new one
  const selector = `.side-menu a[href="#${categoryId}"]`;
  const activeLink = document.querySelector(selector);
  if (!activeLink) return;

  activeLink.classList.add('active');

  // 3) walk up its LI ancestors, unhide and mark them
  let el = activeLink.parentElement;  // the <li>
  while (el && !el.classList.contains('side-menu')) {
    if (el.tagName === 'LI') {
      el.classList.add('active-parent');
      const sublist = el.querySelector(':scope > ul');
      if (sublist) sublist.style.display = 'block';
    }
    el = el.parentElement;
  }
}
