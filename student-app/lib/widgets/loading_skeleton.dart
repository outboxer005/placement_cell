import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme.dart';

/// Shimmer loading skeleton for drive cards
class DriveCardSkeleton extends StatelessWidget {
  const DriveCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
      padding: const EdgeInsets.all(AppTheme.spacingM),
      decoration: BoxDecoration(
        color: AppTheme.pureWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusL),
        border: Border.all(
          color: AppTheme.darkGray.withOpacity(0.1),
        ),
      ),
      child: Shimmer.fromColors(
        baseColor: AppTheme.lightBeige.withOpacity(0.3),
        highlightColor: AppTheme.lightBeige.withOpacity(0.1),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Logo skeleton
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.lightBeige,
                    borderRadius: BorderRadius.circular(AppTheme.radiusM),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 16,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppTheme.lightBeige,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 12,
                        width: 150,
                        decoration: BoxDecoration(
                          color: AppTheme.lightBeige,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingM),
            Row(
              children: [
                Container(
                  height: 24,
                  width: 100,
                  decoration: BoxDecoration(
                    color: AppTheme.lightBeige,
                    borderRadius: BorderRadius.circular(AppTheme.radiusS),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingS),
                Container(
                  height: 24,
                  width: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.lightBeige,
                    borderRadius: BorderRadius.circular(AppTheme.radiusS),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Loading skeleton for list of drives
class DrivesLoadingSkeleton extends StatelessWidget {
  final int count;

  const DrivesLoadingSkeleton({super.key, this.count = 3});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        count,
        (index) => const DriveCardSkeleton(),
      ),
    );
  }
}
