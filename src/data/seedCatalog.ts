import { Product, StoreSettings } from '../types';

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg';

export const PRODUCT_ASSET_OPTIONS = [
  {
    label: 'Kutch Terracotta Pottery',
    url: '/src/assets/images/product_terracotta_pottery_1794710446791.jpg',
  },
  {
    label: 'Bandhani Silk Stole',
    url: '/src/assets/images/product_bandhani_stole_1794710447184.jpg',
  },
  {
    label: 'Brass Peacock Diya',
    url: '/src/assets/images/product_brass_diya_1794710446266.jpg',
  },
  {
    label: 'Sankheda & Rosewood Box',
    url: '/src/assets/images/product_wood_carving_1794710446228.jpg',
  },
  {
    label: 'Artisan Collection Showcase',
    url: '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg',
  },
];

export const DEFAULT_STORE_SETTINGS: Omit<StoreSettings, 'updatedAt'> = {
  whatsappNumber: '919876543210',
  storeName: 'Hast Kala',
  bannerTextEn: 'Free pan-India artisan shipping on orders above ₹1,999',
  bannerTextGu: '₹1,999 થી વધુના ઓર્ડર પર સમગ્ર ભારતમાં મફત ડિલિવરી',
  bannerActive: true,
  freeShippingThreshold: 1999,
};

export const STARTER_PRODUCTS: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'kutch-terracotta-matka-set',
    nameEn: 'Kutch Hand-Painted Terracotta Vase & Bowl Set',
    nameGu: 'કચ્છી હાથથી ચિતરેલ ટેરાકોટા ફૂલદાની અને બાઉલ સેટ',
    descriptionEn:
      'Wheel-thrown by Bhujodi potters using mineral-rich Kutch clay and hand-painted with natural white kaolin and ochre geometric folk motifs. Fired in traditional open kilns for breathable durability.',
    descriptionGu:
      'ભુજોડીના કુંભાર કારીગરો દ્વારા શુદ્ધ કચ્છી માટીમાંથી ચાકડા પર ઘડાયેલ અને કુદરતી સફેદ તથા ગેરુ રંગથી પરંપરાગત ભૌમિતિક ડિઝાઇનથી સુશોભિત.',
    category: 'pottery',
    price: 1850,
    discountPrice: 1490,
    stock: 14,
    images: [
      '/src/assets/images/product_terracotta_pottery_1794710446791.jpg',
      '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg',
    ],
    featured: true,
    newArrival: true,
    bestSeller: true,
    specialOffer: true,
    ratingAvg: 4.9,
    reviewCount: 18,
  },
  {
    id: 'jamnagar-bandhani-silk-stole',
    nameEn: 'Jamnagar Crimson Bandhani Pure Silk Stole',
    nameGu: 'જામનગરની અસલ બાંધણી પ્યોર સિલ્ક સ્ટોલ',
    descriptionEn:
      'Thousands of intricate hand-tied resist knots dyed in rich madder crimson and saffron gold by master Bandhej artisans, finished with fine zari embroidery and mirror border accents.',
    descriptionGu:
      'કુશળ બંધેજ કારીગરો દ્વારા હાથેથી બાંધેલા હજારો ઝીણા ટપકાં અને જરી-આભલા ભરતકામ સાથેની અસલ જામનગરી બાંધણી.',
    category: 'textiles',
    price: 3400,
    discountPrice: 2890,
    stock: 9,
    images: [
      '/src/assets/images/product_bandhani_stole_1794710447184.jpg',
      '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg',
    ],
    featured: true,
    newArrival: false,
    bestSeller: true,
    specialOffer: true,
    ratingAvg: 4.8,
    reviewCount: 24,
  },
  {
    id: 'antique-brass-peacock-diya',
    nameEn: 'Hand-Engraved Solid Brass Mayur Panch-Aarti Diya',
    nameGu: 'હાથથી કોતરેલો શુદ્ધ પિત્તળનો મયૂર પંચ-આરતી દીવો',
    descriptionEn:
      'Sand-cast solid brass five-wick oil lamp featuring sculpted peacock plumage and hand-chiseled floral filigree. Weighted pedestal base suitable for daily puja rooms and festive entrances.',
    descriptionGu:
      'શુદ્ધ પિત્તળમાંથી ઢાળવામાં આવેલો અને હાથથી ઝીણવટભરી કોતરણી કરેલો પાંચ વાટનો મયૂર દીવો, પૂજા અને ઉત્સવ સજાવટ માટે ઉત્તમ.',
    category: 'brassware',
    price: 2600,
    discountPrice: 2150,
    stock: 11,
    images: [
      '/src/assets/images/product_brass_diya_1794710446266.jpg',
      '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg',
    ],
    featured: true,
    newArrival: true,
    bestSeller: true,
    specialOffer: false,
    ratingAvg: 4.9,
    reviewCount: 31,
  },
  {
    id: 'sankheda-rosewood-keepsake-box',
    nameEn: 'Hand-Carved Rosewood & Sankheda Inlay Keepsake Box',
    nameGu: 'હાથથી કોતરેલું શીશમ અને સંખેડા જડતર જ્વેલરી બોક્સ',
    descriptionEn:
      'Seasoned Indian rosewood jewelry chest carved with lotus motifs, inlaid with brass vinework, and accented with traditional Sankheda lacquer borders and antique brass clasp.',
    descriptionGu:
      'શીશમના લાકડા પર કમળની કોતરણી, પિત્તળનું જડતર અને પરંપરાગત સંખેડા લાખના રંગકામથી સજાવેલ સુંદર કીપસેક બોક્સ.',
    category: 'woodcraft',
    price: 2950,
    discountPrice: 2450,
    stock: 7,
    images: [
      '/src/assets/images/product_wood_carving_1794710446228.jpg',
      '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg',
    ],
    featured: true,
    newArrival: true,
    bestSeller: false,
    specialOffer: true,
    ratingAvg: 4.7,
    reviewCount: 12,
  },
  {
    id: 'heritage-atelier-festive-hamper',
    nameEn: 'Artisan Heritage Festive Table Decor Ensemble',
    nameGu: 'હસ્તકલા ઉત્સવ ટેબલ સજાવટ સંપૂર્ણ સેટ',
    descriptionEn:
      'Curated four-craft collector set combining a hand-painted terracotta pitcher, solid brass oil lamp, carved wooden Ganesha idol, and woven Bandhani runner.',
    descriptionGu:
      'ચિત્રિત માટીની કળશ, પિત્તળનો દીવો, કોતરેલ કાષ્ઠ ગણેશજી અને બાંધણી વસ્ત્રનો અનોખો ચાર-કલા ઉત્સવ સંગ્રહ.',
    category: 'decor',
    price: 6800,
    discountPrice: 5490,
    stock: 4,
    images: [
      '/src/assets/images/hero_handicraft_atelier_1794710444799.jpg',
      '/src/assets/images/product_brass_diya_1794710446266.jpg',
    ],
    featured: false,
    newArrival: true,
    bestSeller: true,
    specialOffer: true,
    ratingAvg: 5.0,
    reviewCount: 9,
  },
];
