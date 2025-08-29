export const toCamelTitle = (s = "") =>
  s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");

export const applyTextCase = (s = "", mode = "Capital") => {
  if (mode === "Capital") return s.toUpperCase();
  // "Camel"
  return toCamelTitle(s);
};
