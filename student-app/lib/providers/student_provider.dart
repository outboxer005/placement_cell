import 'package:flutter/material.dart';
import '../services/api.dart';

/// Provider for managing student profile state across the app
class StudentProvider with ChangeNotifier {
  Map<String, dynamic>? _student;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get student => _student;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  String get firstName => _student?['firstName'] ?? 'Student';
  String get fullName => '${_student?['firstName'] ?? ''} ${_student?['lastName'] ?? ''}'.trim();

  /// Load student profile from API
  Future<void> loadProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await Api.me();
      if (response?['ok'] == true && response?['student'] != null) {
        _student = response['student'];
      } else {
        _error = 'Failed to load profile';
      }
    } catch (e) {
      _error = 'Error loading profile: $e';
      _student = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Update student profile with new data
  void updateProfile(Map<String, dynamic> data) {
    if (_student != null) {
      _student = {..._student!, ...data};
      notifyListeners();
    }
  }

  /// Clear student data (for logout)
  void clear() {
    _student = null;
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
