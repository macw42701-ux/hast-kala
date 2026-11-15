import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Star } from 'lucide-react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  testFirestoreConnection,
} from './lib/firebase';
import {
  DEFAULT_STORE_SETTINGS,
  HERO_BANNER_IMAGE,
  STARTER_PRODUCTS,
} from './data/seedCatalog';
import {
  CartItem,
  Language,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Review,
  StoreSettings,
  UserProfile,
} from './types';
import { t } from './i18n/translations';
import { ActiveTab, Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersView } from './components/OrdersView';
import { WishlistView } from './components/WishlistView';
import { AccountView } from './components/AccountView';
import { AdminPage } from './components/AdminPage';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';

type CollectionFilter = 'all' | 'featured' | 'newArrival' | 'bestSeller' | 'specialOffer';

function checkIsAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/admin' || window.location.hash === '#/admin';
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('hast_kala_lang');
    return saved === 'gu' ? 'gu' : 'en';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('shop');
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminPath);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('hast_kala_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const copy = t(lang);

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      (user.email === ADMIN_EMAIL || isAdminDoc),
  );

  // Persist language & cart locally
  useEffect(() => {
    localStorage.setItem('hast_kala_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('hast_kala_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const syncRoute = () => setIsAdminRoute(checkIsAdminPath());
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const navigateToStore = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    setActiveTab('shop');
  };

  // Boot connection check & auth listener
  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Public products & store settings listeners
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Product);
        setFirestoreProducts(list);
        setProductsLoaded(true);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      },
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        if (snap.exists()) {
          setStoreSettings(snap.data() as StoreSettings);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/store');
      },
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Admin doc + user profile listener
  useEffect(() => {
    if (!authReady || !user) {
      setUserProfile(null);
      setIsAdminDoc(false);
      setWishlistIds([]);
      return;
    }

    const unsubAdmin = onSnapshot(
      doc(db, 'admins', user.uid),
      (snap) => {
        setIsAdminDoc(snap.exists());
      },
      () => {
        setIsAdminDoc(false);
      },
    );

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const profile = snap.data() as UserProfile;
          setUserProfile(profile);
          if (profile.language === 'gu' || profile.language === 'en') {
            setLang(profile.language);
          }
        } else {
          setUserProfile(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      },
    );

    const unsubWishlist = onSnapshot(
      collection(db, 'users', user.uid, 'wishlist'),
      (snap) => {
        setWishlistIds(snap.docs.map((d) => d.id));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/wishlist`);
      },
    );

    return () => {
      unsubAdmin();
      unsubProfile();
      unsubWishlist();
    };
  }, [authReady, user]);

  // Reviews listener (approved for public/customers, all for admins)
  useEffect(() => {
    const reviewsQuery = isAdmin
      ? collection(db, 'reviews')
      : query(collection(db, 'reviews'), where('approved', '==', true));

    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snap) => {
        setReviews(snap.docs.map((d) => d.data() as Review));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reviews');
      },
    );

    return unsubReviews;
  }, [isAdmin]);

  // Orders & admin customers listeners
  useEffect(() => {
    if (!authReady || !user) {
      setOrders([]);
      setCustomers([]);
      return;
    }

    const ordersQuery = isAdmin
      ? collection(db, 'orders')
      : query(collection(db, 'orders'), where('customerId', '==', user.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Order);
        list.sort((a, b) => {
          const ta = a.statusHistory[0]?.timestamp || '';
          const tb = b.statusHistory[0]?.timestamp || '';
          return tb.localeCompare(ta);
        });
        setOrders(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      },
    );

    let unsubCustomers = () => {};
    if (isAdmin) {
      unsubCustomers = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          setCustomers(snap.docs.map((d) => d.data() as UserProfile));
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'users');
        },
      );
    }

    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, [authReady, user, isAdmin]);

  const products = useMemo(() => {
    if (firestoreProducts.length > 0) return firestoreProducts;
    if (productsLoaded) return STARTER_PRODUCTS;
    return STARTER_PRODUCTS;
  }, [firestoreProducts, productsLoaded]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (collectionFilter === 'featured' && !p.featured) return false;
      if (collectionFilter === 'newArrival' && !p.newArrival) return false;
      if (collectionFilter === 'bestSeller' && !p.bestSeller) return false;
      if (collectionFilter === 'specialOffer' && !p.specialOffer) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.nameEn.toLowerCase().includes(q) ||
          p.nameGu.toLowerCase().includes(q) ||
          p.descriptionEn.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, collectionFilter, searchQuery]);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSignIn = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const signedUser = cred.user;
    if (signedUser) {
      // Ensure starter profile document is created if none exists
      const profileRef = doc(db, 'users', signedUser.uid);
      if (!userProfile) {
        try {
          await setDoc(
            profileRef,
            {
              uid: signedUser.uid,
              name: signedUser.displayName || 'Hast Kala Guest',
              phone: signedUser.phoneNumber || '',
              email: signedUser.email || '',
              address: '',
              language: lang,
              role: 'customer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        } catch {
          // Ignore if profile already exists with existing createdAt
        }
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSaveProfile = async (data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    language: Language;
  }) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    try {
      if (userProfile) {
        await updateDoc(ref, {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          language: data.language,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          uid: user.uid,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          language: data.language,
          role: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
            : i,
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, qty) }];
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(i.product.stock, qty) }
          : i,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleBuyNow = (product: Product, qty: number) => {
    addToCart(product, qty);
    setSelectedProduct(null);
    setCheckoutOpen(true);
  };

  const handleToggleWishlist = async (productId: string) => {
    let activeUser = user;
    if (!activeUser) {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        activeUser = cred.user;
      } catch {
        return;
      }
    }
    if (!activeUser) return;

    const itemRef = doc(db, 'users', activeUser.uid, 'wishlist', productId);
    const exists = wishlistIds.includes(productId);
    try {
      if (exists) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, {
          productId,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        exists ? OperationType.DELETE : OperationType.CREATE,
        `users/${activeUser.uid}/wishlist/${productId}`,
      );
    }
  };

  const handlePlaceOrder = async (details: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
  }): Promise<Order> => {
    if (!user) throw new Error('Authentication required');
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const orderCode = `HK-${Math.floor(100000 + Math.random() * 900000)}`;
    const subtotal = cart.reduce((sum, item) => {
      const unit = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
      return sum + unit * item.quantity;
    }, 0);
    const shippingFee = subtotal >= storeSettings.freeShippingThreshold ? 0 : 120;
    const totalAmount = subtotal + shippingFee;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      orderCode,
      customerId: user.uid,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      deliveryAddress: details.deliveryAddress,
      items: cart.map((c) => ({
        productId: c.product.id,
        nameEn: c.product.nameEn,
        nameGu: c.product.nameGu,
        price: c.product.discountPrice > 0 ? c.product.discountPrice : c.product.price,
        quantity: c.quantity,
        image: c.product.images[0] || '',
      })),
      subtotal,
      totalAmount,
      status: 'Order Received',
      statusHistory: [
        {
          status: 'Order Received',
          timestamp: nowIso,
          note: 'Order submitted via Hast Kala',
        },
      ],
      adminRemarks: '',
      estimatedDelivery: '',
    };

    try {
      await setDoc(doc(db, 'orders', orderId), {
        ...newOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCart([]);
      return newOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const nextHistory = [
      ...order.statusHistory,
      {
        status: 'Cancelled' as OrderStatus,
        timestamp: new Date().toISOString(),
        note: 'Cancelled by customer',
      },
    ];
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'Cancelled',
        statusHistory: nextHistory,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  const handleSubmitReview = async (
    productId: string,
    orderId: string,
    rating: number,
    comment: string,
  ) => {
    if (!user) return;
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        id: reviewId,
        productId,
        orderId,
        customerId: user.uid,
        customerName: userProfile?.name || user.displayName || 'Customer',
        rating,
        comment,
        approved: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  // Admin handlers
  const handleSeedCatalog = async () => {
    try {
      const batch = writeBatch(db);
      for (const item of STARTER_PRODUCTS) {
        batch.set(doc(db, 'products', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      batch.set(doc(db, 'settings', 'store'), {
        ...DEFAULT_STORE_SETTINGS,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleSaveProduct = async (
    product: Omit<Product, 'createdAt' | 'updatedAt'>,
    isNew: boolean,
  ) => {
    const existsInDb = firestoreProducts.some((p) => p.id === product.id);
    try {
      if (isNew || !existsInDb) {
        await setDoc(doc(db, 'products', product.id), {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'products', product.id), {
          ...product,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const handleUpdateOrder = async (
    order: Order,
    nextStatus: OrderStatus,
    adminRemarks: string,
    estimatedDelivery: string,
  ) => {
    const statusChanged = order.status !== nextStatus;
    const nextHistory = statusChanged
      ? [
          ...order.statusHistory,
          {
            status: nextStatus,
            timestamp: new Date().toISOString(),
            note: adminRemarks || `Updated to ${nextStatus}`,
          },
        ]
      : order.statusHistory;

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        adminRemarks,
        estimatedDelivery,
        statusHistory: nextHistory,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const handleClearOrders = async () => {
    if (!user || orders.length === 0) return;
    try {
      const targetOrders = isAdmin
        ? orders
        : orders.filter((o) => o.customerId === user.uid);
      for (let i = 0; i < targetOrders.length; i += 450) {
        const chunk = targetOrders.slice(i, i + 450);
        const batch = writeBatch(db);
        for (const o of chunk) {
          batch.delete(doc(db, 'orders', o.id));
        }
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'orders');
    }
  };

  const handleToggleReviewApproval = async (review: Review) => {
    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        approved: !review.approved,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${review.id}`);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  const handleSaveSettings = async (settings: Omit<StoreSettings, 'updatedAt'>) => {
    try {
      await setDoc(doc(db, 'settings', 'store'), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/store');
    }
  };

  const getEligibleDeliveredOrder = (productId: string): Order | null => {
    if (!user) return null;
    return (
      orders.find(
        (o) =>
          o.customerId === user.uid &&
          o.status === 'Delivered' &&
          o.items.some((item) => item.productId === productId),
      ) || null
    );
  };

  const bannerText = lang === 'gu' ? storeSettings.bannerTextGu : storeSettings.bannerTextEn;

  if (isAdminRoute) {
    return (
      <AdminPage
        lang={lang}
        isSignedIn={Boolean(user)}
        isAdmin={isAdmin}
        userEmail={user?.email || null}
        products={products}
        orders={orders}
        customers={customers}
        reviews={reviews}
        settings={storeSettings}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onBackToStore={navigateToStore}
        onSeedCatalog={handleSeedCatalog}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrder={handleUpdateOrder}
        onDeleteOrder={handleDeleteOrder}
        onClearOrders={handleClearOrders}
        onToggleReviewApproval={handleToggleReviewApproval}
        onDeleteReview={handleDeleteReview}
        onSaveSettings={handleSaveSettings}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#1C1B19]">
      <Navbar
        lang={lang}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        bannerText={bannerText}
        bannerActive={storeSettings.bannerActive}
      />

      <main className="flex-1">
        {activeTab === 'shop' && (
          <div className="pb-24 md:pb-16">
            {/* Editorial Storefront Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
              <div className="relative rounded-2xl overflow-hidden border border-[#E5E1D8] bg-[#1C1B19]">
                <div className="aspect-[16/10] sm:aspect-[16/7] w-full">
                  <img
                    src={HERO_BANNER_IMAGE}
                    alt="Hast Kala handcrafted collection"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end">
                  <div className="p-6 sm:p-10 max-w-2xl text-white">
                    <p className="text-xs uppercase tracking-widest text-[#E5D3B3] font-medium">
                      {copy.heroKicker}
                    </p>
                    <h1 className="mt-2 font-display text-2xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-balance">
                      {copy.heroTitle}
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed max-w-xl">
                      {copy.heroSubtitle}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <a
                        href="#catalog"
                        className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#1C1B19] hover:bg-[#F1EFEA] transition-colors min-h-[44px]"
                      >
                        {copy.heroCta}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Workspace Toolbar: Search, Language Switcher, PWA Install, Collection & Category Filters */}
            <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#66615B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="w-full rounded-lg border border-[#E5E1D8] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1C1B19] placeholder:text-[#66615B] focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1 p-1 bg-[#F1EFEA] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        lang === 'en' ? 'bg-white text-[#1C1B19] shadow-sm' : 'text-[#66615B]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('gu')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        lang === 'gu' ? 'bg-white text-[#1C1B19] shadow-sm' : 'text-[#66615B]'
                      }`}
                    >
                      ગુજરાતી
                    </button>
                  </div>
                  <PWAInstallButton lang={lang} />
                </div>
              </div>

              {/* Collection Filter Tabs + Category Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E5E1D8]">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      ['all', copy.filterAll],
                      ['featured', copy.filterFeatured],
                      ['newArrival', copy.filterNew],
                      ['bestSeller', copy.filterBest],
                      ['specialOffer', copy.filterOffer],
                    ] as [CollectionFilter, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCollectionFilter(key)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        collectionFilter === key
                          ? 'bg-[#1E3A5F] text-white'
                          : 'text-[#66615B] hover:bg-[#F1EFEA] hover:text-[#1C1B19]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['all', 'pottery', 'textiles', 'brassware', 'woodcraft', 'decor'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-white text-[#1C1B19] border border-[#E5E1D8] shadow-xs'
                            : 'text-[#66615B] hover:text-[#1C1B19]'
                        }`}
                      >
                        {copy.categories[cat]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* 3-Column Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E1D8] p-12 text-center text-sm text-[#66615B]">
                  No handicrafts match your current filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      lang={lang}
                      isWishlisted={wishlistIds.includes(product.id)}
                      whatsappNumber={storeSettings.whatsappNumber}
                      onSelect={setSelectedProduct}
                      onAddToCart={(p) => addToCart(p, 1)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Artisan Craftsmanship & Customer Reviews Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
              <div className="bg-white rounded-2xl border border-[#E5E1D8] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-3">
                  <img
                    src="/assets/aistudio/Three_Angels_Hast_Kala_Logo_104c951d.png"
                    alt={copy.brand}
                    referrerPolicy="no-referrer"
                    className="h-20 w-auto object-contain mb-2"
                  />
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E3A5F] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{copy.verifiedPurchaser}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1B19]">
                    {copy.storyTitle}
                  </h2>
                  <p className="text-sm sm:text-base text-[#4A4640] leading-relaxed">
                    {copy.storyBody}
                  </p>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(reviews.filter((r) => r.approved).slice(0, 2).length > 0
                    ? reviews.filter((r) => r.approved).slice(0, 2)
                    : [
                        {
                          id: 'demo-1',
                          customerName: 'Meera Patel',
                          rating: 5,
                          comment:
                            'The Kutch terracotta pitcher arrived safely double-boxed. Authentic earthwork finish.',
                        },
                        {
                          id: 'demo-2',
                          customerName: 'Rohan Desai',
                          rating: 5,
                          comment:
                            'Ordered the brass peacock diya via WhatsApp confirmation. Heavy solid brass.',
                        },
                      ]
                  ).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E1D8] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#1C1B19]">{rev.customerName}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B2F] tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-[#9A6B2F]" /> {rev.rating}/5
                        </span>
                      </div>
                      <p className="text-xs text-[#4A4640] leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <WishlistView
            lang={lang}
            products={products}
            wishlistIds={wishlistIds}
            isSignedIn={Boolean(user)}
            whatsappNumber={storeSettings.whatsappNumber}
            onSignIn={handleSignIn}
            onSelectProduct={setSelectedProduct}
            onAddToCart={(p) => addToCart(p, 1)}
            onToggleWishlist={handleToggleWishlist}
            onBrowseShop={() => setActiveTab('shop')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            lang={lang}
            orders={orders}
            whatsappNumber={storeSettings.whatsappNumber}
            isSignedIn={Boolean(user)}
            onSignIn={handleSignIn}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={handleDeleteOrder}
            onClearOrders={handleClearOrders}
          />
        )}

        {activeTab === 'account' && (
          <AccountView
            lang={lang}
            onChangeLang={setLang}
            userEmail={user?.email || null}
            isSignedIn={Boolean(user)}
            userProfile={userProfile}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </main>

      <footer className="border-t border-[#E5E1D8] bg-white py-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#66615B]">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Three_Angels_Hast_Kala_Logo_104c951d.png"
              alt={copy.brand}
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain"
            />
            <span>
              © {new Date().getFullYear()} {copy.brand} · {copy.tagline}
            </span>
          </div>
          <span>English / ગુજરાતી · ₹ INR</span>
        </div>
      </footer>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          lang={lang}
          reviews={reviews}
          eligibleOrder={getEligibleDeliveredOrder(selectedProduct.id)}
          isSignedIn={Boolean(user)}
          isWishlisted={wishlistIds.includes(selectedProduct.id)}
          whatsappNumber={storeSettings.whatsappNumber}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onBuyNow={handleBuyNow}
          onToggleWishlist={handleToggleWishlist}
          onSubmitReview={handleSubmitReview}
        />
      )}

      <CartDrawer
        open={cartOpen}
        lang={lang}
        items={cart}
        freeShippingThreshold={storeSettings.freeShippingThreshold}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        lang={lang}
        items={cart}
        freeShippingThreshold={storeSettings.freeShippingThreshold}
        whatsappNumber={storeSettings.whatsappNumber}
        userProfile={userProfile}
        isSignedIn={Boolean(user)}
        onSignIn={handleSignIn}
        onClose={() => setCheckoutOpen(false)}
        onPlaceOrder={handlePlaceOrder}
        onViewOrders={() => setActiveTab('orders')}
      />

      <OfflineIndicator />
    </div>
  );
}
