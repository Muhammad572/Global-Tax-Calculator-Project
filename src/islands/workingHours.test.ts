import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./workingHours";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="wh">
      <form novalidate>
        <input name="hpw" value="40"/><input name="dpw" value="5"/><input name="wpy" value="52"/>
        <input name="pto"/><input name="hol"/><input name="year" value="2025"/><input name="ft" value="40"/>
        <button type="submit">C</button><button type="reset">R</button></form>
      <div data-errors hidden></div><div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='wh']")!;
  init(root);
  const form = root.querySelector("form")!;
  return { form, result: root.querySelector<HTMLElement>("[data-result]")!, errors: root.querySelector<HTMLElement>("[data-errors]")! };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/working-hours-calculator/"));

describe("working hours island", () => {
  it("shows a default result on load (40h/week -> 2,080/year)", () => {
    const { result } = mount();
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("2,080");
  });

  it("part-time 30h/week -> 1,560/year", () => {
    const { form, result } = mount();
    set(form, "hpw", "30");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("1,560");
  });

  it("subtracts PTO + holidays", () => {
    const { form, result } = mount();
    set(form, "pto", "15");
    set(form, "hol", "10");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 2080 - 25*8 = 1880
    expect(result.textContent).toContain("1,880");
  });

  it("shows business days for the year", () => {
    const { form, result } = mount();
    set(form, "year", "2025");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("261");
  });

  it("FTE for 20h against 40h full-time = 0.50", () => {
    const { form, result } = mount();
    set(form, "hpw", "20");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("0.50");
  });

  it("rejects zero hours per week", () => {
    const { form, errors, result } = mount();
    set(form, "hpw", "0");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });
});
