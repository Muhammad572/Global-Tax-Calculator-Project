import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./salaryToHourly";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="sh">
      <form novalidate>
        <input name="amount"/>
        <select name="dir"><option value="salary-to-hourly">s2h</option><option value="hourly-to-salary">h2s</option></select>
        <input name="hpw" value="40"/><input name="wpy" value="52"/>
        <input name="pto"/><input name="hol"/>
        <input name="amount2"/><input name="amount3"/>
        <div data-compare-out hidden></div>
        <button type="submit">C</button><button type="reset">R</button>
      </form>
      <div data-errors hidden></div><div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='sh']")!;
  init(root);
  const form = root.querySelector("form")!;
  return {
    form,
    result: root.querySelector<HTMLElement>("[data-result]")!,
    errors: root.querySelector<HTMLElement>("[data-errors]")!,
    compareOut: root.querySelector<HTMLElement>("[data-compare-out]")!,
  };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/salary-to-hourly-calculator/"));

describe("salary to hourly island", () => {
  it("$52,000/yr -> $25.00/hr and a full pay-period table", () => {
    const { form, result } = mount();
    set(form, "amount", "52000");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$25.00");
    expect(result.textContent).toContain("$1,000.00"); // weekly
    expect(result.textContent).toContain("$2,000.00"); // biweekly
  });

  it("reverse: $30/hr -> $62,400/yr", () => {
    const { form, result } = mount();
    set(form, "dir", "hourly-to-salary");
    set(form, "amount", "30");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$62,400.00");
  });

  it("effective hourly after PTO is higher than nominal", () => {
    const { form, result } = mount();
    set(form, "amount", "52000");
    set(form, "pto", "15");
    set(form, "hol", "10");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent?.toLowerCase()).toContain("effective hourly");
    // 52000 / (2080 - 200) = 27.66
    expect(result.textContent).toContain("$27.66");
  });

  it("37.5h week changes the hourly rate", () => {
    const { form, result } = mount();
    set(form, "amount", "60000");
    set(form, "hpw", "37.5");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$30.77");
  });

  it("comparison table appears with 2+ amounts", () => {
    const { form, compareOut } = mount();
    set(form, "amount", "50000");
    set(form, "amount2", "60000");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(compareOut.hidden).toBe(false);
    expect(compareOut.textContent).toContain("$24.04"); // 50k/2080
    expect(compareOut.textContent).toContain("$28.85"); // 60k/2080
  });

  it("requires an amount", () => {
    const { form, errors, result } = mount();
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });
});
