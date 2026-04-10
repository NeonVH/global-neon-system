export function renderLoadingCards(count = 3) {
  return `
    <div class="grid-cards">
      ${Array.from({ length: count }).map(() => `
        <div class="glass-panel" style="padding:1rem;">
          <div class="skeleton" style="height:10rem;margin-bottom:1rem;"></div>
          <div class="skeleton" style="height:1.2rem;width:60%;margin-bottom:0.7rem;"></div>
          <div class="skeleton" style="height:0.9rem;width:85%;margin-bottom:0.45rem;"></div>
          <div class="skeleton" style="height:0.9rem;width:70%;"></div>
        </div>
      `).join("")}
    </div>
  `;
}
