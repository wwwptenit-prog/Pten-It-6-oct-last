import { DirectMessageItem, NotificationItem, User } from '../types';

export type MarketplaceMode = 'buying' | 'selling';

export const getDirectConversationId = (userAId: string, userBId: string, orderId?: string): string =>
  orderId ? `order-${orderId}` : `chat-${[userAId, userBId].sort().join('-')}`;

type ModeScopedItem = {
  mode?: string;
  recipientRole?: string;
  category?: string;
  senderRole?: string;
  title?: string;
  message?: string;
};

const getInferredMode = (item: ModeScopedItem): MarketplaceMode | 'all' | undefined => {
  if (item.mode === 'buying' || item.mode === 'selling') return item.mode;
  if (item.mode === 'all' || item.mode === 'both' || item.recipientRole === 'all' || item.recipientRole === 'admin') return 'all';

  const recipientRole = item.recipientRole?.toLowerCase();
  if (recipientRole === 'seller' || recipientRole === 'instructor' || recipientRole === 'mentor') return 'selling';
  if (recipientRole === 'buyer' || recipientRole === 'customer' || recipientRole === 'student') return 'buying';

  const category = item.category?.toLowerCase();
  if (category === 'seller' || category === 'payout' || category === 'mentor') return 'selling';
  if (category === 'buyer' || category === 'course' || category === 'enrollment') return 'buying';

  const senderRole = item.senderRole?.toLowerCase();
  if (senderRole === 'seller' || senderRole === 'instructor' || senderRole === 'mentor' || senderRole === 'specialist') return 'buying';
  if (senderRole === 'buyer' || senderRole === 'customer' || senderRole === 'student') return 'selling';

  const text = `${item.title || ''} ${item.message || ''}`.toLowerCase();
  const sellerTerms = ['সেলার', 'ক্লায়েন্ট', 'ক্লাইন্ট', 'উইথড্র', 'পেআউট', 'পেমেন্ট রিকোয়েস্ট', 'seller', 'payout', 'withdraw'];
  const buyerTerms = ['বায়ার', 'বায়ার', 'কোর্স', 'অ্যাসাইনমেন্ট', 'এনরোলমেন্ট', 'buyer', 'course', 'assignment', 'enrollment'];
  const sellerMatch = sellerTerms.some(term => text.includes(term));
  const buyerMatch = buyerTerms.some(term => text.includes(term));
  if (sellerMatch !== buyerMatch) return sellerMatch ? 'selling' : 'buying';

  return undefined;
};

export const isNotificationInMarketplaceMode = (
  notification: NotificationItem,
  mode: MarketplaceMode
): boolean => {
  const inferredMode = getInferredMode(notification);
  return inferredMode === undefined || inferredMode === 'all' || inferredMode === mode;
};

export const isDirectMessageInMarketplaceMode = (
  _message: DirectMessageItem,
  _mode: MarketplaceMode
): boolean => {
  return true;
};

export const isNotificationVisibleToUser = (
  notification: NotificationItem,
  user: User | null,
  mode: MarketplaceMode
): boolean => {
  if (!user || !isNotificationInMarketplaceMode(notification, mode)) return false;

  const recipientId = notification.recipientId;
  if (recipientId && recipientId !== 'all') {
    if (recipientId !== user.id && recipientId !== user.email) return false;
  }

  const recipientEmail = notification.recipientEmail;
  if (recipientEmail && recipientEmail !== 'all') {
    if (!user.email || recipientEmail.toLowerCase() !== user.email.toLowerCase()) return false;
  }

  const isAdmin = user.role === 'admin' || user.roles?.includes('admin');
  if (notification.recipientRole === 'admin' || notification.targetTab === 'admin') return isAdmin;
  if (notification.recipientRole && notification.recipientRole !== 'all') {
    if (notification.recipientRole === 'seller' && mode !== 'selling') return false;
    if (notification.recipientRole === 'buyer' && mode !== 'buying') return false;
    if (notification.recipientRole === 'seller' && !(
      user.role === 'instructor' || user.role === 'specialist' ||
      user.roles?.includes('instructor') || user.roles?.includes('specialist') ||
      user.isSeller || user.isMentor
    )) return false;
    if (notification.recipientRole === 'buyer' && !(
      user.role === 'customer' || user.role === 'student' ||
      user.roles?.includes('customer') || user.roles?.includes('student')
    )) return false;
    if (notification.recipientRole !== 'seller' && notification.recipientRole !== 'buyer' && !isAdmin) return false;
    return true;
  }
  if (recipientId && recipientId !== 'all') return true;
  if (recipientEmail && recipientEmail !== 'all') return true;
  return notification.isBroadcast === true;
};

export const isDirectMessageVisibleToUser = (
  message: DirectMessageItem,
  user: User | null,
  mode: MarketplaceMode
): boolean => {
  if (!user) return false;
  return message.senderId === user.id ||
    message.recipientId === user.id ||
    Boolean(user.email && (
      message.senderEmail?.toLowerCase() === user.email.toLowerCase() ||
      message.recipientEmail?.toLowerCase() === user.email.toLowerCase()
    ));
};
