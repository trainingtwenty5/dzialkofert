// Upewnij się, że w DOM istnieje kontener na toasty
function ensureToastContainer() {
  let cont = document.querySelector('.toast-container');
  if (!cont) {
    cont = document.createElement('div');
    cont.className = 'toast-container position-fixed top-0 end-0 p-3';
    cont.style.zIndex = '1100';
    document.body.appendChild(cont);
  }
  return cont;
}

/**
 * Pokazuje toast.
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} type
 */
export function showToast(message, type = 'info') {
  const cont = ensureToastContainer();

  let bgClass = 'bg-primary';
  if (type === 'success') bgClass = 'bg-success';
  if (type === 'warning') bgClass = 'bg-warning text-dark';
  if (type === 'error')   bgClass = 'bg-danger';

  const wrapper = document.createElement('div');
  wrapper.className = `toast align-items-center text-white ${bgClass} border-0`;
  wrapper.setAttribute('role', 'alert');
  wrapper.setAttribute('aria-live', 'assertive');
  wrapper.setAttribute('aria-atomic', 'true');

  wrapper.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  cont.appendChild(wrapper);

  // Bootstrap Toast API
  const bsToast = new bootstrap.Toast(wrapper, { delay: 4000 });
  bsToast.show();
  wrapper.addEventListener('hidden.bs.toast', () => wrapper.remove());
}
