import 'package:flutter/material.dart';
import '../theme.dart';

/// Premium glass card widget with glassmorphism effect
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? borderRadius;
  final Color? color;
  final Border? border;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.color,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? AppTheme.radiusL;

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? 
            (isDark
                ? Colors.white.withOpacity(0.05)
                : Colors.white.withOpacity(0.7)),
        borderRadius: BorderRadius.circular(radius),
        border: border ?? 
            Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.1)
                  : Colors.white.withOpacity(0.2),
              width: 1,
            ),
        boxShadow: AppTheme.shadowLight,
      ),
      padding: padding ?? const EdgeInsets.all(AppTheme.spacingL),
      child: child,
    );
  }
}

/// Section card with title and description
class SectionCard extends StatelessWidget {
  final String title;
  final String? description;
  final Widget child;
  final IconData? icon;

  const SectionCard({
    super.key,
    required this.title,
    this.description,
    required this.child,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusL),
        side: BorderSide(
          color: theme.colorScheme.outline.withOpacity(0.1),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Icon(
                    icon,
                    color: theme.colorScheme.primary,
                    size: 24,
                  ),
                  const SizedBox(width: AppTheme.spacingS),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            if (description != null) ...[
              const SizedBox(height: AppTheme.spacingXs),
              Text(
                description!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: AppTheme.spacingM),
            child,
          ],
        ),
      ),
    );
  }
}
