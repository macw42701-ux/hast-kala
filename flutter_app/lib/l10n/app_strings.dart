import 'package:flutter/foundation.dart';

class AppLanguageController extends ChangeNotifier {
  String _lang = 'en';
  String get lang => _lang;

  void setLanguage(String code) {
    _lang = code == 'gu' ? 'gu' : 'en';
    notifyListeners();
  }

  String text(String key) => AppStrings.get(_lang, key);
}

class AppStrings {
  static const Map<String, Map<String, String>> _values = {
    'en': {
      'brand': 'Hast Kala',
      'welcome': 'Authentic Indian Handicrafts',
      'continue': 'Continue to Store',
      'shop': 'Shop',
      'orders': 'Orders',
      'account': 'Account',
      'admin': 'Admin',
      'cart': 'Shopping Cart',
      'confirm_order': 'Confirm Order',
      'send_whatsapp': 'Send Order on WhatsApp',
    },
    'gu': {
      'brand': 'હસ્ત કલા',
      'welcome': 'ભારતીય અસલ હસ્તકલા',
      'continue': 'સ્ટોર પર જાઓ',
      'shop': 'ખરીદી',
      'orders': 'ઓર્ડર',
      'account': 'ખાતું',
      'admin': 'એડમિન',
      'cart': 'શોપિંગ કાર્ટ',
      'confirm_order': 'ઓર્ડર કન્ફર્મ કરો',
      'send_whatsapp': 'WhatsApp પર ઓર્ડર મોકલો',
    },
  };

  static String get(String lang, String key) =>
      _values[lang]?[key] ?? _values['en']![key] ?? key;
}
