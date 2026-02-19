import 'package:flutter/material.dart';
import '../services/api.dart';
import '../services/settings.dart';
import '../theme.dart';
import '../widgets/glass_card.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _theme = 'system';
  
  final _themeColors = const [
    {'name': 'Teal', 'color': Colors.teal},
    {'name': 'Indigo', 'color': Color(0xFF6366F1)},
    {'name': 'Purple', 'color': Color(0xFF8B5CF6)},
    {'name': 'Blue', 'color': Colors.blue},
    {'name': 'Green', 'color': Colors.green},
    {'name': 'Orange', 'color': Colors.orange},
    {'name': 'Pink', 'color': Colors.pink},
    {'name': 'Red', 'color': Colors.red},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final m = SettingsController.themeMode.value;
    setState(() { _theme = m == ThemeMode.light ? 'light' : m == ThemeMode.dark ? 'dark' : 'system'; });
  }

  Future<void> _saveTheme(String v) async {
    setState(() { _theme = v; });
    switch (v) {
      case 'light': await SettingsController.setThemeMode(ThemeMode.light); break;
      case 'dark': await SettingsController.setThemeMode(ThemeMode.dark); break;
      default: await SettingsController.setThemeMode(ThemeMode.system); break;
    }
  }

  Future<void> _selectColor(Color color) async {
    await SettingsController.setSeedColor(color);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Theme color updated'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        children: [
          // Theme Mode Section
          SectionCard(
            title: 'Appearance Mode',
            description: 'Choose your preferred theme',
            icon: Icons.palette_outlined,
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'system', label: Text('Auto'), icon: Icon(Icons.phone_android)),
                ButtonSegment(value: 'light', label: Text('Light'), icon: Icon(Icons.light_mode_outlined)),
                ButtonSegment(value: 'dark', label: Text('Dark'), icon: Icon(Icons.dark_mode_outlined)),
              ],
              selected: {_theme},
              onSelectionChanged: (s) => _saveTheme(s.first),
            ),
          ),
          
          const SizedBox(height: AppTheme.spacingL),
          
          // Theme Color Section
          SectionCard(
            title: 'Theme Color',
            description: 'Pick your favorite accent color',
            icon: Icons.color_lens_outlined,
            child: ValueListenableBuilder<Color>(
              valueListenable: SettingsController.seedColor,
              builder: (context, currentColor, _) {
                return Wrap(
                  spacing: AppTheme.spacingM,
                  runSpacing: AppTheme.spacingM,
                  children: _themeColors.map((colorData) {
                    final color = colorData['color'] as Color;
                    final name = colorData['name'] as String;
                    final isSelected = color.value == currentColor.value;
                    
                    return InkWell(
                      onTap: () => _selectColor(color),
                      borderRadius: BorderRadius.circular(AppTheme.radiusM),
                      child: Container(
                        width: 72,
                        padding: const EdgeInsets.all(AppTheme.spacingS),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppTheme.radiusM),
                          border: Border.all(
                            color: isSelected ? color : theme.dividerColor,
                            width: isSelected ? 3 : 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: color,
                                shape: BoxShape.circle,
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: color.withOpacity(0.4),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: isSelected
                                  ? const Icon(Icons.check, color: Colors.white, size: 24)
                                  : null,
                            ),
                            const SizedBox(height: AppTheme.spacingXs),
                            Text(
                              name,
                              style: theme.textTheme.labelSmall?.copyWith(
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                color: isSelected ? color : theme.colorScheme.onSurfaceVariant,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ),
          
          const SizedBox(height: AppTheme.spacingXl),
          
          // About Section
          SectionCard(
            title: 'About',
            description: 'Vignan Student Placement Cell',
            icon: Icons.info_outline,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.school_outlined),
                  title: const Text('Vignan Institute'),
                  subtitle: const Text('Student Placement Management'),
                ),
                ListTile(
                  leading: const Icon(Icons.api_outlined),
                  title: const Text('Server'),
                  subtitle: FutureBuilder<String>(
                    future: Api.currentBase(),
                    builder: (context, snap) => Text(snap.data ?? 'http://localhost:4000'),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: AppTheme.spacingXl),
        ],
      ),
    );
  }
}

