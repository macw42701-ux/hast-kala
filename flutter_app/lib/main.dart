import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'l10n/app_strings.dart';
import 'services/firebase_service.dart';
import 'screens/splash_onboarding_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppLanguageController()),
        ChangeNotifierProvider(create: (_) => CartController()),
        Provider(create: (_) => FirebaseService()),
      ],
      child: const HastKalaApp(),
    ),
  );
}

class HastKalaApp extends StatelessWidget {
  const HastKalaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hast Kala',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A5F),
          surface: const Color(0xFFF9F8F6),
        ),
        scaffoldBackgroundColor: const Color(0xFFF9F8F6),
      ),
      home: const SplashOnboardingScreen(),
    );
  }
}
