document.addEventListener('DOMContentLoaded', function () {
    const menuLinks = document.querySelectorAll('.side-menu a');
    const categoryCards = document.querySelectorAll('.category-card');

    function removeActiveClasses() {
        menuLinks.forEach(link => link.classList.remove('active'));
    }

    function setActiveMenu(categoryId) {
        removeActiveClasses();
        const activeLink = document.querySelector(`.side-menu a[href="#${categoryId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    function onScroll() {
        let currentCategory = '';
        categoryCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                currentCategory = card.getAttribute('data-category');
            }
        });

        if (currentCategory) {
            setActiveMenu(currentCategory);
        }
    }

    // Smooth scroll when clicking menu items
    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetCard = document.querySelector(`.category-card[data-category="${targetId}"]`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    const contentEl = document.querySelector('.content');
    contentEl.addEventListener('scroll', onScroll);

    window.addEventListener('resize', onScroll);

    // Initial highlight
    onScroll();
});
