(() => {
  'use strict';
  const key = 'briefdrop.avatar';
  const avatars = [...document.querySelectorAll('.avatar')];

  function parsePhoto(value) {
    try {
      const photo = JSON.parse(value);
      return typeof photo === 'string' ? photo : null;
    } catch (_) {
      return null;
    }
  }

  function applyPhoto(photo) {
    avatars.forEach((avatar) => {
      let image = avatar.querySelector('img');
      if (!photo) {
        if (image && image.dataset.profilePhoto === 'true') image.remove();
        else if (image && image.dataset.defaultSrc) image.src = image.dataset.defaultSrc;
        return;
      }

      if (!image) {
        image = document.createElement('img');
        image.alt = '';
        image.dataset.profilePhoto = 'true';
        avatar.append(image);
      }
      if (!image.dataset.defaultSrc) image.dataset.defaultSrc = image.getAttribute('src') || '';
      image.onerror = () => {
        image.onerror = null;
        if (image.dataset.defaultSrc) image.src = image.dataset.defaultSrc;
        else image.remove();
      };
      image.src = photo;
    });
  }

  try {
    applyPhoto(parsePhoto(localStorage.getItem(key)));
  } catch (_) {
    applyPhoto(null);
  }

  addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) applyPhoto(parsePhoto(event.newValue));
  });
})();
