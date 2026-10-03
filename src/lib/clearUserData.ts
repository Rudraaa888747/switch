/**
 * Clears all per-user device state on logout / account switch.
 * Called from Auth logout and admin logout so the next guest or account
 * never inherits the previous account's bag, wishlist, or cached profile.
 */
export const clearLocalUserData = () => {
  try {
    localStorage.removeItem('cart');
    localStorage.removeItem('switch-wishlist');
    localStorage.removeItem('recently_viewed');

    // Per-user profile caches (switch_profile_cache:<userId>)
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('switch_profile_cache:')) {
        stale.push(key);
      }
    }
    stale.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable (private mode) — memory guards still apply.
  }

  try {
    sessionStorage.removeItem('checkout_address');
    sessionStorage.removeItem('checkout_idempotency_key');
    sessionStorage.removeItem('behavior_session_id');
    // Legacy key from when admin state was mirrored to storage (never read).
    sessionStorage.removeItem('admin_session');
  } catch {
    // ignore
  }
};
