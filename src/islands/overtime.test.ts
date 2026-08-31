import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./overtime";

function mount() {
  document.body.innerHTML = `
    <div class="calc" data-calc="ot">
      <form novalidate>
        <input name="rate"/>
        <select name="jur">
          <option value="us-flsa">FLSA</option>
          <option value="ca-on">ON</option>
          <option value="custom">Custom</option>
        </select>
        <input type="radio" name="mode" value="total" checked/>
        <input type="radio" name="mode" value="split"/>
        <input name="total"/>
        <input name="reg"/><input name="ot"/>
        <input name="thresh" value="40"/><input name="mult" value="1.5"/>
        <div data-total-field></div><div data-split-fields hidden></div><div data-custom-fields hidden></div>
        <button type="submit">Calc</button><button type="reset">Reset</button>
      </form>
      <div data-errors hidden></div>
      <div data-result hidden></div>
      <div data-result-actions hidden><button data-action="copy">Copy</button></div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='ot']")!;
  init(root);
  const form = root.querySelector("form")!;
  return { form, result: root.querySelector<HTMLElement>("[data-result]")!, errors: root.querySelector<HTMLElement>("[data-errors]")! };
}
function set(form: HTMLFormElement, name: string, value: string) {
  const el = form.elements.namedItem(name) as HTMLInputElement | RadioNodeList;
  if (el instanceof RadioNodeList) {
    for (const r of Array.from(el)) {
      const radio = r as HTMLInputElement;
      radio.checked = radio.value === value;
    }
    (el[0] as HTMLInputElement).dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

beforeEach(() => history.replaceState(null, "", "/calculators/overtime-calculator/"));

describe("overtime island", () => {
  it("FLSA: $20, 45 total hours -> $950 gross, 5h overtime", () => {
    const { form, result } = mount();
    set(form, "rate", "20");
    set(form, "total", "45");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("$950.00");
    expect(result.textContent).toContain("5.00");
  });

  it("Ontario: overtime after 44h", () => {
    const { form, result } = mount();
    set(form, "rate", "30");
    set(form, "jur", "ca-on");
    set(form, "total", "50");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 44 reg + 6 OT ; 6 * 45 = 270 ; 44*30=1320 ; total 1590
    expect(result.textContent).toContain("$1,590.00");
  });

  it("split mode uses regular + overtime hours directly", () => {
    const { form, result } = mount();
    set(form, "rate", "20");
    set(form, "mode", "split");
    set(form, "reg", "38");
    set(form, "ot", "4");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 38*20 + 4*30 = 760 + 120 = 880
    expect(result.textContent).toContain("$880.00");
  });

  it("custom threshold and multiplier", () => {
    const { form, result } = mount();
    set(form, "rate", "10");
    set(form, "jur", "custom");
    set(form, "thresh", "35");
    set(form, "mult", "2");
    set(form, "total", "40");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 35*10 + 5*20 = 350 + 100 = 450
    expect(result.textContent).toContain("$450.00");
  });

  it("requires an hourly rate", () => {
    const { form, errors, result } = mount();
    set(form, "total", "45");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(errors.textContent?.toLowerCase()).toContain("hourly rate");
    expect(result.hidden).toBe(true);
  });
});
