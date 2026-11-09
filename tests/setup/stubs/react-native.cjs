// Lo mínimo de React Native que usan los stores.
module.exports = {
  Platform: { OS: 'web', select: (o) => (o.web !== undefined ? o.web : o.default) },
  AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
};
