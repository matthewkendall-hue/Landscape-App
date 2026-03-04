/**
 * Simple modal dialog utility.
 * Creates a modal overlay with a content area and close button.
 */

let modalEl = null;

function ensureModal() {
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.id = 'modal-overlay';
  modalEl.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title"></span>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body"></div>
    </div>`;
  document.body.appendChild(modalEl);

  modalEl.querySelector('.modal-close').onclick = closeModal;
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) closeModal();
  });

  return modalEl;
}

export function openModal(title, contentFn) {
  const modal = ensureModal();
  modal.querySelector('.modal-title').textContent = title;
  const body = modal.querySelector('.modal-body');
  body.innerHTML = '';
  contentFn(body);
  modal.classList.add('visible');
}

export function closeModal() {
  if (modalEl) modalEl.classList.remove('visible');
}
