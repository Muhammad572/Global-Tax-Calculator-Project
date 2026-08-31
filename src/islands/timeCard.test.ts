import { beforeEach, describe, expect, it } from "vitest";
import { init } from "./timeCard";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mount(): { root: HTMLElement; form: HTMLFormElement; result: HTMLElement; errors: HTMLElement } {
  document.body.innerHTML = `
    <div class="calc" data-calc="time-card">
      <form class="calc__form" novalidate>
        ${DAYS.map(
          (d) => `
          <input type="text" name="${d}s" />
          <input type="text" name="${d}e" />
          <input type="number" name="${d}b" />`,
        ).join("")}
        <input type="number" name="rate" />
        <select name="jur">
          <option value="us-flsa">FLSA</option>
          <option value="ca-on">Ontario</option>
          <option value="us-ca">California</option>
        </select>
        <select name="round"><option value="0">no</option><option value="15">15</option></select>
        <button type="submit" data-action="calculate">Calculate</button>
        <button type="reset" data-action="reset">Reset</button>
      </form>
      <div class="result-errors" role="alert" data-errors hidden></div>
      <div class="result" role="status" aria-live="polite" data-result hidden></div>
      <div data-result-actions hidden>
        <button type="button" data-action="copy">Copy result</button>
      </div>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-calc='time-card']")!;
  init(root);
  return {
    root,
    form: root.querySelector("form")!,
    result: root.querySelector("[data-result]")!,
    errors: root.querySelector("[data-errors]")!,
  };
}

function set(form: HTMLFormElement, name: string, value: string): void {
  const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  history.replaceState(null, "", "/calculators/time-card-calculator/");
});

describe("time card island", () => {
  it("computes weekly hours and shows the result region", () => {
    const { form, result } = mount();
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      set(form, `${d}s`, "9:00 AM");
      set(form, `${d}e`, "5:00 PM");
      set(form, `${d}b`, "30");
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("37.50"); // 7.5h * 5
  });

  it("adds gross pay when a rate is entered, with FLSA overtime", () => {
    const { form, result } = mount();
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      set(form, `${d}s`, "8:00 AM");
      set(form, `${d}e`, "5:00 PM"); // 9h/day, no break -> 45h week
    }
    set(form, "rate", "20");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(result.textContent).toContain("Estimated gross pay");
    expect(result.textContent).toContain("$950.00"); // 40*20 + 5*30
  });

  it("shows a blocking error for a half-filled day and hides the result", () => {
    const { form, result, errors } = mount();
    set(form, "Mons", "9:00 AM"); // no end
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(errors.hidden).toBe(false);
    expect(errors.textContent?.toLowerCase()).toContain("end time");
    expect(result.hidden).toBe(true);
  });

  it("writes shareable state to the URL", () => {
    const { form } = mount();
    set(form, "Mons", "9");
    set(form, "Mone", "17");
    set(form, "rate", "25");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(location.search).toContain("Mons=9");
    expect(location.search).toContain("rate=25");
  });

  it("hydrates from the URL on init and auto-calculates", () => {
    history.replaceState(null, "", "/calculators/time-card-calculator/?Mons=9%3A00+AM&Mone=5%3A00+PM&Monb=30");
    const { result } = mount();
    expect(result.hidden).toBe(false);
    expect(result.textContent).toContain("7.50"); // 8h shift minus 30 min break

  });

  it("Ontario rule uses a 44-hour threshold", () => {
    const { form, result } = mount();
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      set(form, `${d}s`, "8:00 AM");
      set(form, `${d}e`, "5:30 PM"); // 9.5h/day -> 47.5h
    }
    set(form, "rate", "20");
    set(form, "jur", "ca-on");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    // 44 regular + 3.5 OT
    expect(result.textContent).toContain("3.50");
  });
});
