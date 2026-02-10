import 'package:flutter/material.dart';
import '../services/api.dart';

/// Provider for managing placement drives and search
class DriveProvider with ChangeNotifier {
  List<Map<String, dynamic>> _allDrives = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;

  /// Get filtered drives based on search query
  List<Map<String, dynamic>> get drives {
    if (_searchQuery.isEmpty) {
      return _allDrives;
    }

    final query = _searchQuery.toLowerCase();
    return _allDrives.where((drive) {
      final companyName = (drive['companyName'] ?? '').toString().toLowerCase();
      final role = (drive['role'] ?? '').toString().toLowerCase();
      return companyName.contains(query) || role.contains(query);
    }).toList();
  }

  /// Load drives from API
  Future<void> loadDrives() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await Api.getDrives();
      if (response != null && response['drives'] != null) {
        _allDrives = List<Map<String, dynamic>>.from(response['drives']);
      } else {
        _allDrives = [];
      }
    } catch (e) {
      _error = 'Error loading drives: $e';
      _allDrives = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Update search query and filter drives in real-time
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  /// Clear search and show all drives
  void clearSearch() {
    _searchQuery = '';
    notifyListeners();
  }

  /// Clear all data (for logout)
  void clear() {
    _allDrives = [];
    _searchQuery = '';
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
