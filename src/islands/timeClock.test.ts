import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./timeClock";

function mount() {
  const rows = Array.from({ length: 12 }, (_, i) => `<input name="in${i}"/><input name="out${i}"/>`).join("");
  document.body.innerHTML = `
    <div class="calc" data-calc="tc">
      <form novalidate>${rows}<input name="brk"/><input name="rate"/>
        <button type="submit">C</button><button type="reset">R</button></form>
      <div data-errors hidden></div><div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">c</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='tc']")!;
  init(root);
  const form = root.querySelector("form")!;
  return { form, result: root.querySelector<HTMLElement>("[data-result]")!, errors: root.querySelector<HTMLElement>("[data-errors]")! };
}
const set = (f: HTMLFormElement, n: string, v: string) => {
  const el = f.elements.namedItem(n) as HTMLInputElement;
  el.value = v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
beforeEach(() => history.replaceState(null, "", "/calculators/time-clock-calculator/"));

describe("time clock island", () => {
  it("totals punch pairs into decimal hours (24h input)", () => {
    const { form, result } = mount();
    set(form, "in0", "0800");
    set(form, "out0", "1631"); // 8h31 = 8.52
    set(form, "in1", "0900");
    set(form, "out1", "1730"); // 8.5
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("17.02"); // 8.52 + 8.50
  });

  it("deducts a per-pair break", () => {
    const { form, result } = mount();
    set(form, "in0", "9:00 AM");
    set(form, "out0", "5:00 PM");
    set(form, "brk", "60");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("7.00");
  });

  it("computes pay = rate x decimal hours (no overtime split)", () => {
    const { form, result } = mount();
    set(form, "in0", "8:00 AM");
    set(form, "out0", "6:00 PM"); // 10h
    set(form, "rate", "20");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$200.00"); // flat 10*20, NOT 40/OT logic
  });

  it("flags an incomplete punch pair", () => {
    const { form, errors, result } = mount();
    set(form, "in0", "0800");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(result.hidden).toBe(true);
  });
});
