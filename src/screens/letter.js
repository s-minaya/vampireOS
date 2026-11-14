import { escapeHtml, onAction } from '../util.js';
import { LETTER_OPENING, LETTER_BODY, LETTER_CLOSING, LETTER_SIGNED, FINAL_PHOTO, FINAL_PHOTO_ALT } from '../content.js';
import favoriting from '../assets/favoriting.webp';
import favoritingStamp from '../assets/favoriting-stamp.webp';
import favoritingSparkle from '../assets/favoriting-sparkle.webp';
import luisFavoriting from '../assets/luis-favoriting.webp';

// Beat 5: birthday_letter.txt, recovered from the initial commit. The one part of
// VampireOS that works perfectly: no glitches, no jokes, nobody talks. Sofi and Luis
// present the letter looking ridiculously cool (005-favoriting; Luis stands still),
// then the letter itself, the photo of the three of them and PLAY AGAIN.

const paragraph = (text, className = '') => `<p${className ? ` class="${className}"` : ''}>${escapeHtml(text)}</p>`;

// "Feliz cumpleaños, David." is set a little larger; the text itself is untouched.
const body = LETTER_BODY.map((text) => paragraph(text, text.startsWith('Feliz cumpleaños') ? 'letter-wish' : '')).join('');

// Decoded ahead of time (the crypt calls this on mount) so nothing pops in once the letter opens.
let images = null;
export function preloadLetter() {
  if (images) return;
  images = [favoriting, favoritingStamp, favoritingSparkle, luisFavoriting, FINAL_PHOTO].map((src) => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => {});
    return img;
  });
}

export function mountLetter(root, app) {
  preloadLetter();
  root.innerHTML = `
    <article class="letter">
      <div class="letter-file dawn dawn--1">gift/birthday_letter.txt</div>
      <div class="duo dawn dawn--2">
        <div class="duo-figures">
          <div class="fav" role="img" aria-label="Sofi, drawn in pixel art, lowering her sunglasses to look at you and putting them back on"></div>
          <img class="duo-luis" src="${luisFavoriting}" width="208" height="228" alt="Luis, drawn in pixel art, arms crossed, in goggles and a skull bandana" />
        </div>
        <div class="duo-ground" aria-hidden="true"></div>
      </div>
      <div class="letter-text">
        <p class="letter-opening dawn dawn--3">${escapeHtml(LETTER_OPENING)}</p>
        <div class="letter-rule dawn dawn--4" aria-hidden="true"></div>
        <div class="letter-body dawn dawn--4">${body}</div>
        <div class="letter-sign dawn dawn--5">
          <p>${escapeHtml(LETTER_CLOSING)}</p>
          <p class="letter-signed">${escapeHtml(LETTER_SIGNED)}</p>
        </div>
      </div>
      <div class="photo-wrap dawn dawn--6">
        <div class="photo"><img class="photo-img" src="${FINAL_PHOTO}" width="1172" height="1559" alt="${escapeHtml(FINAL_PHOTO_ALT)}" /></div>
      </div>
      <svg class="heart dawn dawn--6" aria-hidden="true" viewBox="0 0 9 8" width="27" height="24" shape-rendering="crispEdges">
        <path fill="#c8102e" d="M1 0h2v1H1zM6 0h2v1H6zM0 1h4v1H0zM5 1h4v1H5zM0 2h9v2H0zM1 4h7v1H1zM2 5h5v1H2zM3 6h3v1H3zM4 7h1v1H4z"/>
      </svg>
      <button class="calm-btn letter-again dawn dawn--6" data-act="again">PLAY AGAIN</button>
    </article>
  `;
  // PLAY AGAIN is the same full restart as ?restart: a fresh load from the first screen,
  // with every chapter, one-time introduction, timer, listener and the song reset.
  return onAction(root, { again: () => app.restart() });
}
