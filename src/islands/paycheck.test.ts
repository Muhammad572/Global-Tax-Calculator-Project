import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./paycheck";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="pc">
      <form novalidate>
        <input type="radio" name="mode" value="salary" checked/><input type="radio" name="mode" value="hourly"/><input type="radio" name="mode" value="annual"/>
        <select name="freq"><option value="weekly">w</option><option value="biweekly" selected>bw</option><option value="monthly">m</option></select>
        <div data-salary-fields><input name="gross"/></div>
        <div data-annual-fields hidden><input name="salary"/></div>
        <div data-hourly-fields hidden><input name="rate"/><input name="reghrs"/><input name="othrs"/><input name="otmult" value="1.5"/></div>
        <select name="filing"><option value="single">s</option><option value="mfj">m</option></select>
        <select name="state">
          <option value="none">none</option><option value="TX">TX</option><option value="CA">CA</option><option value="other">other</option>
        </select>
        <input type="checkbox" name="step2"/><input name="dep"/><input name="extra"/><input name="pretax"/>
        <button type="submit">C</button><button type="reset">R</button>
      </form>
      <div data-errors hidden></div>
      <div data-notice hidden></div>
      <div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='pc']")!;
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
  const el = f.elements.namedItem(n);
  if (el instanceof RadioNodeList) {
    for (const r of Array.from(el)) (r as HTMLInputElement).checked = (r as HTMLInputElement).value === v;
    (el[0] as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
  } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
    el.checked = v === "1";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (el) {
    (el as HTMLInputElement).value = v;
    (el as HTMLInputElement).dispatchEvent(new Event("input", { bubbles: true }));
  }
};
beforeEach(() => history.replaceState(null, "", "/calculators/paycheck-calculator/"));

describe("paycheck island", () => {
  it("salary mode: TX biweekly $2,500 -> net < gross, FICA line present", () => {
    const { form, result } = mount();
    set(form, "gross", "2500");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("Social Security");
    expect(result.textContent).toContain("Take-home pay");
    expect(result.textContent).toContain("Effective withholding rate");
  });

  it("hourly mode: rate x hours + overtime feeds gross", () => {
    const { form, result } = mount();
    set(form, "mode", "hourly");
    set(form, "rate", "22");
    set(form, "reghrs", "80");
    set(form, "othrs", "4");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // gross = 80*22 + 4*33 = 1760 + 132 = 1892
    expect(result.textContent).toContain("$1,892.00");
  });

  it("unsupported state shows the notice, still shows federal + FICA", () => {
    const { form, result, notice } = mount();
    set(form, "gross", "2500");
    set(form, "state", "other");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(notice.hidden).toBe(false);
    expect(notice.textContent?.toLowerCase()).toMatch(/not.*supported|supported.*yet/);
    expect(result.textContent).toContain("Federal income tax");
    expect(notice.textContent).toContain("Time Card");
  });

  it("CA state adds a state income tax line", () => {
    const { form, result } = mount();
    set(form, "gross", "3000");
    set(form, "state", "CA");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("California income tax");
  });

  it("requires gross pay in salary mode", () => {
    const { form, errors, result } = mount();
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });

  it("no-tax state shows a 'no state income tax' line, not a fabricated number", () => {
    const { form, result } = mount();
    set(form, "gross", "2500");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent?.toLowerCase()).toContain("no state income tax");
  });

  // Annual-salary mode: merged in from the former Take-Home Pay Calculator.
  it("annual mode: shows per-year, per-month and per-paycheck take-home", () => {
    const { form, result } = mount();
    set(form, "mode", "annual");
    set(form, "salary", "90000");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("Take-home per year");
    expect(result.textContent).toContain("Take-home per month");
    expect(result.textContent).toContain("Estimated take-home pay per 2 weeks");
  });

  it("annual mode: per-year = per-paycheck x 26 (consistency)", () => {
    const { form, result } = mount();
    set(form, "mode", "annual");
    set(form, "salary", "78000");
    set(form, "state", "CA");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    const text = result.textContent ?? "";
    const money = (re: RegExp) => Number(text.match(re)?.[1]?.replace(/[$,]/g, "") ?? "NaN");
    const perYear = money(/Take-home per year\$?([\d,]+\.\d\d)/);
    const perCheck = money(/Estimated take-home pay per 2 weeks\$?([\d,]+\.\d\d)/);
    expect(Number.isFinite(perYear) && perYear > 0).toBe(true);
    expect(Math.abs(perYear - perCheck * 26)).toBeLessThan(1);
  });

  it("annual mode: requires the salary and ignores the per-paycheck field", () => {
    const { form, errors, result } = mount();
    set(form, "mode", "annual");
    set(form, "gross", "2500");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.textContent).toContain("annual salary");
    expect(result.hidden).toBe(true);
  });

  it("annual mode is kept in the shareable URL and restored from it", () => {
    const { form } = mount();
    set(form, "mode", "annual");
    set(form, "salary", "90000");
    set(form, "state", "TX");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(location.search).toContain("mode=annual");
    expect(location.search).toContain("salary=90000");

    const again = mount(); // re-mount hydrates from the URL written above
    const mode = again.form.elements.namedItem("mode") as RadioNodeList;
    expect(mode.value).toBe("annual");
    expect(again.result.textContent).toContain("Take-home per year");
  });
});
