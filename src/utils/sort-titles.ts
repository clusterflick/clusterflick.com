const simplifySorting = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/^the /i, "")
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

export default simplifySorting;
