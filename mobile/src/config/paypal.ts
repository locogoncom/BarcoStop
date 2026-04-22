/**
 * PayPal configuration and utilities.
 * This is a placeholder for the demo.
 */

/**
 * Builds a PayPal.Me URL for donations or payments.
 * @param amount The amount to request.
 * @param fee Optional fee to add.
 * @returns A formatted PayPal.Me URL.
 */
export const buildPayPalMeUrl = (amount: number, fee: number = 0): string => {
  const total = amount + fee;
  // Placeholder PayPal.Me handle for BarcoStop demo
  const handle = 'BarcoStopApp';
  return `https://www.paypal.com/paypalme/${handle}/${total}`;
};
