import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./takeHome";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="th">
      <form novalidate>
        <input name="salary"/>
        <select name="freq"><option value="weekly">w</option><option value="biweekly" selected>bw</option><option value="monthly">m</option></select>
        <select name="filing"><option value="single">s</option><option value="mfj">m</option></select>
        <select name="state"><option value="none">none</option><option value="TX">TX</option><option value="CA">CA</option><option value="other">other</option></select>
        <input name="pretax"/><input type="checkbox" name="step2"/>
        <button type="submit">C</button><button type="reset">R</button>
      </form>
      <div data-errors hidden></div><div data-notice hidden></div><div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='th']")!;
  init(root);
  const form = root.querySelector("form")!;
  return {
    form,
    result: root.querySelector<HTMLElement>("[data-result]")!,
    errors: root.querySelector<HTMLElement>("[data-errors]")!,
    notice: root.querySelector<HTMLElement>("[data-notice]")!,
  };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/take-home-pay-calculator/"));

describe("take-home island", () => {
  it("shows annual, monthly, and per-paycheck take-home for $90k TX single", () => {
    const { form, result } = mount();
    set(form, "salary", "90000");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("Take-home per year");
    expect(result.textContent).toContain("Take-home per month");
    expect(result.textContent).toContain("Take-home per paycheck");
    expect(result.textContent).toContain("Effective withholding rate");
  });

  it("annual = per-paycheck x paychecks (consistency)", () => {
    const { form, result } = mount();
    set(form, "salary", "78000");
    set(form, "state", "CA");
    set(form, "freq", "biweekly");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    const text = result.textContent ?? "";
    const perYear = Number(text.match(/Take-home per year([\d,]+\.\d\d)/)?.[1]?.replace(/[$,]/g, "") ?? "0");
    const perCheck = Number(text.match(/Take-home per paycheck \(biweekly\)([\d,]+\.\d\d)/)?.[1]?.replace(/[$,]/g, "") ?? "0");
    expect(Math.abs(perYear - perCheck * 26)).toBeLessThan(1);
  });

  it("unsupported state -> notice mentions Canada/UK/Australia and universal tools", () => {
    const { form, notice } = mount();
    set(form, "salary", "80000");
    set(form, "state", "other");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(notice.hidden).toBe(false);
    expect(notice.textContent).toMatch(/Canada|UK|Australia/);
    expect(notice.textContent).toContain("Salary to Hourly");
  });

  it("pre-tax annual contribution raises take-home rate impact", () => {
    const { form, result } = mount();
    set(form, "salary", "100000");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    const before = result.textContent ?? "";
    set(form, "pretax", "10000");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    const after = result.textContent ?? "";
    expect(before).not.toEqual(after);
    expect(after).toContain("Pre-tax deductions");
  });

  it("requires a salary", () => {
    const { form, errors, result } = mount();
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });
});
