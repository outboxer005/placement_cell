import 'package:flutter/material.dart';
import '../services/api.dart';
import 'drive_detail_page.dart';
import '../services/settings.dart';
import 'drives_page.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});
  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  Future<List<dynamic>>? _future;
  void _updateUnread(List<dynamic> list) {
    try {
      final c = list.where((e) => (e as Map<String, dynamic>)['read'] != true).length;
      // Schedule update for after build completes
      WidgetsBinding.instance.addPostFrameCallback((_) {
        SettingsController.setUnreadCount(c);
      });
    } catch (_) {}
  }
  @override
  void initState() {
    super.initState();
    _future = Api.myNotifications();
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: RefreshIndicator(
        onRefresh: () async { setState(() { _future = Api.myNotifications(); }); await _future; },
        child: FutureBuilder<List<dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
            if (snap.hasError) return Center(child: Text('Error: ${snap.error}'));
            final list = snap.data ?? [];
            _updateUnread(list);
            if (list.isEmpty) return const Center(child: Text('No notifications'));
            return ListView.builder(
              itemCount: list.length,
              itemBuilder: (_, i) {
                final n = list[i] as Map<String, dynamic>;
                final created = DateTime.tryParse(n['created_at']?.toString() ?? '');
                final subtitle = n['message']?.toString() ?? '';
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    leading: Stack(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          child: Icon(
                            n['type'] == 'drive_published' ? Icons.campaign_outlined : Icons.notifications_outlined,
                            size: 28,
                          ),
                        ),
                        if (n['read'] != true)
                          const Positioned(
                            right: 0,
                            top: 0,
                            child: CircleAvatar(radius: 6, backgroundColor: Colors.red),
                          ),
                      ],
                    ),
                    title: Text(
                      n['title'] ?? (n['type'] ?? 'Notification'),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        subtitle,
                        style: const TextStyle(fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    trailing: created != null 
                      ? Text(
                          '${created.hour.toString().padLeft(2,'0')}:${created.minute.toString().padLeft(2,'0')}',
                          style: const TextStyle(fontSize: 12),
                        ) 
                      : null,
                    onTap: () async {
                      final type = n['type']?.toString();
                      final driveId = n['payload']?['\$oid'] ?? n['payload']?['drive_id']?['\$oid'] ?? n['payload']?['drive_id'];
                      if (type == 'drive_published' && driveId != null) {
                        try {
                          final drive = await Api.driveById(driveId.toString());
                          if (!context.mounted) return;
                          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => DriveDetailPage(drive: drive)));
                          setState(() { _future = Api.myNotifications(); });
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to open drive: $e')));
                        }
                      }
                      // mark as read after opening
                      final id = n['id'];
                      if (id != null) {
                        try { await Api.markNotificationRead(id.toString()); } catch (_) {}
                        n['read'] = true;
                        _updateUnread(list);
                      }
                    },
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

