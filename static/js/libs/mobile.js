function isMobile() {
  // If the mobile menu button is visible, we're on mobile
  const mobileMenuButton = document.querySelector('.p-navigation__toggle--open');

  // Use offsetWidth and offsetHeight to figure out if an element is visibile
  return !(mobileMenuButton.offsetWidth === 0 && mobileMenuButton.offsetHeight === 0);
}

export { isMobile };
