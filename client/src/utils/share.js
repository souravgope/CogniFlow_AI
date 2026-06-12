export function encodeState(value) {
  return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(value)))));
}

export function decodeState(value) {
  try {
    if (!value) return null;
    // URLSearchParams decodes '+' as ' ' (space). Restore '+' characters to make it valid base64!
    const normalized = value.replace(/ /g, "+");
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(normalized)))));
  } catch (err) {
    console.error("Failed to decode shared diagram state:", err);
    return null;
  }
}
