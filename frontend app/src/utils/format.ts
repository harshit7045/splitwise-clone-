/**
 * Formats a number as INR currency
 * @param amount - The amount to format
 * @returns Formatted string (e.g., "₹1,234.56")
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) return '₹0.00';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) return '₹0.00';

    return num.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};
