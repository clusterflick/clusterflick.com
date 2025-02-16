export default function showNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}
