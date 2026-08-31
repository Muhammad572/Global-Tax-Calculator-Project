import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./timeCalculator";

function mount() {
  const rows = Array.from({ length: 6 }, (_, i) => `
    <select name="op${i}"><option value="+">+</option><option value="-">-</option></select>
    <input name="h${i}"/><input name="m${i}"/><input name="s${i}"/>`).join("");
  document.body.innerHTML = `
    <div class="calc" data-calc="tcl">
      <form novalidate>${rows}<input type="checkbox" name="sec" checked/>
        <button type="submit">C</button><button type="reset">R</button></form>
      <div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='tcl']")!;
  init(root);
  const form = root.querySelector("form")!;
  return { form, result: root.querySelector<HTMLElement>("[data-result]")! };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/time-calculator/"));

describe("time calculator island", () => {
  it("adds durations and carries minutes", () => {
    const { form, result } = mount();
    set(form, "h0", "2"); set(form, "m0", "45");
    set(form, "h1", "1"); set(form, "m1", "30");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("4:15:00");
  });

  it("subtracts and can go negative", () => {
    const { form, result } = mount();
    set(form, "h0", "1");
    set(form, "op1", "-"); set(form, "h1", "2");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("−1:00:00");
    expect(result.textContent?.toLowerCase()).toContain("negative");
  });

  it("reports decimal hours and total minutes", () => {
    const { form, result } = mount();
    set(form, "h0", "7"); set(form, "m0", "30");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("7.5"); // decimal
    expect(result.textContent).toContain("450"); // minutes
  });

  it("no terms -> no result", () => {
    const { form, result } = mount();
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.hidden).toBe(true);
  });
});
