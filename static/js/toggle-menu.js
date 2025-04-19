
document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggle-menu");
  const sideMenu = document.querySelector(".side-menu");

  if (toggleBtn && sideMenu) {
    toggleBtn.addEventListener("click", () => {
      sideMenu.classList.toggle("hidden");
    });
  }

  // Optional: Expand/collapse second-level menu on click
  document.querySelectorAll(".side-menu li").forEach((li) => {
    li.addEventListener("click", function (e) {
      // Prevent toggling when clicking a link
      if (e.target.tagName !== "A") return;
      e.currentTarget.classList.toggle("open");
    });
  });
});
