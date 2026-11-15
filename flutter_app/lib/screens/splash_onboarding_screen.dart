import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import 'home_screen.dart';

class SplashOnboardingScreen extends StatelessWidget {
  const SplashOnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppLanguageController>();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/logo.png', height: 140),
              const SizedBox(height: 16),
              Text(
                lang.text('brand'),
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1C1B19),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                lang.text('welcome'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Color(0xFF66615B)),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ChoiceChip(
                    label: const Text('English'),
                    selected: lang.lang == 'en',
                    onSelected: (_) => lang.setLanguage('en'),
                  ),
                  const SizedBox(width: 12),
                  ChoiceChip(
                    label: const Text('ગુજરાતી'),
                    selected: lang.lang == 'gu',
                    onSelected: (_) => lang.setLanguage('gu'),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1E3A5F),
                  ),
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const HomeScreen()),
                    );
                  },
                  child: Text(lang.text('continue')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
