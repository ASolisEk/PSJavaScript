// AsyncStorage en memoria (se puede revisar y vaciar desde las pruebas).
const data = new Map();
const storage = {
  data,
  async getItem(k) {
    return data.has(k) ? data.get(k) : null;
  },
  async setItem(k, v) {
    data.set(k, String(v));
  },
  async removeItem(k) {
    data.delete(k);
  },
  async getAllKeys() {
    return [...data.keys()];
  },
  async multiRemove(keys) {
    for (const k of keys) data.delete(k);
  },
  async clear() {
    data.clear();
  },
};
module.exports = { __esModule: true, default: storage };
