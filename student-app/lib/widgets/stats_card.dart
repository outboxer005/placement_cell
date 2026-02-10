import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../theme.dart';

/// Statistics card for dashboard displays
class StatsCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? color;
  final int index;

  const StatsCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    final cardColor = color ?? AppTheme.primaryOrange;
    
    return FadeInDown(
      duration: const Duration(milliseconds: 400),
      delay: Duration(milliseconds: index * 100),
      child: Container(
        padding: const EdgeInsets.all(AppTheme.spacingM),
        decoration: BoxDecoration(
          color: AppTheme.pureWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
          border: Border.all(
            color: cardColor.withOpacity(0.3),
            width: 1.5,
          ),
          boxShadow: AppTheme.shadowCard,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon with solid background
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingS),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(AppTheme.radiusM),
              ),
              child: Icon(
                icon,
                color: AppTheme.pureWhite,
                size: 24,
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingM),
            
            // Value with animated counter
            TweenAnimationBuilder<double>(
              duration: const Duration(milliseconds: 800),
              tween: Tween(begin: 0, end: double.tryParse(value) ?? 0),
              builder: (context, animatedValue, child) {
                final displayValue = double.tryParse(value) != null
                    ? animatedValue.toInt().toString()
                    : value;
                
                return Text(
                  displayValue,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.darkNavy,
                  ),
                );
              },
            ),
            
            const SizedBox(height: 4),
            
            // Label - using dark gray for contrast
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.darkGray,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Row of stats cards for overview displays
class StatsRow extends StatelessWidget {
  final int totalDrives;
  final int applied;
  final int pending;
  final int accepted;

  const StatsRow({
    super.key,
    required this.totalDrives,
    required this.applied,
    required this.pending,
    required this.accepted,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: StatsCard(
            label: 'Available',
            value: totalDrives.toString(),
            icon: Icons.work_outline,
            color: AppTheme.primaryOrange,
            index: 0,
          ),
        ),
        const SizedBox(width: AppTheme.spacingS),
        Expanded(
          child: StatsCard(
            label: 'Applied',
            value: applied.toString(),
            icon: Icons.send,
            color: AppTheme.lightBlue,
            index: 1,
          ),
        ),
        const SizedBox(width: AppTheme.spacingS),
        Expanded(
          child: StatsCard(
            label: 'Pending',
            value: pending.toString(),
            icon: Icons.pending_actions,
            color: AppTheme.warningAmber,
            index: 2,
          ),
        ),
      ],
    );
  }
}
