import { setBanner } from '../utils/svg.js';

export function initSurvey() {
  document.getElementById('btn-import').onclick = () => document.getElementById('survey-input').click();

  document.getElementById('survey-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.getElementById('survey-img');
      img.src = ev.target.result;
      img.style.display = 'block';
      document.getElementById('survey-controls').classList.add('visible');
      setBanner('Survey loaded — trace your boundaries over it', true);
      setTimeout(() => setBanner('', false), 3500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.getElementById('survey-opacity').oninput = function () {
    document.getElementById('survey-img').style.opacity = this.value / 100;
  };
}
