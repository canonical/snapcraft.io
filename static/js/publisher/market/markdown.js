export default function() {
  const markdownLink = document.querySelector(".js-toggle-markdown");
  const markdownInfo = document.querySelector(".js-markdown");

  markdownLink.addEventListener("click", e => {
    e.preventDefault();
    markdownInfo.classList.toggle("u-hide");
  });
}
