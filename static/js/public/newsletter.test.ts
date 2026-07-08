import { newsletter } from "./newsletter";

describe("newsletter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("does nothing when the newsletter form is missing", () => {
    expect(() => newsletter()).not.toThrow();
  });

  test("shows a loading state on submit", () => {
    document.body.innerHTML = `
      <form id="mktoForm_3376">
        <button type="submit">Submit</button>
      </form>
    `;

    newsletter();

    document
      .querySelector<HTMLFormElement>("#mktoForm_3376")!
      .dispatchEvent(new Event("submit"));

    const button = document.querySelector<HTMLButtonElement>("button")!;

    expect(button.disabled).toBe(true);
    expect(button.classList.contains("--dark")).toBe(true);
    expect(button.innerHTML).toBe(
      `<i class="p-icon--spinner u-animation--spin"></i> `,
    );
  });
});
