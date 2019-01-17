export default function() {
  const markdownLink = document.querySelector(".js-toggle-markdown");
  const markdownInfo = document.querySelector(".js-markdown");

  markdownLink.addEventListener("click", function(e) {
    e.preventDefault();
    if (markdownInfo.classList.contains("u-hide")) {
      markdownInfo.classList.remove("u-hide");
    } else {
      markdownInfo.classList.add("u-hide");
    }
  });
}
