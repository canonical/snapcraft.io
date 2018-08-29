import 'whatwg-fetch';

function snapDetailsPosts(holderSelector, templateSelector, showOnSuccessSelector) {
  const URL = '/blog/api/snap-posts/';
  const holder = document.querySelector(holderSelector);
  const template = document.querySelector(templateSelector);
  const showOnSuccess = document.querySelector(showOnSuccessSelector);

  if (!holder) {
    throw new Error('No holder element');
  }
  if (!template) {
    throw new Error('No template');
  }

  const snap = holder.dataset.snap;
  if (!snap) {
    throw new Error('Snap not defined');
  }

  fetch(`${URL}${snap}`).then(response => response.json()).then(posts => {
    if (posts.length === 0) {
      return;
    }
    const postsHTML = [];
    posts.forEach(post => {
      let postHTML = template.innerHTML;
      Object.keys(post).forEach(key => {
        postHTML = postHTML.split('${' + key + '}').join(post[key]);
      });
      postsHTML.push(postHTML);
    });

    if (postsHTML.length > 0) {
      holder.innerHTML = postsHTML.join('');
    }

    if (showOnSuccess) {
      showOnSuccess.style.display = 'block';
    }
  }).catch(error => {
    throw new Error(error.message);
  });
}

export { snapDetailsPosts };