import "whatwg-fetch";

interface Post {
  slug: string;
  [key: string]: string | undefined;
}

interface PostWithClassName extends Post {
  className: string;
}

type Modifier = (posts: Post[]) => Post[];

class BlogPosts {
  url: string;
  path: string;
  holder: HTMLElement;
  template: HTMLTemplateElement;
  limit: number;
  modifiers?: Modifier[];

  constructor(
    url: string | undefined,
    holderSelector: string,
    templateSelector: string,
  ) {
    if (!url) {
      throw new Error("`url` must be defined");
    }
    if (!holderSelector) {
      throw new Error("`holderSelector` must be defined");
    }
    if (!templateSelector) {
      throw new Error("`templateSelector` must be defined");
    }

    this.url = url;
    this.path = "";
    this.holder = document.querySelector(holderSelector) as HTMLElement;
    this.template = document.querySelector(
      templateSelector,
    ) as HTMLTemplateElement;

    this.limit = 3;

    if (!this.holder) {
      throw new Error(`${holderSelector} does not exist`);
    }

    if (!this.template) {
      throw new Error(`${templateSelector} does not exist`);
    }
  }

  setResultModifiers(modifiers: Modifier[]) {
    this.modifiers = modifiers;
  }

  fetch() {
    return fetch(`${this.url}${this.path}`)
      .then((response) => response.json())
      .then((posts) => {
        if (posts.length === 0) {
          return false;
        }
        const postsHTML: unknown[] = [];

        if (this.modifiers) {
          this.modifiers.forEach((modifier) => {
            posts = modifier(posts);
          });
        }

        const cols = 12 / this.limit;

        posts.forEach((post: Post, index: number) => {
          if (index >= this.limit) {
            return;
          }
          let postHTML = this.template.innerHTML;
          Object.keys(post).forEach((key) => {
            if (post[key]) {
              postHTML = postHTML.split("${" + key + "}").join(post[key]);
            } else {
              postHTML = postHTML.split("${" + key + "}").join("");
            }
          });
          const containerClasses = [`col-${cols}`];
          if (post.slug.indexOf("http") === 0) {
            containerClasses.push(`p-blog-post--guest-post`);
          }
          postHTML = postHTML
            .split("${container_class}")
            .join(containerClasses.join(" "));
          postsHTML.push(postHTML);
        });

        if (postsHTML.length > 0) {
          this.holder.innerHTML = postsHTML.join("");
        }

        return posts;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
}

function snapDetailsPosts(
  holderSelector: string,
  templateSelector: string,
  showOnSuccessSelector: string,
): void {
  const blogPosts = new BlogPosts(
    "/blog/api/snap-posts/",
    holderSelector,
    templateSelector,
  );

  const snap = blogPosts.holder.dataset.snap;
  if (!snap) {
    throw new Error("Snap not defined");
  }

  if (blogPosts.holder.dataset.limit) {
    blogPosts.limit = parseInt(blogPosts.holder.dataset.limit, 10);
  }

  blogPosts.path = snap;

  blogPosts.fetch().then((posts) => {
    if (posts.length > 0 && showOnSuccessSelector) {
      const showOnSuccess = document.querySelector(showOnSuccessSelector);
      if (showOnSuccess) {
        showOnSuccess.classList.remove("u-hide");
      }
    }
  });
}

function seriesPosts(holderSelector: string, templateSelector: string): void {
  const blogPosts = new BlogPosts(
    "/blog/api/series/",
    holderSelector,
    templateSelector,
  );

  const series = blogPosts.holder.dataset.series || "";
  const currentSlug = blogPosts.holder.dataset.currentslug;

  blogPosts.path = series;

  blogPosts.setResultModifiers([
    function reverse(posts) {
      return posts.reverse();
    },
    function filter(posts) {
      return posts.map((post): PostWithClassName => {
        return {
          ...post,
          className: post.slug === currentSlug ? "is-current" : "",
        };
      });
    },
  ]);

  blogPosts.fetch();
}

export { snapDetailsPosts, seriesPosts };
