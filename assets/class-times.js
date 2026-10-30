/** Keep complete starts chronological and unfinished entries at the end. */
export function sortClasses(classes) {
  const key = item => /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ? item.time : '99:99';
  return [...classes].sort((a, b) => key(a).localeCompare(key(b)));
}
