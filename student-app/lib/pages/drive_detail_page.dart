import 'package:flutter/material.dart';
import '../services/api.dart';

class DriveDetailPage extends StatefulWidget {
  final Map<String, dynamic> drive;
  const DriveDetailPage({super.key, required this.drive});

  @override
  State<DriveDetailPage> createState() => _DriveDetailPageState();
}

class _DriveDetailPageState extends State<DriveDetailPage> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  Future<Map<String, dynamic>>? _profileFuture;
  bool _isApplying = false;

  String? _stringId(dynamic v) {
    if (v == null) return null;
    if (v is String) return v;
    if (v is num) return v.toString();
    if (v is Map) {
      final dynamic inner = v['id'] ?? v[r'$oid'] ?? v['_id'];
      if (inner != null) return _stringId(inner);
    }
    return v.toString();
  }

  @override
  void initState() {
    super.initState();
    _profileFuture = Api.myProfile();
    
    _fadeController = AnimationController(duration: const Duration(milliseconds: 800), vsync: this);
    _slideController = AnimationController(duration: const Duration(milliseconds: 600), vsync: this);
    
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

  Future<void> _applyToDrive() async {
    setState(() => _isApplying = true);
    try {
      // Extract drive ID - server returns numeric id field
      final driveIdValue = widget.drive['id'] ?? widget.drive['_id'];
      if (driveIdValue == null) {
        throw Exception('Drive ID not found in drive data');
      }
      final driveId = driveIdValue is num 
        ? driveIdValue.toString() 
        : (driveIdValue is String 
          ? driveIdValue 
          : _stringId(driveIdValue) ?? driveIdValue.toString());
      
      if (driveId.isEmpty) {
        throw Exception('Invalid drive ID: empty');
      }
      await Api.applyToDrive(driveId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Application submitted successfully!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isApplying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final drive = widget.drive;
    final id = _stringId(drive['id'] ?? drive['_id']);
    
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                      theme.colorScheme.tertiary,
                    ],
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -50,
                      top: -50,
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    Positioned(
                      left: -30,
                      bottom: -30,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.05),
                        ),
                      ),
                    ),
                    Center(
                      child: FadeTransition(
                        opacity: _fadeAnimation,
                        child: SlideTransition(
                          position: _slideAnimation,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.business_center,
                                size: 60,
                                color: Colors.white,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                drive['title'] ?? 'Drive',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Company Info Card
                      Card(
                        elevation: 8,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                theme.colorScheme.primaryContainer,
                                theme.colorScheme.secondaryContainer,
                              ],
                            ),
                          ),
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.business, color: theme.colorScheme.primary),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Company Information',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: theme.colorScheme.onPrimaryContainer,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildInfoRow(Icons.business_center, 'Company', drive['company'] ?? 'Not specified'),
                              _buildInfoRow(Icons.location_on, 'Location', drive['location'] ?? 'Not specified'),
                              _buildInfoRow(Icons.attach_money, 'Salary', drive['salary'] ?? 'Not specified'),
                              _buildInfoRow(Icons.work, 'Experience Required', drive['experience_required'] ?? 'Not specified'),
                              _buildInfoRow(Icons.grade, 'CGPA Required', drive['cgpa_required']?.toString() ?? 'Not specified'),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Job Details Card
                      Card(
                        elevation: 8,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.description, color: theme.colorScheme.primary),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Job Details',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              if (drive['description'] != null)
                                Text(
                                  drive['description'],
                                  style: theme.textTheme.bodyLarge,
                                )
                              else
                                Text(
                                  'No description available',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Requirements Card
                      Card(
                        elevation: 8,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.checklist, color: theme.colorScheme.primary),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Requirements',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildInfoRow(Icons.school, 'Branch', drive['branch'] ?? 'Any'),
                              _buildInfoRow(Icons.calendar_today, 'Application Deadline', drive['deadline'] ?? 'Not specified'),
                              _buildInfoRow(Icons.schedule, 'Drive Date', drive['drive_date'] ?? 'Not specified'),
                              _buildInfoRow(Icons.info, 'Status', drive['status'] ?? 'Not specified'),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      // Apply Button
                      FutureBuilder<Map<String, dynamic>>(
                        future: _profileFuture,
                        builder: (context, profSnap) {
                          if (!profSnap.hasData) return const SizedBox.shrink();
                          final me = profSnap.data!;
                          final incomplete = (me['name'] == null || (me['name'] as String).trim().isEmpty) || 
                                            (me['email'] == null || (me['email'] as String).trim().isEmpty) || 
                                            (me['phone'] == null || (me['phone'] as String).trim().isEmpty) || 
                                            (me['resume_url'] == null || (me['resume_url'] as String).trim().isEmpty);
                          
                          return Container(
                            width: double.infinity,
                            height: 60,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: incomplete 
                                ? LinearGradient(colors: [Colors.grey.shade400, Colors.grey.shade500])
                                : LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      theme.colorScheme.primary,
                                      theme.colorScheme.secondary,
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
                                borderRadius: BorderRadius.circular(16),
                                onTap: incomplete ? null : _isApplying ? null : _applyToDrive,
                                child: Center(
                                  child: _isApplying
                                    ? SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            incomplete ? Icons.warning : Icons.send,
                                            color: Colors.white,
                                            size: 24,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            incomplete 
                                              ? 'Complete Profile to Apply'
                                              : 'Apply to this Drive',
                                            style: const TextStyle(
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
                          );
                        },
                      ),
                      
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}



