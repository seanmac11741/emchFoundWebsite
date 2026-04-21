export function cardsPerRow(count, max = 4) {
  if (count <= 2) return count;
  for (let n = max; n >= 2; n--) {
    if (count % n !== 1) return n;
  }
  return 1;
}

export function applyCardsPerRow(container, count) {
  if (!container) return;
  container.style.setProperty('--cards-per-row', String(cardsPerRow(count, 4)));
  container.style.setProperty('--cards-per-row-tablet', String(cardsPerRow(count, 2)));
}
