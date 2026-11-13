import { escapeHtml } from '../util.js';
import { FINAL_MESSAGE, FINAL_PHOTO, FINAL_PHOTO_ALT } from '../content.js';

// Beat 5: the recovered message. The one part of VampireOS that works
// perfectly, so there are no glitches and no jokes here.

function messageBlock() {
  if (!FINAL_MESSAGE) {
    return `
      <div class="letter-placeholder dawn dawn--4">
        <div class="letter-placeholder-label">[ SOFI'S BIRTHDAY MESSAGE ]</div>
        <div>Placeholder. The final text is still being written.</div>
      </div>`;
  }
  const paragraphs = FINAL_MESSAGE.trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join('');
  return `<div class="letter-body dawn dawn--4">${paragraphs}</div>`;
}

function photoBlock() {
  const inner = FINAL_PHOTO
    ? `<img class="photo-img" src="${FINAL_PHOTO}" alt="${escapeHtml(FINAL_PHOTO_ALT)}" />`
    : '<div class="photo-placeholder">[ PHOTO: David, Sofi &amp; her partner ]</div>';
  return `<div class="photo-wrap dawn dawn--5"><div class="photo">${inner}</div></div>`;
}

export function mountLetter(root) {
  root.innerHTML = `
    <article class="letter">
      <div class="letter-file dawn dawn--1">gift/birthday_letter.txt</div>
      <div class="letter-open">
        <div class="sofi-wrap dawn dawn--1">
          <div class="sofi" role="img" aria-label="Sofi, drawn in pixel art, wearing a pink sweater and blinking"></div>
          <div class="sofi-ground" aria-hidden="true"></div>
        </div>
        <div class="bubble-wrap dawn dawn--2">
          <p class="bubble">Okay, I might not understand what you do for a living. Or how your backend works. Or what RAP actually means.<span class="bubble-tail" aria-hidden="true"></span></p>
        </div>
      </div>
      <p class="letter-turn dawn dawn--3">But there's one thing I'm absolutely sure of.</p>
      ${messageBlock()}
      ${photoBlock()}
      <svg class="heart dawn dawn--6" aria-hidden="true" viewBox="0 0 9 8" width="27" height="24" shape-rendering="crispEdges">
        <path fill="#c8102e" d="M1 0h2v1H1zM6 0h2v1H6zM0 1h4v1H0zM5 1h4v1H5zM0 2h9v2H0zM1 4h7v1H1zM2 5h5v1H2zM3 6h3v1H3zM4 7h1v1H4z"/>
      </svg>
    </article>
  `;
  return null;
}
