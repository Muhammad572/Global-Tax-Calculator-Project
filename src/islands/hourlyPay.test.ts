import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./hourlyPay";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="hp">
      <form novalidate>
        <input name="rate"/><input name="hpw" value="40"/><input name="ot"/><input name="mult" value="1.5"/>
        <select name="period">
          <option value="weekly">w</option><option value="biweekly">bw</option>
          <option value="monthly">m</option><option value="annual">y</option>
        </select>
        <input name="wpy" value="52"/>
        <button type="submit">C</button><button type="reset">R</button>
      </form>
      <div data-errors hidden></div><div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='hp']")!;
  init(root);
  const form = root.querySelector("form")!;
  return { form, result: root.querySelector<HTMLElement>("[data-result]")!, errors: root.querySelector<HTMLElement>("[data-errors]")! };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/hourly-pay-calculator/"));

describe("hourly pay island", () => {
  it("$18/hr, 40h, no overtime -> $720/week, $37,440/year", () => {
    const { form, result } = mount();
    set(form, "rate", "18");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$720.00");
    expect(result.textContent).toContain("$37,440.00");
  });

  it("adds overtime and shows the blended rate", () => {
    const { form, result } = mount();
    set(form, "rate", "18");
    set(form, "ot", "6");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 40*18 + 6*27 = 720 + 162 = 882
    expect(result.textContent).toContain("$882.00");
    expect(result.textContent?.toLowerCase()).toContain("blended");
    // blended: 882 / 46 = 19.17
    expect(result.textContent).toContain("$19.17");
  });

  it("shows what overtime adds per week and per year", () => {
    const { form, result } = mount();
    set(form, "rate", "20");
    set(form, "ot", "5");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // OT adds 5*30 = 150/week, *52 = 7800/year
    expect(result.textContent).toContain("$150.00");
    expect(result.textContent).toContain("$7,800.00");
  });

  it("headline follows the period selector", () => {
    const { form, result } = mount();
    set(form, "rate", "25");
    set(form, "period", "monthly");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 25*40*52/12 = 4333.33
    expect(result.textContent).toContain("Monthly");
    expect(result.textContent).toContain("$4,333.33");
  });

  it("requires rate and hours", () => {
    const { form, errors, result } = mount();
    set(form, "rate", "20");
    set(form, "hpw", "");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });
});
