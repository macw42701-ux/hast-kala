import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  User? get currentUser => _auth.currentUser;

  Future<void> initNotifications() async {
    await _fcm.requestPermission();
  }

  Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required Function(String verificationId) onCodeSent,
    required Function(String error) onFailed,
  }) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (credential) async {
        await _auth.signInWithCredential(credential);
      },
      verificationFailed: (e) => onFailed(e.message ?? 'OTP verification failed'),
      codeSent: (verificationId, _) => onCodeSent(verificationId),
      codeAutoRetrievalTimeout: (_) {},
    );
  }

  Future<void> signInWithOtp(String verificationId, String smsCode) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    await _auth.signInWithCredential(credential);
  }

  Stream<List<CraftProduct>> streamProducts() {
    return _db.collection('products').snapshots().map(
          (snap) => snap.docs.map((d) => CraftProduct.fromMap(d.data())).toList(),
        );
  }

  Future<String> placeOrderAndBuildWhatsappUrl({
    required String customerName,
    required String customerPhone,
    required String deliveryAddress,
    required List<CartItem> items,
    required double totalAmount,
    required String adminWhatsapp,
  }) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('Please sign in first.');

    final orderId = 'ord_${DateTime.now().millisecondsSinceEpoch}';
    final orderCode = 'HK-${DateTime.now().millisecondsSinceEpoch % 900000 + 100000}';
    final nowIso = DateTime.now().toIso8601String();

    await _db.collection('orders').doc(orderId).set({
      'id': orderId,
      'orderCode': orderCode,
      'customerId': uid,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'deliveryAddress': deliveryAddress,
      'items': items
          .map((e) => {
                'productId': e.product.id,
                'nameEn': e.product.nameEn,
                'nameGu': e.product.nameGu,
                'price': e.product.discountPrice > 0
                    ? e.product.discountPrice
                    : e.product.price,
                'quantity': e.quantity,
                'image': e.product.images.isNotEmpty ? e.product.images.first : '',
              })
          .toList(),
      'subtotal': totalAmount,
      'totalAmount': totalAmount,
      'status': 'Order Received',
      'statusHistory': [
        {'status': 'Order Received', 'timestamp': nowIso, 'note': 'Submitted via Android app'}
      ],
      'adminRemarks': '',
      'estimatedDelivery': '',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    final summary = StringBuffer()
      ..writeln('Namaste Hast Kala!')
      ..writeln('New Order: $orderCode')
      ..writeln('Total: ₹${totalAmount.toStringAsFixed(0)}')
      ..writeln('Customer: $customerName ($customerPhone)')
      ..writeln('Address: $deliveryAddress');

    final cleanPhone = adminWhatsapp.replaceAll(RegExp(r'[^0-9]'), '');
    return 'https://wa.me/$cleanPhone?text=${Uri.encodeComponent(summary.toString())}';
  }

  String buildSupportWhatsappUrl(String adminWhatsapp) {
    final cleanPhone = adminWhatsapp.replaceAll(RegExp(r'[^0-9]'), '');
    const msg = 'Namaste Hast Kala! I have a question about your handcrafted products.';
    return 'https://wa.me/$cleanPhone?text=${Uri.encodeComponent(msg)}';
  }

  Future<void> launchWhatsapp(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
