import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../theme.dart';

/// Empty state widget with illustration and message
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return FadeIn(
      duration: const Duration(milliseconds: 500),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingXl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon with gradient background
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  gradient: AppTheme.orangeGradient,
                  shape: BoxShape.circle,
                  boxShadow: AppTheme.shadowMedium,
                ),
                child: Icon(
                  icon,
                  size: 60,
                  color: AppTheme.pureWhite,
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingL),
              
              // Title - Force dark color for readability
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.darkNavy, // Force dark text
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppTheme.spacingS),
              
              // Message - Force dark color for readability
              Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.darkGray, // Force dark gray text
                ),
                textAlign: TextAlign.center,
              ),
              
              if (action != null) ...[
                const SizedBox(height: AppTheme.spacingL),
                action!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
