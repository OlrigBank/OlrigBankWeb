document.addEventListener("DOMContentLoaded", function () {
    const menuLinks = document.querySelectorAll('.side-menu a');
    const categoryCards = document.querySelectorAll('.category-card');
    const scrollContainer = document.querySelector('.content');

    function removeActiveClasses() {
        menuLinks.forEach(link => link.classList.remove('active'));
    }

    function updateActiveLink() {
        let closestCard = null;
        let closestOffset = Infinity;

        categoryCards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const offset = Math.abs(cardRect.top - containerRect.top);

            if (offset < closestOffset) {
                closestOffset = offset;
                closestCard = card;
            }
        });

        if (closestCard) {
            const activeCategory = closestCard.getAttribute('data-category');
            removeActiveClasses();
            const activeLink = document.querySelector(`.side-menu a[href="#${activeCategory}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    scrollContainer.addEventListener('scroll', function () {
        updateActiveLink();
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetCard = document.querySelector(`.category-card[data-category="${targetId}"]`);

            if (targetCard) {
                const containerTop = scrollContainer.getBoundingClientRect().top;
                const targetTop = targetCard.getBoundingClientRect().top;
                const scrollOffset = targetTop - containerTop + scrollContainer.scrollTop;

                scrollContainer.scrollTo({
                    top: scrollOffset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initial update
    updateActiveLink();
});
