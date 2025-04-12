document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".side-menu a");

    function activateMenu() {
        let currentSection = "";

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100; // Offset for fixed header
            if (pageYOffset >= sectionTop) {
                currentSection = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href").slice(1) === currentSection) {
                link.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", activateMenu);
    activateMenu(); // Initial activation
});
