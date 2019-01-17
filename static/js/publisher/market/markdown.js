export default function() {
  const markdownLink = document.querySelector(".js-toggle-markdown");
  const markdownInfo = document.querySelector(".js-markdown");

  markdownLink.addEventListener("click", e => {
    e.preventDefault();
    markdownInfo.classList.toggle("u-hide");
    if (markdownInfo.classList.contains("u-hide")) {
      markdownLink.innerHTML = markdownLink.innerHTML.replace("Hide", "Show");
    } else {
      markdownLink.innerHTML = markdownLink.innerHTML.replace("Show", "Hide");
    }
  });
}
