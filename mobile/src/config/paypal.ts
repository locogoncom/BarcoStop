const PAYPAL_ME_USERNAME = 'BarcoStop';

export const PAYPAL_PROFILE_URL = `https://paypal.me/${PAYPAL_ME_USERNAME}`;
export const PAYPAL_CURRENCY_CODE = 'EUR';

export const buildPayPalMeUrl = (amount: number, minAmount = 0): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedAmount = Math.max(minAmount, safeAmount);
  return `${PAYPAL_PROFILE_URL}/${normalizedAmount.toFixed(2)}${PAYPAL_CURRENCY_CODE}`;
};
