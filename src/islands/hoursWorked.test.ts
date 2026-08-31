import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./hoursWorked";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="hw">
      <form novalidate>
        ${["1", "2", "3"].map((s) => `<input name="s${s}s"/><input name="s${s}e"/><input name="s${s}b"/>`).join("")}
        <input name="rate"/>
        <button type="submit">Calc</button><button type="reset">Reset</button>
      </form>
      <div data-errors hidden></div>
      <div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">Copy</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='hw']")!;
  init(root);
  const form = root.querySelector("form")!;
  return { form, result: root.querySelector<HTMLElement>("[data-result]")!, errors: root.querySelector<HTMLElement>("[data-errors]")! };
}
function set(form: HTMLFormElement, name: string, value: string) {
  const el = form.elements.namedItem(name) as HTMLInputElement;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => history.replaceState(null, "", "/calculators/hours-worked-calculator/"));

describe("hours worked island", () => {
  it("single span, no break", () => {
    const { form, result } = mount();
    set(form, "s1s", "9:00 AM");
    set(form, "s1e", "5:30 PM");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("8h 30m");
    expect(result.textContent).toContain("8.50");
  });

  it("subtracts an unpaid break", () => {
    const { form, result } = mount();
    set(form, "s1s", "9");
    set(form, "s1e", "17");
    set(form, "s1b", "30");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("7.50");
  });

  it("overnight span", () => {
    const { form, result } = mount();
    set(form, "s1s", "10:00 PM");
    set(form, "s1e", "6:00 AM");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("8h");
    expect(result.textContent?.toLowerCase()).toContain("midnight");
  });

  it("adds pay when a rate is given", () => {
    const { form, result } = mount();
    set(form, "s1s", "9");
    set(form, "s1e", "17");
    set(form, "rate", "25");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$200.00");
  });

  it("sums split sessions", () => {
    const { form, result } = mount();
    set(form, "s1s", "8:00 AM");
    set(form, "s1e", "12:00 PM"); // 4h
    set(form, "s2s", "1:00 PM");
    set(form, "s2e", "6:00 PM"); // 5h
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("9h");
  });

  it("errors on a half-filled session", () => {
    const { form, errors, result } = mount();
    set(form, "s1s", "9:00 AM");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });
});
