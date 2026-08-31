import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./decimalHours";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="dh">
      <form novalidate>
        <input name="single"/>
        <textarea name="bulk"></textarea>
        <div data-bulk-out hidden></div>
        <button type="submit">C</button><button type="reset">R</button>
      </form>
      <div data-errors hidden></div><div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='dh']")!;
  init(root);
  const form = root.querySelector("form")!;
  return {
    form,
    result: root.querySelector<HTMLElement>("[data-result]")!,
    errors: root.querySelector<HTMLElement>("[data-errors]")!,
    bulkOut: root.querySelector<HTMLElement>("[data-bulk-out]")!,
  };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/decimal-hours-calculator/"));

describe("decimal hours island", () => {
  it("7:45 -> 7.75", () => {
    const { form, result } = mount();
    set(form, "single", "7:45");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("7.75");
    expect(result.textContent).toContain("7h 45m");
  });

  it("decimal back to h:m — 8.6 -> 8h 36m", () => {
    const { form, result } = mount();
    set(form, "single", "8.6");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("8h 36m");
  });

  it("bad input shows an inline hint", () => {
    const { form, errors } = mount();
    set(form, "single", "banana");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
  });

  it("bulk column returns a decimal per line and a total", () => {
    const { form, bulkOut } = mount();
    set(form, "bulk", "7:45\n8:15\n6:30");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(bulkOut.hidden).toBe(false);
    expect(bulkOut.textContent).toContain("7.75");
    expect(bulkOut.textContent).toContain("8.25");
    expect(bulkOut.textContent).toContain("22.50"); // total
  });

  it("bulk skips unreadable lines", () => {
    const { form, bulkOut } = mount();
    set(form, "bulk", "8:00\nnope\n2:00");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(bulkOut.textContent?.toLowerCase()).toContain("skipped");
    expect(bulkOut.textContent).toContain("10.00");
  });
});
