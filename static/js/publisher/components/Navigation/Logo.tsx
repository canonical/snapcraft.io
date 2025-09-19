function Logo(): React.JSX.Element {
  return (
    <a href="/" className="p-panel__logo">
      <img
        src="https://assets.ubuntu.com/v1/dae35907-Snapcraft%20tag.svg"
        alt="Snapcraft logo"
        className="p-panel__logo-image"
      />
      <div className="logo-text p-heading--4 hide-collapsed">Snapcraft</div>
    </a>
  );
}

export default Logo;
