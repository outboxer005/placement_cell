import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../theme.dart';

/// Professional animated drive card with orange theme
class AnimatedDriveCard extends StatelessWidget {
  final Map<String, dynamic> drive;
  final Map<String, dynamic>? application;
  final VoidCallback onTap;
  final int index;

  const AnimatedDriveCard({
    super.key,
    required this.drive,
    this.application,
    required this.onTap,
    this.index = 0,
  });

  String? _stringId(dynamic v) {
    if (v == null) return null;
    if (v is String) return v.isNotEmpty ? v : null;
    if (v is num) return v.toString();
    if (v is Map) {
      final oid = v[r'$oid'] ?? v['oid'];
      if (oid != null) return _stringId(oid);
      final id = v['_id'] ?? v['id'];
      if (id != null) return _stringId(id);
    }
    return v.toString();
  }

  @override
  Widget build(BuildContext context) {
    final status = application != null ? (application!['status']?.toString() ?? 'pending') : null;
    final company = drive['company'] ?? 'Company';
    final title = drive['title'] ?? 'Job Opening';
    final location = drive['location'] ?? 'Location';
    final salary = drive['salary'] ?? 'Not specified';
    final cgpa = drive['cgpa_required']?.toString() ?? 'Any';
    
    return FadeInUp(
      duration: const Duration(milliseconds: 300),
      delay: Duration(milliseconds: index * 100),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
        child: Material(
          color: AppTheme.pureWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
          elevation: 0,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AppTheme.radiusL),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppTheme.radiusL),
                border: Border.all(
                  color: AppTheme.darkGray.withOpacity(0.1),
                  width: 1,
                ),
                boxShadow: AppTheme.shadowCard,
              ),
              padding: const EdgeInsets.all(AppTheme.spacingM),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Company Logo/Letter
                      _buildCompanyLogo(company),
                      const SizedBox(width: AppTheme.spacingM),
                      
                      // Title and Company
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.darkNavy,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(
                                  Icons.business,
                                  size: 14,
                                  color: AppTheme.darkGray,
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    '$company • $location',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppTheme.darkGray,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      // Status Badge
                      if (status != null) _buildStatusBadge(status),
                    ],
                  ),
                  
                  const SizedBox(height: AppTheme.spacingM),
                  
                  // Details Row
                  Row(
                    children: [
                      // Salary
                      _buildDetailChip(
                        icon: Icons.attach_money,
                        label: salary,
                        color: AppTheme.primaryOrange,
                      ),
                      const SizedBox(width: AppTheme.spacingS),
                      
                      // CGPA
                      _buildDetailChip(
                        icon: Icons.grade,
                        label: 'CGPA: $cgpa',
                        color: AppTheme.lightBlue,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: AppTheme.spacingS),
                  
                  // Action hint
                  Row(
                    children: [
                      Icon(
                        Icons.touch_app,
                        size: 14,
                        color: AppTheme.primaryOrange,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Tap to view details',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.primaryOrange,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.arrow_forward_ios,
                        size: 14,
                        color: AppTheme.primaryOrange,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCompanyLogo(String company) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: AppTheme.orangeGradient,
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        boxShadow: AppTheme.shadowLight,
      ),
      child: Center(
        child: Text(
          company.isNotEmpty ? company[0].toUpperCase() : 'C',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppTheme.pureWhite,
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    IconData icon;
    
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'shortlisted':
        bgColor = AppTheme.successGreen.withOpacity(0.1);
        textColor = AppTheme.successGreen;
        icon = Icons.check_circle;
        break;
      case 'rejected':
        bgColor = AppTheme.errorRed.withOpacity(0.1);
        textColor = AppTheme.errorRed;
        icon = Icons.cancel;
        break;
      default:
        bgColor = AppTheme.warningAmber.withOpacity(0.1);
        textColor = AppTheme.warningAmber;
        icon = Icons.pending;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingS,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusS),
        border: Border.all(color: textColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingS,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppTheme.radiusS),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
