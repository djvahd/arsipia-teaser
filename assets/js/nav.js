const navToggle = document.getElementById("navToggle");

document.querySelectorAll(".nav__links a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.checked = false;
  });
});
