import 'package:flutter/material.dart';
import 'services/api.dart';
import 'pages/login_page.dart';
import 'pages/drives_page.dart';
import 'pages/applications_page.dart';
import 'pages/notifications_page.dart';
import 'pages/profile_page.dart';
import 'theme.dart';
import 'services/notification_service.dart';

import 'services/settings.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';

// Global navigator key for notification navigation
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  try {
    await Firebase.initializeApp();
    print('✅ Firebase initialized successfully');
  } catch (e) {
    print('⚠️ Firebase initialization failed: $e');
    print('   Make sure google-services.json is configured');
  }
  
  await SettingsController.init();
  
  // Initialize push notifications
  try {
    final notificationService = NotificationService();
    await notificationService.initialize();
    
    // Handle notification taps - navigate to notifications page
    notificationService.onNotificationTap = (payload) {
      print('Notification tapped with payload: $payload');
      navigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainShell(initialIndex: 2)),
        (route) => false,
      );
    };
    
    print('✅ Push notifications configured');
  } catch (e) {
    print('⚠️ Push notification setup failed: $e');
  }
  
  runApp(const PlacementStudentApp());
}

class PlacementStudentApp extends StatelessWidget {
  const PlacementStudentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: SettingsController.themeMode,
      builder: (context, mode, _) {
        return ValueListenableBuilder<Color>(
          valueListenable: SettingsController.seedColor,
          builder: (context, seed, __) {
            return MaterialApp(
              title: 'Placement Cell',
              navigatorKey: navigatorKey,
              theme: AppTheme.lightTheme(seed),
              darkTheme: AppTheme.darkTheme(seed),
              themeMode: mode,
              home: const SplashGate(),
              debugShowCheckedModeBanner: false,
            );
          },
        );
      },
    );
  }
}

class SplashGate extends StatefulWidget {
  const SplashGate({super.key});
  @override
  State<SplashGate> createState() => _SplashGateState();
}

class _SplashGateState extends State<SplashGate> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack);
    _start();
  }

  Future<void> _start() async {
    await Future.delayed(const Duration(milliseconds: 150));
    _ctrl.forward();
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    Navigator.of(context).pushReplacement(PageRouteBuilder(
      transitionDuration: const Duration(milliseconds: 500),
      pageBuilder: (_, __, ___) => const OnboardingGate(),
      transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child),
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.primary,
              Theme.of(context).colorScheme.secondary,
              Theme.of(context).colorScheme.tertiary,
            ],
          ),
        ),
        child: Center(
          child: ScaleTransition(
            scale: _scale,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.school, size: 80, color: Colors.white),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Placement Cell',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    shadows: [
                      Shadow(
                        color: Colors.black26,
                        offset: Offset(0, 2),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Vignan University',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                    shadows: [
                      Shadow(
                        color: Colors.black12,
                        offset: Offset(0, 1),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class OnboardingGate extends StatefulWidget {
  const OnboardingGate({super.key});
  @override
  State<OnboardingGate> createState() => _OnboardingGateState();
}

class _OnboardingGateState extends State<OnboardingGate> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(duration: const Duration(milliseconds: 1000), vsync: this);
    _slideController = AnimationController(duration: const Duration(milliseconds: 800), vsync: this);
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
    );
    
    _fadeController.forward();
    _slideController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.primaryContainer,
              Theme.of(context).colorScheme.secondaryContainer,
              Theme.of(context).colorScheme.tertiaryContainer,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color.withOpacity(0.1),
                            boxShadow: [
                              BoxShadow(
                                color: color.withOpacity(0.3),
                                blurRadius: 20,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.rocket_launch,
                            size: 60,
                            color: color,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          'Welcome to\nPlacement Cell',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSurface,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Register/login, complete your profile, view drives, and apply with one tap.',
                          style: TextStyle(
                            fontSize: 16,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Container(
                      width: double.infinity,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [color, color.withOpacity(0.8)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: color.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () {
                            Navigator.of(context).pushReplacement(PageRouteBuilder(
                              transitionDuration: const Duration(milliseconds: 500),
                              pageBuilder: (_, __, ___) => const AuthGate(),
                              transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child),
                            ));
                          },
                          child: Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.arrow_forward, color: Colors.white, size: 24),
                                const SizedBox(width: 8),
                                const Text(
                                  'Get Started',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _loading = true;
  bool _authed = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      final me = await Api.me();
      if (me?['ok'] == true) {
        setState(() { _authed = true; _loading = false; });
        return;
      }
    } catch (_) {
      // fallthrough to auto re-login
    }
    try {
      final sp = await SharedPreferences.getInstance();
      final lastId = sp.getString('last_regd_id');
      final lastPwd = sp.getString('last_password');
      if (lastId != null && lastId.isNotEmpty && lastPwd != null && lastPwd.isNotEmpty) {
        await Api.studentLogin(lastId, lastPwd);
        setState(() { _authed = true; _loading = false; });
        return;
      }
    } catch (_) {}
    setState(() { _loading = false; _authed = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return _authed ? const MainShell() : LoginPage(onLoggedIn: () { setState(() { _authed = true; }); });
  }
}

class MainShell extends StatefulWidget {
  final int initialIndex;
  const MainShell({super.key, this.initialIndex = 0});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late int _index;
  final _pages = const [DrivesPage(), ApplicationsPage(), NotificationsPage(), ProfilePage()];

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_index],
      bottomNavigationBar: ValueListenableBuilder<int>(
        valueListenable: SettingsController.unreadNotifications,
        builder: (context, unread, _) {
          return NavigationBar(
            selectedIndex: _index,
            destinations: [
              const NavigationDestination(icon: Icon(Icons.work_outline), label: 'Drives'),
              const NavigationDestination(icon: Icon(Icons.assignment_outlined), label: 'Status'),
              NavigationDestination(
                icon: Stack(children: [
                  const Icon(Icons.notifications_outlined),
                  if (unread > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(width: 10, height: 10, decoration: BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
                    ),
                ]),
                label: 'Alerts',
              ),
              const NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
            ],
            onDestinationSelected: (i) => setState(() => _index = i),
          );
        },
      ),
    );
  }
}


