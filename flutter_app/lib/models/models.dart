import 'package:flutter/foundation.dart';

const List<String> orderStatusFlow = [
  'Order Received',
  'Order Confirmed',
  'Processing',
  'Ready for Dispatch',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

class CraftProduct {
  final String id;
  final String nameEn;
  final String nameGu;
  final String descriptionEn;
  final String descriptionGu;
  final String category;
  final double price;
  final double discountPrice;
  final int stock;
  final List<String> images;
  final double ratingAvg;

  CraftProduct({
    required this.id,
    required this.nameEn,
    required this.nameGu,
    required this.descriptionEn,
    required this.descriptionGu,
    required this.category,
    required this.price,
    required this.discountPrice,
    required this.stock,
    required this.images,
    required this.ratingAvg,
  });

  factory CraftProduct.fromMap(Map<String, dynamic> map) {
    return CraftProduct(
      id: map['id'] ?? '',
      nameEn: map['nameEn'] ?? '',
      nameGu: map['nameGu'] ?? '',
      descriptionEn: map['descriptionEn'] ?? '',
      descriptionGu: map['descriptionGu'] ?? '',
      category: map['category'] ?? 'pottery',
      price: (map['price'] ?? 0).toDouble(),
      discountPrice: (map['discountPrice'] ?? 0).toDouble(),
      stock: (map['stock'] ?? 0).toInt(),
      images: List<String>.from(map['images'] ?? []),
      ratingAvg: (map['ratingAvg'] ?? 5).toDouble(),
    );
  }
}

class CartItem {
  final CraftProduct product;
  int quantity;
  CartItem({required this.product, this.quantity = 1});
}

class CartController extends ChangeNotifier {
  final List<CartItem> _items = [];
  List<CartItem> get items => List.unmodifiable(_items);

  double get subtotal => _items.fold(0, (sum, item) {
        final unit = item.product.discountPrice > 0
            ? item.product.discountPrice
            : item.product.price;
        return sum + unit * item.quantity;
      });

  void add(CraftProduct product) {
    final idx = _items.indexWhere((e) => e.product.id == product.id);
    if (idx >= 0) {
      if (_items[idx].quantity < product.stock) _items[idx].quantity++;
    } else if (product.stock > 0) {
      _items.add(CartItem(product: product));
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
