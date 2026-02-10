import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class Api {
  // Default base from build-time define; overridden at runtime by saved host IP (api_host)
  static String defaultBase = const String.fromEnvironment('API_BASE', defaultValue: 'http://localhost:4000');

  static Future<String?> get token async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('auth_token');
  }

  static Future<void> setToken(String t) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString('auth_token', t);
  }

  static Future<void> clear() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove('auth_token');
  }

  // Runtime-configurable host (IP only). Stored as 'api_host' (e.g., 10.16.13.228)
  static Future<String?> getHost() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('api_host');
  }

  static Future<void> setHost(String? host) async {
    final sp = await SharedPreferences.getInstance();
    if (host == null || host.trim().isEmpty) {
      await sp.remove('api_host');
    } else {
      await sp.setString('api_host', host.trim());
    }
  }

  // Also allow saving a full base URL (e.g., http://10.0.0.5:4000 or https://api.example.com)
  static Future<String?> getBaseUrl() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString('api_base');
  }

  static Future<void> setBaseUrl(String? baseUrl) async {
    final sp = await SharedPreferences.getInstance();
    if (baseUrl == null || baseUrl.trim().isEmpty) {
      await sp.remove('api_base');
    } else {
      String v = baseUrl.trim();
      if (v.endsWith('/')) v = v.substring(0, v.length - 1);
      await sp.setString('api_base', v);
    }
  }

  static Future<String> currentBase() async {
    final sp = await SharedPreferences.getInstance();
    final configured = sp.getString('api_base');
    if (configured != null && configured.trim().isNotEmpty) return configured;
    final host = sp.getString('api_host');
    if (host != null && host.trim().isNotEmpty) {
      return 'http://${host.trim()}:4000';
    }
    return defaultBase;
  }

  static Future<http.Response> _req(String method, String path, {Map<String, String>? headers, Object? body}) async {
    final t = await token;
    final h = <String, String>{
      'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
      ...?headers,
    };
    final base = await currentBase();
    final uri = Uri.parse('$base$path');
    // Increased timeout from 8s to 15s for better reliability on slow connections
    const timeout = Duration(seconds: 15);
    try {
    switch (method) {
      case 'GET':
        return await http.get(uri, headers: h).timeout(timeout);
      case 'POST':
        return await http.post(uri, headers: h, body: body).timeout(timeout);
      case 'PUT':
        return await http.put(uri, headers: h, body: body).timeout(timeout);
      case 'DELETE':
        return await http.delete(uri, headers: h).timeout(timeout);
      default:
        throw UnimplementedError('Method $method');
    }
    } catch (e) {
      // Enhanced offline support: return cached data for GET requests
      if (method == 'GET') {
        final sp = await SharedPreferences.getInstance();
        String? cacheKey;
        
        // Determine cache key based on endpoint
        if (path.startsWith('/api/drives')) {
          cacheKey = 'cache_drives';
        } else if (path.startsWith('/api/applications')) {
          cacheKey = 'cache_applications';
        } else if (path.startsWith('/api/notifications')) {
          cacheKey = 'cache_notifications';
        } else if (path.startsWith('/api/students/me')) {
          cacheKey = 'cache_profile';
        }
        
        if (cacheKey != null) {
          final cached = sp.getString(cacheKey);
          if (cached != null) {
            // Return synthetic 200 response with cached data
            return http.Response(cached, 200, headers: {'content-type': 'application/json', 'x-from-cache': 'true'});
          }
        }
      }
      rethrow;
    }
  }

  // Auth
  static Future<Map<String, dynamic>> studentLogin(String regdId, String password) async {
    final res = await _req('POST', '/api/auth/student/login', body: jsonEncode({'regdId': regdId, 'password': password}));
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 && data['token'] != null) {
      await setToken(data['token']);
      final sp = await SharedPreferences.getInstance();
      await sp.setString('last_regd_id', regdId);
      await sp.setString('last_password', password);
      return data;
    }
    throw Exception(data['error'] ?? 'Login failed');
  }

  static Future<Map<String, dynamic>> registerStudent({
    required String regdId,
    required String firstName,
    String? lastName,
    required String email,
    required String phone,
    required String branch,
    required String dob,
    String? passwordForCache,
    String? fatherName,
    String? altEmail,
    String? altPhone,
    double? cgpa,
    String? year,
    String? section,
    String? currentYear,
    String? gender,
    String? nationality,
    String? college,
    String? resumeUrl,
    bool? breakInStudies,
    bool? hasBacklogs,
    String? aadharNumber,
    String? panCard,
    Map<String, dynamic>? permanentAddress,
    Map<String, dynamic>? presentAddress,
    Map<String, dynamic>? degree,
    Map<String, dynamic>? inter,
    Map<String, dynamic>? ssc,
  }) async {
    final body = {
      'regdId': regdId,
      'first_name': firstName.trim(),
      if (lastName != null && lastName.trim().isNotEmpty) 'last_name': lastName.trim(),
      'email': email.trim(),
      'phone': phone.trim(),
      'branch': branch.trim(),
      'dob': dob,
      if (fatherName != null && fatherName.trim().isNotEmpty) 'fatherName': fatherName.trim(),
      if (altEmail != null && altEmail.trim().isNotEmpty) 'altEmail': altEmail.trim(),
      if (altPhone != null && altPhone.trim().isNotEmpty) 'altPhone': altPhone.trim(),
      if (cgpa != null) 'cgpa': cgpa,
      if (year != null && year.trim().isNotEmpty) 'year': year.trim(),
      if (section != null && section.trim().isNotEmpty) 'section': section.trim(),
      if (currentYear != null && currentYear.trim().isNotEmpty) 'current_year': currentYear.trim(),
      if (gender != null && gender.trim().isNotEmpty) 'gender': gender.trim(),
      if (nationality != null && nationality.trim().isNotEmpty) 'nationality': nationality.trim(),
      if (college != null && college.trim().isNotEmpty) 'college': college.trim(),
      if (resumeUrl != null && resumeUrl.trim().isNotEmpty) 'resume_url': resumeUrl.trim(),
      if (breakInStudies != null) 'breakInStudies': breakInStudies,
      if (hasBacklogs != null) 'hasBacklogs': hasBacklogs,
      if (aadharNumber != null && aadharNumber.trim().isNotEmpty) 'aadhar_number': aadharNumber.trim(),
      if (panCard != null && panCard.trim().isNotEmpty) 'pan_card': panCard.trim().toUpperCase(),
      if (permanentAddress != null && permanentAddress.isNotEmpty) 'permanentAddress': permanentAddress,
      if (presentAddress != null && presentAddress.isNotEmpty) 'presentAddress': presentAddress,
      if (degree != null && degree.isNotEmpty) 'degree': degree,
      if (inter != null && inter.isNotEmpty) 'inter': inter,
      if (ssc != null && ssc.isNotEmpty) 'ssc': ssc,
    };
    final res = await _req('POST', '/api/auth/student/register', body: jsonEncode(body));
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 && data['token'] != null) {
      await setToken(data['token']);
      final sp = await SharedPreferences.getInstance();
      await sp.setString('last_regd_id', regdId);
      if (passwordForCache != null && passwordForCache.isNotEmpty) {
        await sp.setString('last_password', passwordForCache);
      }
      return data as Map<String, dynamic>;
    }
    throw Exception(data['error'] ?? 'Registration failed');
  }

  static Future<Map<String, dynamic>?> me() async {
    try {
    final res = await _req('GET', '/api/auth/me');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['ok'] == true ? data : null;
      }
      return null;
    } catch (e) {
    return null;
    }
  }

  // Drives
  static Future<List<dynamic>> drives({String status = 'published'}) async {
    final res = await _req('GET', '/api/drives?status=$status');
    if (res.statusCode == 200) {
      // cache for offline
      final sp = await SharedPreferences.getInstance();
      await sp.setString('cache_drives', res.body);
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to load drives (HTTP ${res.statusCode})');
  }

  // Students
  static Future<Map<String, dynamic>> myProfile() async {
    final res = await _req('GET', '/api/students/me');
    if (res.statusCode == 200) {
      // Cache profile data for offline access
      final sp = await SharedPreferences.getInstance();
      await sp.setString('cache_profile', res.body);
      return jsonDecode(res.body);
    }
    throw Exception('Failed to load profile');
  }

  // Applications
  static Future<List<dynamic>> myApplications() async {
    final res = await _req('GET', '/api/applications?expand=1');
    if (res.statusCode == 200) {
      // Cache applications for offline access
      final sp = await SharedPreferences.getInstance();
      await sp.setString('cache_applications', res.body);
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to load applications');
  }

  static Future<Map<String, dynamic>> applyToDrive(String driveId) async {
    final res = await _req('POST', '/api/applications', body: jsonEncode({'drive_id': driveId}));
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) return data;
    throw Exception(data['error'] ?? 'Apply failed');
  }

  static Future<void> withdrawApplication(String id) async {
    final res = await _req('DELETE', '/api/applications/$id');
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'Withdraw failed');
    }
  }

  static Future<Map<String, dynamic>> myApplicationStats() async {
    final res = await _req('GET', '/api/applications/me/stats');
    if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    throw Exception('Failed to load stats');
  }

  // Notifications
  static Future<List<dynamic>> myNotifications() async {
    final res = await _req('GET', '/api/notifications?me=1');
    if (res.statusCode == 200) {
      // Cache notifications for offline access
      final sp = await SharedPreferences.getInstance();
      await sp.setString('cache_notifications', res.body);
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw Exception('Failed to load notifications (HTTP ${res.statusCode})');
  }

  static Future<void> markNotificationRead(String id) async {
    final res = await _req('POST', '/api/notifications/$id/read');
    if (res.statusCode != 200) {
      try {
        final data = jsonDecode(res.body);
        throw Exception(data['error'] ?? 'Failed to mark as read');
      } catch (_) {
        throw Exception('Failed to mark as read');
      }
    }
  }

  // Drives by id
  static Future<Map<String, dynamic>> driveById(String id) async {
    final res = await _req('GET', '/api/drives/$id');
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) return data as Map<String, dynamic>;
    throw Exception(data['error'] ?? 'Failed to load drive');
  }

  // Update my profile (student)
  static Future<Map<String, dynamic>> updateMyProfile(Map<String, dynamic> fields) async {
    final res = await _req('PUT', '/api/students/me', body: jsonEncode(fields));
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) return data as Map<String, dynamic>;
    throw Exception(data['error'] ?? 'Update failed');
  }
}

