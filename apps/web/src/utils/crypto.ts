/**
 * Secure LocalStorage wrapper for gourmet_* keys.
 * Tokens são gerenciados pelo backend via Authorization header.
 * Dados não-sensíveis de sessão (view ativa, preferências) são armazenados sem ofuscação.
 */
export const secureStorage = {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
