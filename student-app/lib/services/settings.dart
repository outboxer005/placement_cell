import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsController {
  static final ValueNotifier<ThemeMode> themeMode = ValueNotifier(ThemeMode.system);
  static final ValueNotifier<Color> seedColor = ValueNotifier(Colors.teal);
  static final ValueNotifier<int> unreadNotifications = ValueNotifier(0);
  static const _seedKey = 'theme_seed_color';

  static Future<void> init() async {
    final sp = await SharedPreferences.getInstance();
    final m = sp.getString('theme_mode');
    switch (m) {
      case 'light': themeMode.value = ThemeMode.light; break;
      case 'dark': themeMode.value = ThemeMode.dark; break;
      default: themeMode.value = ThemeMode.system; break;
    }

    final seed = sp.getInt(_seedKey);
    if (seed != null) {
      seedColor.value = Color(seed);
    }
  }

  static Future<void> setThemeMode(ThemeMode mode) async {
    themeMode.value = mode;
    final sp = await SharedPreferences.getInstance();
    final v = mode == ThemeMode.light ? 'light' : mode == ThemeMode.dark ? 'dark' : 'system';
    await sp.setString('theme_mode', v);
  }

  static Future<void> setSeedColor(Color color) async {
    seedColor.value = color;
    final sp = await SharedPreferences.getInstance();
    await sp.setInt(_seedKey, color.value);
  }

  static void setUnreadCount(int count) {
    unreadNotifications.value = count < 0 ? 0 : count;
  }
}

