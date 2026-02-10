
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api.dart';
import '../theme.dart';
import '../widgets/premium_text_field.dart';
import '../widgets/premium_button.dart';
import 'registration_page.dart';

class LoginPage extends StatefulWidget {
  final VoidCallback onLoggedIn;
  const LoginPage({super.key, required this.onLoggedIn});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _ctrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _obscure = true;

  @override
  void dispose() {
    _ctrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final regd = _ctrl.text.trim();
    final password = _passwordCtrl.text.trim();
    if (regd.isEmpty || password.isEmpty) {
      setState(() {
        _error = 'Registration ID and password are required';
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Api.studentLogin(regd, password);
      widget.onLoggedIn();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _changeServerHost() async {
    final currentHost = await Api.getHost() ?? '';
    final controller = TextEditingController(text: currentHost);
    await showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Set Server IP (port fixed: 4000)')
,
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'IP address (e.g., 10.16.13.228)',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.numberWithOptions(decimal: true),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                await Api.setHost(controller.text);
                if (context.mounted) Navigator.of(ctx).pop();
                if (context.mounted) {
                  final base = await Api.currentBase();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Server set to $base')),
                  );
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        // Full update style gradient background
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1976D2),  // Primary Blue
              Color(0xFF42A5F5),  // Light Blue
              Color(0xFFFF9800),  // Secondary Orange
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 480),
                        // Animated floating card
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 30.0, end: 0.0),
                          duration: const Duration(milliseconds: 800),
                          curve: Curves.easeOut,
                          builder: (context, value, child) {
                            return Transform.translate(
                              offset: Offset(0, value),
                              child: Opacity(
                                opacity: 1.0 - (value / 30),
                                child: child,
                              ),
                            );
                          },
                          child: Card(
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                            ),
                            color: Colors.white,
                            shadowColor: Colors.black.withOpacity(0.15),
                            child: Padding(
                              padding: const EdgeInsets.all(AppTheme.spacingXl),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const _LoginHeader(),
                                  const SizedBox(height: AppTheme.spacingL),
                                  PremiumTextField(
                                    controller: _ctrl,
                                    labelText: 'Registration ID',
                                    hintText: 'e.g., VU2025001',
                                    prefixIcon: Icons.badge,
                                    textInputAction: TextInputAction.next,
                                  ),
                                  const SizedBox(height: AppTheme.spacingM),
                                  PremiumTextField(
                                    controller: _passwordCtrl,
                                    labelText: 'Password (DOB)',
                                    hintText: 'DDMMYYYY',
                                    prefixIcon: Icons.lock_outline,
                                    obscureText: _obscure,
                                    suffixIcon: IconButton(
                                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                                      onPressed: () => setState(() => _obscure = !_obscure),
                                      tooltip: _obscure ? 'Show password' : 'Hide password',
                                    ),
                                  ),
                                  const SizedBox(height: AppTheme.spacingS),
                                  Text(
                                    'Tip: Your password defaults to your DOB in DDMMYYYY format',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: AppTheme.spacingM),
                                  if (_error != null)
                                    Container(
                                      padding: const EdgeInsets.all(AppTheme.spacingM),
                                      margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                                        color: Theme.of(context).colorScheme.errorContainer,
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.error_outline,
                                            color: Theme.of(context).colorScheme.error,
                                            size: 20,
                                          ),
                                          const SizedBox(width: AppTheme.spacingS),
                                          Expanded(
                                            child: Text(
                                              _error!,
                                              style: TextStyle(
                                                color: Theme.of(context).colorScheme.onErrorContainer,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  PremiumButton(
                                    text: 'Sign In',
                                    icon: Icons.login,
                                    onPressed: _submit,
                                    loading: _loading,
                                    width: double.infinity,
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      FutureBuilder<Map<String, String?>>(
                                        future: SharedPreferences.getInstance().then((sp) => {
                                              'id': sp.getString('last_regd_id'),
                                              'pwd': sp.getString('last_password'),
                                            }),
                                        builder: (context, snap) {
                                          final last = snap.data?['id'];
                                          final lastPwd = snap.data?['pwd'];
                                          if (last == null || last.isEmpty) return const SizedBox.shrink();
                                          return TextButton.icon(
                                            onPressed: _loading ? null : () {
                                              _ctrl.text = last;
                                              if (lastPwd != null && lastPwd.isNotEmpty) {
                                                _passwordCtrl.text = lastPwd;
                                              } else {
                                                _passwordCtrl.clear();
                                              }
                                            },
                                            icon: const Icon(Icons.history),
                                            label: Text('Last login: $last'),
                                          );
                                        },
                                      ),
                                      TextButton(
                                        onPressed: _loading
                                            ? null
                                            : () async {
                                                await Navigator.of(context).push(
                                                  MaterialPageRoute(
                                                    builder: (_) => RegistrationPage(onRegistered: widget.onLoggedIn),
                                                  ),
                                                );
                                              },
                                        child: const Text('Create account'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
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

class _ServerChip extends StatelessWidget {
  final VoidCallback onTap;
  const _ServerChip({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: Api.currentBase(),
      builder: (context, snap) {
        final base = snap.data;
        return GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: Colors.white.withOpacity(0.2),
              border: Border.all(color: Colors.white.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.cloud, size: 18, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    base == null ? 'Server: configuring...' : 'Server: $base',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _LoginHeader extends StatelessWidget {
  const _LoginHeader();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome back',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'Sign in to explore drives and track your applications.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colors.onSurfaceVariant),
        ),
      ],
    );
  }
}
