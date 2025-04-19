// static/js/toggle-menu.js

document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggle-menu");
  const sideMenu = document.querySelector(".side-menu");

  if (toggleBtn && sideMenu) {
    toggleBtn.addEventListener("click", () => {
      // Toggle the 'show' class to slide the menu in/out on mobile
      sideMenu.classList.toggle("show");
    });
  }

  // Optional: Expand/collapse second-level menu on click
  document.querySelectorAll(".side-menu li").forEach((li) => {
    li.addEventListener("click", function (e) {
      // Only toggle when clicking the <li> itself, not direct links
      if (e.target.tagName !== "A") return;
      e.currentTarget.classList.toggle("open");
    });
  });
});
