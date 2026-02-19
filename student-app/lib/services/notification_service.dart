import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// Service for handling Firebase Cloud Messaging notifications
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  String? _deviceToken;
  Function(Map<String, dynamic>)? onNotificationTap;
  Function(RemoteMessage)? onMessageReceived;

  /// Initialize Firebase Messaging and local notifications
  Future<void> initialize() async {
    // Request permission for notifications
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission for notifications');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('User granted provisional permission');
    } else {
      print('User declined or has not accepted permission');
      return;
    }

    // Initialize local notifications (for foreground)
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        if (response.payload != null) {
          try {
            final payload = jsonDecode(response.payload!);
            onNotificationTap?.call(payload);
          } catch (e) {
            print('Error parsing notification payload: $e');
          }
        }
      },
    );

    // Get the device token
    _deviceToken = await _firebaseMessaging.getToken();
    print('FCM Device Token: $_deviceToken');
    
    // Save token to backend
    if (_deviceToken != null) {
      await _saveTokenToBackend(_deviceToken!);
    }

    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      _deviceToken = newToken;
      _saveTokenToBackend(newToken);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground message: ${message.messageId}');
      _handleForegroundMessage(message);
      onMessageReceived?.call(message);
    });

    // Handle background message taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification opened app from background');
      _handleNotificationTap(message);
    });

    // Check for initial message (if app was opened from terminated state)
    RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      print('App opened from terminated state via notification');
      _handleNotificationTap(initialMessage);
    }
  }

  /// Handle foreground messages by showing a local notification
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    final data = message.data;

    if (notification == null) return;

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'placement_channel',
      'Placement Notifications',
      channelDescription: 'Notifications for placement drives and updates',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      platformDetails,
      payload: jsonEncode(data),
    );
  }

  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    onNotificationTap?.call(data);
  }

  /// Save device token to backend
  Future<void> _saveTokenToBackend(String token) async {
    try {
      final sp = await SharedPreferences.getInstance();
      final authToken = sp.getString('auth_token');
      
      if (authToken == null) {
        print('Not logged in, skipping token save');
        return;
      }

      // Get base URL
      String baseUrl = sp.getString('api_base') ?? 'http://localhost:4000';
      final host = sp.getString('api_host');
      if (host != null && host.trim().isNotEmpty) {
        baseUrl = 'http://${host.trim()}:4000';
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/students/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'token': token,
          'platform': 'android', // TODO: Detect platform
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        print('Device token saved to backend');
      } else {
        print('Failed to save device token: ${response.statusCode}');
      }
    } catch (e) {
      print('Error saving device token: $e');
    }
  }

  /// Get the current device token
  String? get deviceToken => _deviceToken;

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    print('Subscribed to topic: $topic');
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    print('Unsubscribed from topic: $topic');
  }
}
