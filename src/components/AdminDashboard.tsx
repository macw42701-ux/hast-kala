import React, { useEffect, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  Language,
  ORDER_STATUS_FLOW,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Review,
  StoreSettings,
  UserProfile,
} from '../types';
import { t } from '../i18n/translations';
import { PRODUCT_ASSET_OPTIONS } from '../data/seedCatalog';
import { auth } from '../lib/firebase';

interface AdminDashboardProps {
  lang: Language;
  products: Product[];
  orders: Order[];
  customers: UserProfile[];
  reviews: Review[];
  settings: StoreSettings;
  onSeedCatalog: () => Promise<void>;
  onSaveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateOrder: (
    order: Order,
    nextStatus: OrderStatus,
    adminRemarks: string,
    estimatedDelivery: string,
  ) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onClearOrders: () => Promise<void>;
  onToggleReviewApproval: (review: Review) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onSaveSettings: (settings: Omit<StoreSettings, 'updatedAt'>) => Promise<void>;
}

type AdminSection = 'overview' | 'products' | 'orders' | 'customers' | 'reviews' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  products,
  orders,
  customers,
  reviews,
  settings,
  onSeedCatalog,
  onSaveProduct,
  onDeleteProduct,
  onUpdateOrder,
  onDeleteOrder,
  onClearOrders,
  onToggleReviewApproval,
  onDeleteReview,
  onSaveSettings,
}) => {
  const copy = t(lang);
  const [section, setSection] = useState<AdminSection>('products');
  const [editingProduct, setEditingProduct] = useState<Omit<Product, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [productSavedNotice, setProductSavedNotice] = useState('');

  // Quick inline price tag editor state keyed by product id
  const [quickPrices, setQuickPrices] = useState<
    Record<string, { price: number; discountPrice: number; stock: number }>
  >({});

  // Order edits state keyed by order id
  const [orderEdits, setOrderEdits] = useState<
    Record<string, { status: OrderStatus; remarks: string; eta: string }>
  >({});
  const [confirmClearOrders, setConfirmClearOrders] = useState(false);
  const [clearingOrders, setClearingOrders] = useState(false);

  // Settings form state
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [storeName, setStoreName] = useState(settings.storeName);
  const [bannerTextEn, setBannerTextEn] = useState(settings.bannerTextEn);
  const [bannerTextGu, setBannerTextGu] = useState(settings.bannerTextGu);
  const [bannerActive, setBannerActive] = useState(settings.bannerActive);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings.freeShippingThreshold);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setWhatsappNumber(settings.whatsappNumber);
    setStoreName(settings.storeName);
    setBannerTextEn(settings.bannerTextEn);
    setBannerTextGu(settings.bannerTextGu);
    setBannerActive(settings.bannerActive);
    setFreeShippingThreshold(settings.freeShippingThreshold);
  }, [settings]);

  const pendingOrders = orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Cancelled',
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;

  const startNewProduct = () => {
    setIsNewProduct(true);
    setUploadError('');
    setProductSavedNotice('');
    setEditingProduct({
      id: `craft-${Date.now()}`,
      nameEn: '',
      nameGu: '',
      descriptionEn: '',
      descriptionGu: '',
      category: 'pottery',
      price: 1200,
      discountPrice: 990,
      stock: 10,
      images: [PRODUCT_ASSET_OPTIONS[0].url],
      featured: true,
      newArrival: true,
      bestSeller: false,
      specialOffer: false,
      ratingAvg: 5,
      reviewCount: 0,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingProduct) return;

    setUploadError('');
    setUploadingPhoto(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Administrator authentication token unavailable.');
      }

      const uploadedUrls: string[] = [];
      const availableSlots = Math.max(0, 6 - editingProduct.images.length);
      const selectedFiles = Array.from(files).slice(0, Math.max(1, availableSlots));

      for (const file of selectedFiles) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read image file.'));
          reader.readAsDataURL(file);
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            dataUrl,
          }),
        });

        const payload = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !payload.url) {
          throw new Error(payload.error || 'Photo upload failed.');
        }
        uploadedUrls.push(payload.url);
      }

      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              images: [...prev.images, ...uploadedUrls].slice(0, 6),
            }
          : null,
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!editingProduct || !customImageUrl.trim()) return;
    if (editingProduct.images.length >= 6) {
      setUploadError('Maximum 6 photos allowed per product.');
      return;
    }
    setEditingProduct({
      ...editingProduct,
      images: [...editingProduct.images, customImageUrl.trim()],
    });
    setCustomImageUrl('');
  };

  const handleSetPrimaryImage = (idx: number) => {
    if (!editingProduct || idx === 0) return;
    const next = [...editingProduct.images];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    setEditingProduct({ ...editingProduct, images: next });
  };

  const handleRemoveImage = (idx: number) => {
    if (!editingProduct || editingProduct.images.length <= 1) {
      setUploadError('At least 1 product photo is required.');
      return;
    }
    setEditingProduct({
      ...editingProduct,
      images: editingProduct.images.filter((_, i) => i !== idx),
    });
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (editingProduct.images.length === 0) {
      setUploadError('Please upload or select at least 1 product photo.');
      return;
    }
    setSavingProduct(true);
    setUploadError('');
    try {
      const normalized: Omit<Product, 'createdAt' | 'updatedAt'> = {
        ...editingProduct,
        price: Math.max(1, Number(editingProduct.price) || 1),
        discountPrice: Math.min(
          Math.max(0, Number(editingProduct.discountPrice) || 0),
          Math.max(1, Number(editingProduct.price) || 1),
        ),
        stock: Math.max(0, Number(editingProduct.stock) || 0),
      };
      await onSaveProduct(normalized, isNewProduct);
      setEditingProduct(null);
      setProductSavedNotice('Product details & price tag saved.');
      setTimeout(() => setProductSavedNotice(''), 2500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickPriceSave = async (product: Product) => {
    const draft = quickPrices[product.id];
    if (!draft) return;
    const price = Math.max(1, Number(draft.price) || product.price);
    const discountPrice = Math.min(Math.max(0, Number(draft.discountPrice) || 0), price);
    const stock = Math.max(0, Number(draft.stock) || 0);
    await onSaveProduct(
      {
        ...product,
        price,
        discountPrice,
        stock,
      },
      false,
    );
    setProductSavedNotice(`Updated price tag for ${product.nameEn}`);
    setTimeout(() => setProductSavedNotice(''), 2500);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await onSeedCatalog();
    } finally {
      setSeeding(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(false);
    await onSaveSettings({
      whatsappNumber: whatsappNumber.trim(),
      storeName: storeName.trim() || 'Hast Kala',
      bannerTextEn: bannerTextEn.trim(),
      bannerTextGu: bannerTextGu.trim(),
      bannerActive,
      freeShippingThreshold: Number(freeShippingThreshold) || 0,
    });
    setSettingsSaved(true);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1B19]">
          {copy.adminTitle}
        </h1>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-2 rounded-lg border border-[#1E3A5F] bg-white px-4 py-2 text-xs font-medium text-[#1E3A5F] hover:bg-[#F1EFEA] cursor-pointer min-h-[40px]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{seeding ? '...' : copy.seedCatalog}</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F1EFEA] rounded-lg overflow-x-auto">
        {(
          [
            ['products', copy.tabProducts],
            ['orders', copy.tabOrders],
            ['overview', copy.tabOverview],
            ['customers', copy.tabCustomers],
            ['reviews', copy.tabReviews],
            ['settings', copy.tabSettings],
          ] as [AdminSection, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              section === key ? 'bg-white text-[#1C1B19] shadow-sm' : 'text-[#66615B] hover:text-[#1C1B19]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI Strip */}
      {section === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: copy.kpiProducts, value: products.length, icon: ShoppingBag },
              { label: copy.kpiCustomers, value: customers.length, icon: Users },
              { label: copy.kpiOrders, value: orders.length, icon: Package },
              { label: copy.kpiPending, value: pendingOrders, icon: Package },
              { label: copy.kpiDelivered, value: deliveredOrders, icon: Check },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border border-[#E5E1D8] p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[#66615B]">
                  <span className="text-xs font-medium">{kpi.label}</span>
                  <kpi.icon className="w-4 h-4 text-[#1E3A5F]" />
                </div>
                <p className="mt-3 text-3xl font-bold text-[#1C1B19] tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[#1C1B19] mb-3">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-[#66615B]">No orders placed yet.</p>
            ) : (
              <div className="divide-y divide-[#F1EFEA]">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-semibold text-[#1C1B19] tabular-nums">{order.orderCode}</span>
                      <span className="text-[#66615B] ml-2">· {order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-4 tabular-nums">
                      <span className="text-xs font-medium text-[#1E3A5F]">{order.status}</span>
                      <span className="font-semibold text-[#1C1B19]">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products CRUD + Price Tag Editor + Photo Upload */}
      {section === 'products' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {productSavedNotice && (
                <p className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{productSavedNotice}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={startNewProduct}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>{copy.addProduct}</span>
            </button>
          </div>

          {editingProduct && (
            <form
              onSubmit={handleSaveProductSubmit}
              className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
                <h2 className="font-display text-lg font-semibold text-[#1C1B19]">
                  {isNewProduct ? 'Add New Product' : `Edit Product: ${editingProduct.nameEn}`}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 text-[#66615B] hover:text-[#1C1B19] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Upload & Gallery Section */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1C1B19]">
                    Product Photos ({editingProduct.images.length}/6)
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo from Device'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      disabled={uploadingPhoto}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {editingProduct.images.map((img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className="relative group rounded-lg overflow-hidden border border-[#E5E1D8] bg-[#F1EFEA] aspect-[4/3]"
                    >
                      <img
                        src={img}
                        alt={`Product preview ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/65 flex items-center justify-between gap-1 text-[10px] text-white">
                        {idx === 0 ? (
                          <span className="font-medium">Primary</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="underline cursor-pointer"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-0.5 hover:text-red-300 cursor-pointer"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#66615B] mb-1">
                      Add Studio Preset Photo
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        if (editingProduct.images.length >= 6) return;
                        setEditingProduct({
                          ...editingProduct,
                          images: [...editingProduct.images, e.target.value],
                        });
                      }}
                      className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-xs bg-white"
                    >
                      <option value="">Select preset photo to add...</option>
                      {PRODUCT_ASSET_OPTIONS.map((opt) => (
                        <option key={opt.url} value={opt.url}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#66615B] mb-1">
                      Or Add Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://... or /uploads/..."
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="flex-1 rounded-lg border border-[#E5E1D8] px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E1D8] px-3 py-2 text-xs font-medium hover:bg-[#F1EFEA] cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    Product Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingProduct.nameEn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    Product Name (Gujarati)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingProduct.nameGu}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameGu: e.target.value })}
                    className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1200}
                    value={editingProduct.descriptionEn}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, descriptionEn: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    Description (Gujarati)
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1200}
                    value={editingProduct.descriptionGu}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, descriptionGu: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Price Tag & Inventory */}
              <div className="bg-[#F9F8F6] rounded-xl border border-[#E5E1D8] p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-sm bg-white"
                  >
                    <option value="pottery">Pottery</option>
                    <option value="textiles">Textiles</option>
                    <option value="brassware">Brassware</option>
                    <option value="woodcraft">Woodcraft</option>
                    <option value="decor">Decor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    MRP / Price Tag (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000000}
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-sm tabular-nums font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    Offer Price Tag (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={editingProduct.price}
                    value={editingProduct.discountPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-sm tabular-nums font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#66615B] mb-1">
                    Available Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    required
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-sm tabular-nums font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-[#1C1B19]">
                {(
                  [
                    ['featured', 'Featured'],
                    ['newArrival', 'New Arrival'],
                    ['bestSeller', 'Best Seller'],
                    ['specialOffer', 'Special Offer'],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct[field]}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, [field]: e.target.checked })
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProduct || uploadingPhoto}
                  className="rounded-lg bg-[#1E3A5F] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#162C49] disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct ? 'Saving...' : copy.saveProduct}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-[#E5E1D8] px-4 py-2.5 text-xs font-medium text-[#66615B] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-10 text-center space-y-3">
              <p className="text-sm text-[#66615B]">
                No products saved in Cloud Firestore yet. Seed the starter catalog or add a new product to begin editing price tags and uploading photos.
              </p>
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A5F] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{seeding ? '...' : copy.seedCatalog}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E1D8] divide-y divide-[#F1EFEA]">
              {products.map((product) => {
                const draft = quickPrices[product.id] || {
                  price: product.price,
                  discountPrice: product.discountPrice,
                  stock: product.stock,
                };
                const hasQuickChange =
                  draft.price !== product.price ||
                  draft.discountPrice !== product.discountPrice ||
                  draft.stock !== product.stock;

                return (
                  <div
                    key={product.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.images[0]}
                        alt={product.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-lg object-cover bg-[#F1EFEA] shrink-0 border border-[#E5E1D8]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1C1B19] truncate">
                          {product.nameEn}
                        </p>
                        <p className="text-xs text-[#66615B] truncate">{product.nameGu}</p>
                        <p className="text-xs text-[#66615B] mt-0.5 uppercase tracking-wider">
                          {product.category} · {product.images.length} photos
                        </p>
                      </div>
                    </div>

                    {/* Quick Price Tag & Stock Inputs + Full Edit */}
                    <div className="flex flex-wrap items-end gap-2.5">
                      <div>
                        <label className="block text-[10px] font-medium text-[#66615B]">MRP (₹)</label>
                        <input
                          type="number"
                          min={1}
                          value={draft.price}
                          onChange={(e) =>
                            setQuickPrices({
                              ...quickPrices,
                              [product.id]: { ...draft, price: Number(e.target.value) },
                            })
                          }
                          className="w-24 rounded-md border border-[#E5E1D8] px-2.5 py-1.5 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[#66615B]">Offer (₹)</label>
                        <input
                          type="number"
                          min={0}
                          max={draft.price}
                          value={draft.discountPrice}
                          onChange={(e) =>
                            setQuickPrices({
                              ...quickPrices,
                              [product.id]: { ...draft, discountPrice: Number(e.target.value) },
                            })
                          }
                          className="w-24 rounded-md border border-[#E5E1D8] px-2.5 py-1.5 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[#66615B]">Stock</label>
                        <input
                          type="number"
                          min={0}
                          value={draft.stock}
                          onChange={(e) =>
                            setQuickPrices({
                              ...quickPrices,
                              [product.id]: { ...draft, stock: Number(e.target.value) },
                            })
                          }
                          className="w-20 rounded-md border border-[#E5E1D8] px-2.5 py-1.5 text-xs tabular-nums"
                        />
                      </div>

                      {hasQuickChange && (
                        <button
                          type="button"
                          onClick={() => handleQuickPriceSave(product)}
                          className="rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer min-h-[32px]"
                        >
                          Save Price
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsNewProduct(false);
                          setUploadError('');
                          setEditingProduct({ ...product });
                        }}
                        className="rounded-lg border border-[#E5E1D8] px-3 py-1.5 text-xs font-medium text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer min-h-[32px]"
                      >
                        Edit Details & Photos
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product.id)}
                        className="p-2 text-[#66615B] hover:text-red-600 cursor-pointer"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders Management */}
      {section === 'orders' && (
        <div className="space-y-4">
          {orders.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#66615B]">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} in Firestore
              </p>
              <div className="flex items-center gap-2">
                {confirmClearOrders ? (
                  <>
                    <button
                      type="button"
                      disabled={clearingOrders}
                      onClick={async () => {
                        setClearingOrders(true);
                        try {
                          await onClearOrders();
                          setConfirmClearOrders(false);
                        } finally {
                          setClearingOrders(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{clearingOrders ? 'Cleaning...' : copy.confirmClearOrders}</span>
                    </button>
                    <button
                      type="button"
                      disabled={clearingOrders}
                      onClick={() => setConfirmClearOrders(false)}
                      className="rounded-lg border border-[#E5E1D8] bg-white px-3 py-2 text-xs font-medium text-[#66615B] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOrders(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{copy.clearAllOrders}</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E1D8] p-8 text-center text-sm text-[#66615B]">
              No customer orders placed yet.
            </div>
          ) : (
            orders.map((order) => {
              const draft = orderEdits[order.id] || {
                status: order.status,
                remarks: order.adminRemarks,
                eta: order.estimatedDelivery,
              };

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-[#E5E1D8] p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#1C1B19] tabular-nums">{order.orderCode}</span>
                      <span className="text-xs text-[#66615B] ml-2">
                        · {order.customerName} ({order.customerPhone})
                      </span>
                      <p className="text-xs text-[#66615B] mt-0.5">{order.deliveryAddress}</p>
                    </div>
                    <span className="font-bold text-[#1C1B19] tabular-nums">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#66615B] mb-1">Status</label>
                      <select
                        value={draft.status}
                        onChange={(e) =>
                          setOrderEdits({
                            ...orderEdits,
                            [order.id]: { ...draft, status: e.target.value as OrderStatus },
                          })
                        }
                        className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-xs bg-white"
                      >
                        {ORDER_STATUS_FLOW.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#66615B] mb-1">
                        Estimated Delivery
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 18 Nov 2026"
                        value={draft.eta}
                        onChange={(e) =>
                          setOrderEdits({
                            ...orderEdits,
                            [order.id]: { ...draft, eta: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#66615B] mb-1">
                        Admin Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Tracking / dispatch note..."
                        value={draft.remarks}
                        onChange={(e) =>
                          setOrderEdits({
                            ...orderEdits,
                            [order.id]: { ...draft, remarks: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-[#E5E1D8] px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateOrder(order, draft.status, draft.remarks, draft.eta)}
                      className="rounded-lg bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer"
                    >
                      Update Order Status
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteOrder(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{copy.deleteOrder}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Customers Directory */}
      {section === 'customers' && (
        <div className="bg-white rounded-xl border border-[#E5E1D8] divide-y divide-[#F1EFEA]">
          {customers.length === 0 ? (
            <p className="p-6 text-sm text-[#66615B]">No registered customer profiles yet.</p>
          ) : (
            customers.map((c) => (
              <div key={c.uid} className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-[#1C1B19]">{c.name}</p>
                  <p className="text-xs text-[#66615B]">
                    {c.phone || 'No phone'} · {c.email}
                  </p>
                  {c.address && <p className="text-xs text-[#66615B] mt-0.5">{c.address}</p>}
                </div>
                <span className="text-xs font-medium text-[#1E3A5F] uppercase">{c.language}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Moderation */}
      {section === 'reviews' && (
        <div className="bg-white rounded-xl border border-[#E5E1D8] divide-y divide-[#F1EFEA]">
          {reviews.length === 0 ? (
            <p className="p-6 text-sm text-[#66615B]">No customer reviews submitted yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1C1B19]">
                    {rev.customerName} · {rev.rating}/5
                  </p>
                  <p className="text-xs text-[#66615B] mt-0.5">Product ID: {rev.productId}</p>
                  <p className="text-sm text-[#4A4640] mt-2">{rev.comment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleReviewApproval(rev)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E1D8] px-3 py-1.5 text-xs font-medium text-[#1C1B19] hover:bg-[#F1EFEA] cursor-pointer"
                  >
                    {rev.approved ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{rev.approved ? 'Visible' : 'Hidden'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteReview(rev.id)}
                    className="p-2 text-[#66615B] hover:text-red-600 cursor-pointer"
                    aria-label="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Store Settings */}
      {section === 'settings' && (
        <form
          onSubmit={handleSettingsSubmit}
          className="bg-white rounded-xl border border-[#E5E1D8] p-5 sm:p-6 space-y-4 max-w-2xl"
        >
          <div className="flex items-center gap-2 text-[#1C1B19]">
            <Settings className="w-4 h-4 text-[#1E3A5F]" />
            <h2 className="text-base font-semibold">Store & WhatsApp Configuration</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#66615B] mb-1">
              {copy.whatsappSettingLabel}
            </label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="919876543210"
              className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-sm tabular-nums"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#66615B] mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min={0}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#66615B] mb-1">
              Promotional Banner (English)
            </label>
            <input
              type="text"
              value={bannerTextEn}
              onChange={(e) => setBannerTextEn(e.target.value)}
              className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#66615B] mb-1">
              Promotional Banner (Gujarati)
            </label>
            <input
              type="text"
              value={bannerTextGu}
              onChange={(e) => setBannerTextGu(e.target.value)}
              className="w-full rounded-lg border border-[#E5E1D8] px-3.5 py-2 text-sm"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[#1C1B19] cursor-pointer">
            <input
              type="checkbox"
              checked={bannerActive}
              onChange={(e) => setBannerActive(e.target.checked)}
            />
            <span>Show promotional banner on storefront</span>
          </label>

          {settingsSaved && (
            <p className="text-xs text-emerald-700 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Settings saved
            </p>
          )}

          <div>
            <button
              type="submit"
              className="rounded-lg bg-[#1E3A5F] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#162C49] cursor-pointer"
            >
              {copy.saveSettings}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
