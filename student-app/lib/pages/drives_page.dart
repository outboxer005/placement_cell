import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/animated_drive_card.dart';
import '../widgets/stats_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/loading_skeleton.dart';
import 'profile_page.dart';
import 'settings_page.dart';
import 'login_page.dart';
import 'drive_detail_page.dart';

class DrivesPage extends StatefulWidget {
  const DrivesPage({super.key});
  @override
  State<DrivesPage> createState() => _DrivesPageState();
}

class _DrivesPageState extends State<DrivesPage> {
  Future<List<dynamic>>? _future;
  Future<List<dynamic>>? _appsFuture;
  Future<Map<String, dynamic>>? _profileFuture;
  
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  void _loadData() {
    setState(() {
      _future = Api.drives(status: 'published');
      // Make applications loading failures non-fatal
      _appsFuture = Api.myApplications().catchError((error) {
        print('Failed to load applications: $error');
        return <dynamic>[]; // Return empty list if applications fail
      });
      _profileFuture = Api.myProfile();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

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
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5), // Match theme background
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            _loadData();
            // Wait for futures to complete
            await Future.wait([
              _future ?? Future.value([]),
              _appsFuture ?? Future.value([]),
              _profileFuture ?? Future.value({}),
            ]);
          },
          color: AppTheme.primaryOrange,
          child: CustomScrollView(
            slivers: [
              // App Bar
              _buildAppBar(context),
              
              // Profile Banner
              SliverToBoxAdapter(
                child: FutureBuilder<Map<String, dynamic>>(
                  future: _profileFuture,
                  builder: (context, profileSnap) {
                    if (profileSnap.hasData) {
                      final profile = profileSnap.data!;
                      final isComplete = _isProfileComplete(profile);
                      
                      if (!isComplete) {
                        return _buildProfileBanner(context);
                      }
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
              
              // Stats Cards
              SliverToBoxAdapter(
                child: FutureBuilder<List<List<dynamic>>>(
                  future: Future.wait([
                    _future ?? Future.value([]),
                    _appsFuture ?? Future.value([]),
                  ]),
                  builder: (context, snapshot) {
                    if (snapshot.hasData) {
                      final drives = snapshot.data![0];
                      final apps = snapshot.data![1];
                      final pending = apps.where((a) => a['status'] == 'pending').length;
                      
                      return Padding(
                        padding: const EdgeInsets.all(AppTheme.spacingM),
                        child: StatsRow(
                          totalDrives: drives.length,
                          applied: apps.length,
                          pending: pending,
                          accepted: apps.where((a) => a['status'] == 'accepted').length,
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
              
              // Search Bar
              SliverToBoxAdapter(
                child: _buildSearchBar(),
              ),
              
              // Drives List
              _buildDrivesList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: AppTheme.pureWhite,
      elevation: 0,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Image.asset(
          'unilogo.jpg',
          fit: BoxFit.contain,
        ),
      ),
      title: FadeInDown(
        duration: const Duration(milliseconds: 400),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Placement Drives',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppTheme.darkNavy,
              ),
            ),
            Text(
              'Vignan Institute',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.primaryOrange,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.logout, color: AppTheme.darkNavy),
          tooltip: 'Logout',
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Logout'),
                content: const Text('Are you sure you want to logout?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: const Text('Cancel'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    child: const Text('Logout'),
                  ),
                ],
              ),
            );
            
            if (confirm == true) {
              await Api.clear();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => LoginPage(onLoggedIn: _onLoggedIn)),
                  (route) => false,
                );
              }
            }
          },
        ),
      ],
    );
  }

  static void _onLoggedIn() {
    // Placeholder callback
  }

  Widget _buildProfileBanner(BuildContext context) {
    return FadeInDown(
      duration: const Duration(milliseconds: 500),
      child: Container(
        margin: const EdgeInsets.all(AppTheme.spacingM),
        padding: const EdgeInsets.all(AppTheme.spacingM),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppTheme.warningAmber.withOpacity(0.1),
              AppTheme.lightOrange.withOpacity(0.1),
            ],
          ),
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
          border: Border.all(
            color: AppTheme.warningAmber.withOpacity(0.3),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingS),
              decoration: BoxDecoration(
                color: AppTheme.warningAmber.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: AppTheme.warningAmber,
                size: 24,
              ),
            ),
            const SizedBox(width: AppTheme.spacingM),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Complete Your Profile',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Add all required details before applying',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfilePage()),
                );
              },
              style: TextButton.styleFrom(
                backgroundColor: AppTheme.warningAmber,
                foregroundColor: AppTheme.pureWhite,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingM,
                  vertical: AppTheme.spacingS,
                ),
              ),
              child: const Text('Update'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return FadeInDown(
      duration: const Duration(milliseconds: 600),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingM,
          vertical: AppTheme.spacingS,
        ),
        child: TextField(
          controller: _searchController,
          onChanged: (value) {
            setState(() {
              _searchQuery = value.toLowerCase();
            });
          },
          decoration: InputDecoration(
            hintText: 'Search drives, companies...',
            prefixIcon: const Icon(Icons.search, color: AppTheme.primaryOrange),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: AppTheme.darkGray),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _searchQuery = '';
                      });
                    },
                  )
                : null,
            filled: true,
            fillColor: AppTheme.pureWhite,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
              borderSide: BorderSide(
                color: AppTheme.darkGray.withOpacity(0.2),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
              borderSide: BorderSide(
                color: AppTheme.darkGray.withOpacity(0.2),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
              borderSide: const BorderSide(
                color: AppTheme.primaryOrange,
                width: 2,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDrivesList() {
    return SliverPadding(
      padding: const EdgeInsets.all(AppTheme.spacingM),
      sliver: FutureBuilder<List<List<dynamic>>>(
        future: Future.wait([
          _future ?? Future.value([]),
          _appsFuture ?? Future.value([]),
        ]),
        builder: (context, snapshot) {
          // Loading state
          if (snapshot.connectionState != ConnectionState.done) {
            return const SliverToBoxAdapter(
              child: DrivesLoadingSkeleton(count: 5),
            );
          }

          // Error state
          if (snapshot.hasError) {
            return SliverFillRemaining(
              child: EmptyState(
                icon: Icons.error_outline,
                title: 'Oops! Something went wrong',
                message: snapshot.error.toString(),
                action: ElevatedButton.icon(
                  onPressed: _loadData,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ),
            );
          }

          final drives = snapshot.data![0];
          final apps = snapshot.data![1];

          // Filter drives based on search query
          final filteredDrives = _searchQuery.isEmpty
              ? drives
              : drives.where((drive) {
                  final title = (drive['title'] ?? '').toString().toLowerCase();
                  final company = (drive['company'] ?? '').toString().toLowerCase();
                  final location = (drive['location'] ?? '').toString().toLowerCase();
                  return title.contains(_searchQuery) ||
                         company.contains(_searchQuery) ||
                         location.contains(_searchQuery);
                }).toList();

          // Empty state
          if (filteredDrives.isEmpty) {
            return SliverFillRemaining(
              child: EmptyState(
                icon: _searchQuery.isEmpty ? Icons.work_off : Icons.search_off,
                title: _searchQuery.isEmpty
                    ? 'No Drives Available'
                    : 'No Results Found',
                message: _searchQuery.isEmpty
                    ? 'Check back later for new opportunities'
                    : 'Try searching with different keywords',
                action: _searchQuery.isNotEmpty
                    ? TextButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                        child: const Text('Clear Search'),
                      )
                    : null,
              ),
            );
          }

          // Drives list
          return SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final drive = filteredDrives[index];
                final driveId = _stringId(drive['id'] ?? drive['_id']);

                // Find matching application
                Map<String, dynamic>? matchingApp;
                if (driveId != null) {
                  for (final app in apps) {
                    final appDriveId = _stringId(app['drive_id'] ?? app['drive']?['id']);
                    if (appDriveId == driveId) {
                      matchingApp = app;
                      break;
                    }
                  }
                }

                return AnimatedDriveCard(
                  drive: drive,
                  application: matchingApp,
                  index: index,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DriveDetailPage(drive: drive),
                      ),
                    ).then((_) => _loadData());
                  },
                );
              },
              childCount: filteredDrives.length,
            ),
          );
        },
      ),
    );
  }

  bool _isProfileComplete(Map<String, dynamic> profile) {
    // Use first_name instead of the non-existent 'name' field
    final firstName = profile['first_name'];
    final email = profile['email'];
    final phone = profile['phone'];
    return firstName != null && 
           firstName.toString().trim().isNotEmpty &&
           email != null && 
           email.toString().trim().isNotEmpty &&
           phone != null && 
           phone.toString().trim().isNotEmpty;
  }
}
