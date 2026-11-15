import { Language, Product } from '../types';

export function buildProductWhatsappUrl(
  whatsappNumber: string,
  product: Product,
  qty: number,
  lang: Language,
): string {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const total = unitPrice * qty;
  const productName = lang === 'gu' ? `${product.nameGu} (${product.nameEn})` : product.nameEn;

  const message = [
    `Namaste Hast Kala!`,
    `I would like to order this handcrafted item:`,
    ``,
    `*Product:* ${productName}`,
    `*Quantity:* ${qty}`,
    `*Price:* ₹${unitPrice.toLocaleString('en-IN')} × ${qty} = ₹${total.toLocaleString('en-IN')}`,
    ``,
    `Please confirm availability and share delivery steps.`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
