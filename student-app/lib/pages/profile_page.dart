import 'package:flutter/material.dart';
import '../services/api.dart';
import '../main.dart';
import 'settings_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});
  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Future<Map<String, dynamic>>? _future;
  @override
  void initState() {
    super.initState();
    _future = Api.myProfile();
  }

  Future<void> _edit(Map<String, dynamic> me) async {
    // Get first_name and last_name directly from profile data
    final firstName = me['first_name']?.toString() ?? '';
    final lastName = me['last_name']?.toString() ?? '';
    
    final firstNameCtrl = TextEditingController(text: firstName);
    final lastNameCtrl = TextEditingController(text: lastName);
    final emailCtrl = TextEditingController(text: me['email']?.toString() ?? '');
    final phoneCtrl = TextEditingController(text: me['phone']?.toString() ?? '');
    final resumeCtrl = TextEditingController(text: me['resume_url']?.toString() ?? '');
    final altEmailCtrl = TextEditingController(text: me['alt_email']?.toString() ?? '');
    final altPhoneCtrl = TextEditingController(text: me['alt_phone']?.toString() ?? '');
    bool breakFlag = me['break_in_studies'] == true;
    bool backlogFlag = me['has_backlogs'] == true;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (innerCtx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(innerCtx).viewInsets.bottom),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Update Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextField(controller: firstNameCtrl, decoration: const InputDecoration(labelText: 'First name *')),
                    const SizedBox(height: 8),
                    TextField(controller: lastNameCtrl, decoration: const InputDecoration(labelText: 'Last name (Surname)')),
                    const SizedBox(height: 8),
                    TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
                    const SizedBox(height: 8),
                    TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
                    const SizedBox(height: 8),
                    TextField(controller: altEmailCtrl, decoration: const InputDecoration(labelText: 'Alternate email')),
                    const SizedBox(height: 8),
                    TextField(controller: altPhoneCtrl, decoration: const InputDecoration(labelText: 'Alternate phone')),
                    const SizedBox(height: 8),
                    TextField(controller: resumeCtrl, decoration: const InputDecoration(labelText: 'Resume URL')),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Break in studies'),
                      value: breakFlag,
                      onChanged: (v) => setSheetState(() => breakFlag = v),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Pending backlogs'),
                      value: backlogFlag,
                      onChanged: (v) => setSheetState(() => backlogFlag = v),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          try {
                            final payload = <String, dynamic>{
                              'breakInStudies': breakFlag,
                              'hasBacklogs': backlogFlag,
                            };
                            
                            // Only add fields if they're not empty to avoid validation errors
                            if (firstNameCtrl.text.trim().isNotEmpty) 
                              payload['first_name'] = firstNameCtrl.text.trim();
                            if (lastNameCtrl.text.trim().isNotEmpty)
                              payload['last_name'] = lastNameCtrl.text.trim();
                            if (emailCtrl.text.trim().isNotEmpty)
                              payload['email'] = emailCtrl.text.trim();
                            if (phoneCtrl.text.trim().isNotEmpty)
                              payload['phone'] = phoneCtrl.text.trim();
                            if (resumeCtrl.text.trim().isNotEmpty)
                              payload['resume_url'] = resumeCtrl.text.trim();
                            if (altEmailCtrl.text.trim().isNotEmpty)
                              payload['altEmail'] = altEmailCtrl.text.trim();
                            if (altPhoneCtrl.text.trim().isNotEmpty)
                              payload['altPhone'] = altPhoneCtrl.text.trim();
                            
                            final updated = await Api.updateMyProfile(payload);
                            if (!mounted) return;
                            Navigator.of(innerCtx).pop();
                            setState(() => _future = Future.value(updated));
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                          }
                        },
                        icon: const Icon(Icons.save),
                        label: const Text('Save'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () async { await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsPage())); setState(() { _future = Api.myProfile(); }); },
          )
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
          if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
          final me = snap.data ?? {};
          final incomplete = (me['first_name'] == null || (me['first_name'] as String).trim().isEmpty) ||
              (me['email'] == null || (me['email'] as String).trim().isEmpty) ||
              (me['phone'] == null || (me['phone'] as String).trim().isEmpty);
          final education = (me['education'] as Map<String, dynamic>?) ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (incomplete)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.15),
                    border: Border.all(color: Colors.amber),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('Please complete your profile (name, email, phone, resume) to apply to drives.'),
                ),
              _ProfileSummaryCard(me: me),
              const SizedBox(height: 16),
              _ContactCard(me: me),
              const SizedBox(height: 16),
              _AddressCard(
                permanent: me['permanent_address'] as Map<String, dynamic>?,
                present: me['present_address'] as Map<String, dynamic>?,
              ),
              const SizedBox(height: 16),
              _AcademicsCard(education: education),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _edit(me),
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit Profile'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await Api.clear();
                    if (mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const _LoggedOutScreen()),
                        (route) => false,
                      );
                    }
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Logout'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _LoggedOutScreen extends StatelessWidget {
  const _LoggedOutScreen();
  @override
  Widget build(BuildContext context) {
    // Auto-navigate to login on next frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const AuthGate()),
        (route) => false,
      );
    });
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

class _ProfileSummaryCard extends StatelessWidget {
  final Map<String, dynamic> me;
  const _ProfileSummaryCard({required this.me});

  @override
  Widget build(BuildContext context) {
    final tiles = [
      _InfoTile(icon: Icons.badge_outlined, label: 'Regd ID', value: me['regd_id'] ?? '-'),
      _InfoTile(icon: Icons.cake_outlined, label: 'DOB', value: (me['dob'] ?? '').toString()),
      _InfoTile(icon: Icons.account_tree_outlined, label: 'Branch', value: me['branch'] ?? '-'),
      _InfoTile(icon: Icons.grade_outlined, label: 'CGPA', value: (me['cgpa'] ?? '-').toString()),
      _InfoTile(icon: Icons.school_outlined, label: 'Year', value: me['year']?.toString() ?? '-'),
      if (me['section'] != null && (me['section'] as String).isNotEmpty)
        _InfoTile(icon: Icons.group_outlined, label: 'Section', value: me['section']?.toString() ?? '-'),
      if (me['current_year'] != null && (me['current_year'] as String).isNotEmpty)
        _InfoTile(icon: Icons.school, label: 'Current Year', value: me['current_year']?.toString() ?? '-'),
      _InfoTile(icon: Icons.flag_outlined, label: 'Nationality', value: me['nationality'] ?? '-'),
      _InfoTile(icon: Icons.pause_circle_outline, label: 'Breaks', value: (me['break_in_studies'] == true) ? 'Yes' : 'No'),
      _InfoTile(icon: Icons.warning_amber_rounded, label: 'Backlogs', value: (me['has_backlogs'] == true) ? 'Yes' : 'No'),
      if (me['aadhar_number'] != null && (me['aadhar_number'] as String).isNotEmpty)
        _InfoTile(icon: Icons.badge_outlined, label: 'Aadhar', value: me['aadhar_number']?.toString() ?? '-'),
      if (me['pan_card'] != null && (me['pan_card'] as String).isNotEmpty)
        _InfoTile(icon: Icons.credit_card_outlined, label: 'PAN Card', value: me['pan_card']?.toString() ?? '-'),
    ];
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Builder(
              builder: (context) {
                // Build full name from first_name and last_name
                final firstName = me['first_name']?.toString() ?? '';
                final lastName = me['last_name']?.toString() ?? '';
                final fullName = lastName.isNotEmpty 
                    ? '$firstName $lastName'.trim() 
                    : firstName.trim();
                return Text(
                  fullName.isNotEmpty ? fullName : '-', 
                  style: Theme.of(context).textTheme.headlineSmall
                );
              },
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: tiles,
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoTile({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 140),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: theme.colorScheme.primary),
                const SizedBox(width: 6),
                Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value.isEmpty ? '-' : value,
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  final Map<String, dynamic> me;
  const _ContactCard({required this.me});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Contact & Access', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const Divider(height: 24),
            _ContactRow(icon: Icons.mail_outline, label: 'Email', value: me['email']),
            _ContactRow(icon: Icons.alternate_email, label: 'Alternate Email', value: me['alt_email']),
            _ContactRow(icon: Icons.call_outlined, label: 'Phone', value: me['phone']),
            _ContactRow(icon: Icons.support_agent, label: 'Alternate Phone', value: me['alt_phone']),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _ContactRow(icon: Icons.description_outlined, label: 'Resume URL', value: me['resume_url'])),
                if ((me['resume_url']?.toString().isNotEmpty ?? false))
                  TextButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Open in browser: ${me['resume_url']}')));
                    },
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Open'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final dynamic value;

  const _ContactRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value?.toString().isNotEmpty == true ? value.toString() : '-',
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final Map<String, dynamic>? permanent;
  final Map<String, dynamic>? present;

  const _AddressCard({required this.permanent, required this.present});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Addresses', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(child: _AddressBlock(title: 'Permanent', data: permanent)),
                const SizedBox(width: 16),
                Expanded(child: _AddressBlock(title: 'Present', data: present)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddressBlock extends StatelessWidget {
  final String title;
  final Map<String, dynamic>? data;

  const _AddressBlock({required this.title, required this.data});

  @override
  Widget build(BuildContext context) {
    final text = _formatAddress(data);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        Text(
          text.isEmpty ? 'Not provided' : text,
          maxLines: 4,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  static String _formatAddress(Map<String, dynamic>? data) {
    if (data == null) return '';
    final parts = [
      data['house'],
      data['street'],
      data['area'],
      data['city'],
      data['state'],
      data['postal_code'] ?? data['postalCode'],
      data['country'],
    ].whereType<String>().where((value) => value.trim().isNotEmpty).toList();
    return parts.join(', ');
  }
}

class _AcademicsCard extends StatelessWidget {
  final Map<String, dynamic> education;
  const _AcademicsCard({required this.education});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final levels = {
      'degree': 'Degree',
      'inter': 'Intermediate',
      'ssc': 'SSC',
    };
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Academic History', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const Divider(height: 24),
            ...levels.entries.map((entry) {
              final data = (education[entry.key] as Map<String, dynamic>?) ?? {};
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.value, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(data['course_name']?.toString() ?? 'Course not specified'),
                    if (data['institute'] != null) Text(data['institute'].toString()),
                    if (data['board'] != null) Text('Board: ${data['board']}'),
                    if (data['marks_obtained'] != null)
                      Text('Marks: ${data['marks_obtained']} / ${data['total_marks'] ?? ''}'),
                    if (data['percentage'] != null) Text('Percentage: ${data['percentage']}%'),
                    if (data['duration_from'] != null || data['duration_to'] != null)
                      Text('Duration: ${data['duration_from'] ?? '?'} → ${data['duration_to'] ?? '?'}'),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}


