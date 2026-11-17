/* global afterEach */
import { act } from "react";
import { createRoot } from "react-dom/client";

const mountedViews = new Set();

export async function render(element) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const view = {
    container,
    rerender: async (nextElement) => { await act(async () => { root.render(nextElement); }); },
    unmount: async () => { await act(async () => { root.unmount(); }); container.remove(); mountedViews.delete(view); },
  };
  mountedViews.add(view);
  await view.rerender(element);
  return view;
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

export async function change(field, value) {
  await act(async () => {
    const prototype = field.tagName === "SELECT" ? HTMLSelectElement.prototype : field.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(field, value);
    field.dispatchEvent(new Event(field.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
}

export async function submit(form) {
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}

afterEach(async () => {
  for (const view of [...mountedViews]) await view.unmount();
});
