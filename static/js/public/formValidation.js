function formValidation() {
  const form = document.querySelector(".marketo-form");
  // If the form doesn't exist silently pass over this functionality.
  if (!form) {
    return;
  }

  const startTime = Date.now();
  let delta = null;

  const spamCheck = document.createElement("input");
  spamCheck.id = "grecaptcharesponse";
  spamCheck.type = "hidden";

  const timer = setInterval(function() {
    delta = Date.now() - startTime; // milliseconds elapsed since start
    // if the form is submitted after more than 3 seconds, it means it was not a bot
    if (delta / 1000 > 3) {
      spamCheck.value = "noBot";
      clearInterval(timer);
    }
  }, 100); // update about every 100 miliseconds

  form.appendChild(spamCheck);
}

export { formValidation };
