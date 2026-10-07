import { MarketplaceOrder } from '../types';

export const isWorkFirstOrder = (order: Partial<MarketplaceOrder> | null | undefined): boolean => {
  if (!order) return false;
  if (order.isWorkFirst === true || order.offerType === 'work_first') return true;

  const orderModeText = `${order.paymentMethod || ''} ${order.deliveryNote || ''}`.toLowerCase();
  return orderModeText.includes('pay after delivery') ||
    orderModeText.includes('pay after work') ||
    orderModeText.includes('work first') ||
    orderModeText.includes('আগে কাজ');
};
