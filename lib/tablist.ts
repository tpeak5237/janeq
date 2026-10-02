import type { KeyboardEvent } from "react";

export function handleTabListKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
): void {
  const { key } = event;
  if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") {
    return;
  }

  const tabList = event.currentTarget.closest<HTMLElement>('[role="tablist"]');
  const tabs = Array.from(
    tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
  );
  const currentIndex = tabs.indexOf(event.currentTarget);
  if (currentIndex < 0 || tabs.length < 2) return;

  let nextIndex: number;
  if (key === "Home") {
    nextIndex = 0;
  } else if (key === "End") {
    nextIndex = tabs.length - 1;
  } else {
    const direction = getComputedStyle(tabList!).direction === "rtl" ? -1 : 1;
    const step = (key === "ArrowRight" ? 1 : -1) * direction;
    nextIndex = (currentIndex + step + tabs.length) % tabs.length;
  }

  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}
