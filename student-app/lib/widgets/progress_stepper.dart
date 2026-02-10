import 'package:flutter/material.dart';
import '../theme.dart';

/// Premium progress stepper indicator
class ProgressStepper extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final List<String> stepLabels;

  const ProgressStepper({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.stepLabels,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Column(
      children: [
        // Step indicators
        Row(
          children: List.generate(totalSteps, (index) {
            final isCompleted = index < currentStep;
            final isCurrent = index == currentStep;
            final isUpcoming = index > currentStep;

            return Expanded(
              child: Row(
                children: [
                  Expanded(
                    child: _StepIndicator(
                      stepNumber: index + 1,
                      isCompleted: isCompleted,
                      isCurrent: isCurrent,
                      isUpcoming: isUpcoming,
                      label: stepLabels[index],
                      theme: theme,
                    ),
                  ),
                  if (index < totalSteps - 1)
                    Expanded(
                      child: Container(
                        height: 2,
                        color: isCompleted
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outline.withOpacity(0.2),
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
        const SizedBox(height: AppTheme.spacingS),
        // Current step label
        Text(
          stepLabels[currentStep],
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.primary,
          ),
        ),
      ],
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int stepNumber;
  final bool isCompleted;
  final bool isCurrent;
  final bool isUpcoming;
  final String label;
  final ThemeData theme;

  const _StepIndicator({
    required this.stepNumber,
    required this.isCompleted,
    required this.isCurrent,
    required this.isUpcoming,
    required this.label,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color foregroundColor;
    Widget icon;

    if (isCompleted) {
      backgroundColor = theme.colorScheme.primary;
      foregroundColor = theme.colorScheme.onPrimary;
      icon = Icon(Icons.check, size: 16, color: foregroundColor);
    } else if (isCurrent) {
      backgroundColor = theme.colorScheme.primary;
      foregroundColor = theme.colorScheme.onPrimary;
      icon = Text(
        stepNumber.toString(),
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: foregroundColor,
        ),
      );
    } else {
      backgroundColor = theme.colorScheme.surfaceContainerHighest;
      foregroundColor = theme.colorScheme.onSurfaceVariant;
      icon = Text(
        stepNumber.toString(),
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: foregroundColor,
        ),
      );
    }

    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
        boxShadow: isCurrent
            ? [
                BoxShadow(
                  color: theme.colorScheme.primary.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Center(child: icon),
    );
  }
}

/// Wizard navigation buttons
class WizardNavigation extends StatelessWidget {
  final bool canGoBack;
  final bool canGoNext;
  final VoidCallback? onBack;
  final VoidCallback? onNext;
  final String? nextLabel;
  final bool isLoading;

  const WizardNavigation({
    super.key,
    this.canGoBack = true,
    this.canGoNext = true,
    this.onBack,
    this.onNext,
    this.nextLabel,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (canGoBack)
          Expanded(
            child: OutlinedButton.icon(
              onPressed: isLoading ? null : onBack,
              icon: const Icon(Icons.arrow_back),
              label: const Text('Back'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
            ),
          ),
        if (canGoBack && canGoNext) const SizedBox(width: AppTheme.spacingM),
        if (canGoNext)
          Expanded(
            flex: canGoBack ? 1 : 2,
            child: ElevatedButton.icon(
              onPressed: isLoading ? null : onNext,
              icon: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Icon(nextLabel == 'Submit' ? Icons.check_circle : Icons.arrow_forward),
              label: Text(nextLabel ?? 'Next'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
            ),
          ),
      ],
    );
  }
}
