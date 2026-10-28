/** All money in tests is integer paise, same as the app. */
export const rupees = (paise: number): string =>
  '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const paise = (rupeeAmount: number): number => Math.round(rupeeAmount * 100);
