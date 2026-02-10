import 'package:flutter/material.dart';
import '../theme.dart';

enum PremiumButtonType { primary, secondary, outlined, text }

/// Premium button with gradient and loading states
class PremiumButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final PremiumButtonType type;
  final double? width;
  final double? height;

  const PremiumButton({
    super.key,
    required this.text,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.type = PremiumButtonType.primary,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveHeight = height ?? 56.0;
    
    Widget button;

    switch (type) {
      case PremiumButtonType.primary:
        button = _buildPrimaryButton(context, theme, effectiveHeight);
        break;
      case PremiumButtonType.secondary:
        button = _buildSecondaryButton(context, theme, effectiveHeight);
        break;
      case PremiumButtonType.outlined:
        button = _buildOutlinedButton(context, theme, effectiveHeight);
        break;
      case PremiumButtonType.text:
        button = _buildTextButton(context, theme, effectiveHeight);
        break;
    }

    if (width != null) {
      return SizedBox(width: width, child: button);
    }
    return button;
  }

  Widget _buildPrimaryButton(BuildContext context, ThemeData theme, double height) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withOpacity(0.8),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
          onTap: loading ? null : onPressed,
          child: Center(
            child: _buildButtonContent(theme.colorScheme.onPrimary),
          ),
        ),
      ),
    );
  }

  Widget _buildSecondaryButton(BuildContext context, ThemeData theme, double height) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        color: theme.colorScheme.secondaryContainer,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
          onTap: loading ? null : onPressed,
          child: Center(
            child: _buildButtonContent(theme.colorScheme.onSecondaryContainer),
          ),
        ),
      ),
    );
  }

  Widget _buildOutlinedButton(BuildContext context, ThemeData theme, double height) {
    return OutlinedButton.icon(
      onPressed: loading ? null : onPressed,
      icon: _buildIcon(theme.colorScheme.primary),
      label: _buildLabel(theme.colorScheme.primary),
      style: OutlinedButton.styleFrom(
        minimumSize: Size.fromHeight(height),
      ),
    );
  }

  Widget _buildTextButton(BuildContext context, ThemeData theme, double height) {
    return TextButton.icon(
      onPressed: loading ? null : onPressed,
      icon: _buildIcon(theme.colorScheme.primary),
      label: _buildLabel(theme.colorScheme.primary),
      style: TextButton.styleFrom(
        minimumSize: Size.fromHeight(height),
      ),
    );
  }

  Widget _buildButtonContent(Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (loading)
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          )
        else if (icon != null)
          Icon(icon, color: color, size: 24),
        if ((loading || icon != null) && text.isNotEmpty)
          const SizedBox(width: AppTheme.spacingS),
        if (text.isNotEmpty)
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
      ],
    );
  }

  Widget _buildIcon(Color color) {
    if (loading) {
      return SizedBox(
        width: 16,
        height: 16,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }
    if (icon != null) {
      return Icon(icon, size: 20);
    }
    return const SizedBox.shrink();
  }

  Widget _buildLabel(Color color) {
    return Text(text);
  }
}
