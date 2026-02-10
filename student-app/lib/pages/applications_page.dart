import 'package:flutter/material.dart';
import '../services/api.dart';

class ApplicationsPage extends StatefulWidget {
  const ApplicationsPage({super.key});
  @override
  State<ApplicationsPage> createState() => _ApplicationsPageState();
}

class _ApplicationsPageState extends State<ApplicationsPage> {
  Future<List<dynamic>>? _future;
  Future<Map<String, dynamic>>? _statsFuture;
  @override
  void initState() {
    super.initState();
    _future = Api.myApplications();
    _statsFuture = Api.myApplicationStats();
  }

  Future<void> _withdraw(String id) async {
    try {
      await Api.withdrawApplication(id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawn')));
      setState(() { _future = Api.myApplications(); _statsFuture = Api.myApplicationStats(); });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Image.asset('unilogo.jpg', fit: BoxFit.contain),
        ),
      ),
      body: Column(
        children: [
          // Stats Cards
          FutureBuilder<Map<String, dynamic>>(
            future: _statsFuture,
            builder: (context, snap) {
              if (!snap.hasData) return const SizedBox.shrink();
              final s = snap.data!;
              return Container(
                padding: const EdgeInsets.all(16.0),
                color: Colors.white,
                child: Row(
                  children: [
                    Expanded(child: _statsCard('Total', (s['total'] ?? 0).toString(), Colors.blue, Icons.apps_outlined)),
                    const SizedBox(width: 12),
                    Expanded(child: _statsCard('Pending', (s['pending'] ?? 0).toString(), Colors.orange, Icons.pending_outlined)),
                    const SizedBox(width: 12),
                    Expanded(child: _statsCard('Accepted', (s['accepted'] ?? 0).toString(), Colors.green, Icons.check_circle_outline)),
                  ],
                ),
              );
            },
          ),
          const Divider(height: 1),
          
          // Applications List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                setState(() { 
                  _future = Api.myApplications(); 
                  _statsFuture = Api.myApplicationStats(); 
                });
                await _future;
                await _statsFuture;
              },
              child: FutureBuilder<List<dynamic>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState != ConnectionState.done) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snap.hasError) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 64, color: Colors.red),
                          const SizedBox(height: 16),
                          Text('Error: ${snap.error}'),
                        ],
                      ),
                    );
                  }
                  final list = snap.data ?? [];
                  if (list.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.assignment_outlined, size: 80, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'No applications yet',
                            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Apply to drives to see them here',
                            style: TextStyle(color: Colors.grey[500]),
                          ),
                        ],
                      ),
                    );
                  }
                  
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final a = list[i] as Map<String, dynamic>;
                      final drive = a['drive'] ?? {};
                      final when = a['applied_at'] ?? '';
                      final idValue = a['id'] ?? a['_id']?['\$oid'] ?? a['_id'];
                      final id = idValue is num 
                        ? idValue.toString() 
                        : (idValue is String ? idValue : idValue?.toString() ?? '');
                      final status = (a['status'] ?? 'pending').toString();
                      
                      return _buildApplicationCard(context, drive, status, when, id);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApplicationCard(BuildContext context, Map drive, String status, String when, String id) {
    Color statusColor;
    IconData statusIcon;
    switch (status.toLowerCase()) {
      case 'accepted':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        break;
      default:
        statusColor = Colors.orange;
        statusIcon = Icons.pending;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Drive Title + Status Badge
            Row(
              children: [
                Expanded(
                  child: Text(
                    drive['title'] ?? 'Drive',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 16, color: statusColor),
                      const SizedBox(width: 6),
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Company Info
            if (drive['company'] != null)
              Row(
                children: [
                  const Icon(Icons.business, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    drive['company'].toString(),
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            
            const SizedBox(height: 8),
            
            // Applied Date
            Row(
              children: [
                const Icon(Icons.access_time, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  'Applied on ${_formatDate(when)}',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ],
            ),
            
            // Withdraw Button (only for pending)
            if (status.toLowerCase() == 'pending') ...[
              const SizedBox(height: 16),
              Center(
                child: SizedBox(
                  width: double.infinity,
                  child: FractionallySizedBox(
                    widthFactor: 0.6,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Withdraw Application?'),
                            content: const Text('Are you sure you want to withdraw this application?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx, false),
                                child: const Text('Cancel'),
                              ),
                              ElevatedButton(
                                onPressed: () => Navigator.pop(ctx, true),
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                child: const Text('Withdraw'),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) _withdraw(id);
                      },
                      icon: const Icon(Icons.undo, size: 18),
                      label: const Text('Withdraw'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

   String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  Widget _statsCard(String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color.withOpacity(0.8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color)),
        ],
      ),
    );
  }
}


