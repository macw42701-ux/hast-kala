import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../models/models.dart';
import '../services/firebase_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppLanguageController>();
    final cart = context.watch<CartController>();
    final firebase = context.read<FirebaseService>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.text('brand')),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${lang.text('cart')} (${cart.items.length})',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF128C7E),
        foregroundColor: Colors.white,
        tooltip: 'WhatsApp Support',
        onPressed: () {
          final url = firebase.buildSupportWhatsappUrl('919876543210');
          firebase.launchWhatsapp(url);
        },
        child: const Icon(Icons.chat),
      ),
      body: StreamBuilder<List<CraftProduct>>(
        stream: firebase.streamProducts(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final products = snapshot.data!;
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: products.length,
            itemBuilder: (context, i) {
              final p = products[i];
              final price = p.discountPrice > 0 ? p.discountPrice : p.price;
              return Card(
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Container(
                        color: const Color(0xFFF1EFEA),
                        width: double.infinity,
                        child: const Icon(Icons.image_outlined, size: 40),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lang.lang == 'gu' ? p.nameGu : p.nameEn,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Text('₹${price.toStringAsFixed(0)}'),
                          const SizedBox(height: 6),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: () => cart.add(p),
                              child: const Text('Add'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
