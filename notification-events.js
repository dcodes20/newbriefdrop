(() => {
  'use strict';

  const KEY = 'briefdrop.notifs';

  function record(notification) {
    if (!notification || !notification.id || !notification.type || !notification.title) return;

    try {
      const current = JSON.parse(localStorage.getItem(KEY) || '[]');
      const items = Array.isArray(current) ? current : [];
      const previous = items.find((item) => item.id === notification.id);
      const next = {
        ...previous,
        ...notification,
        at: Date.now(),
        read: false,
      };
      const updated = items.filter((item) => item.id !== notification.id);
      updated.unshift(next);
      localStorage.setItem(KEY, JSON.stringify(updated.slice(0, 100)));
    } catch (error) {
      console.error('Unable to update BriefDrop notifications.', error);
    }
  }

  window.BriefDropNotifications = { record };
})();
