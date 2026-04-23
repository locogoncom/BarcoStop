export const buildPayPalMeUrl = (username: string, amount: number) => {
  return `https://www.paypal.com/paypalme/${username}/${amount}`;
};
