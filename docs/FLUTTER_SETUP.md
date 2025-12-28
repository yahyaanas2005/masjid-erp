# Flutter Frontend - Quick Start Guide

## 🚀 Initialize Flutter Project

### 1. Create Flutter App
```bash
cd frontend
flutter create masjid_erp_app
cd masjid_erp_app
```

### 2. Add Dependencies

Edit `pubspec.yaml`:

```yaml
name: masjid_erp_app
description: Masjid Management ERP Mobile Application
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  provider: ^6.1.1
  
  # HTTP & API
  http: ^1.1.2
  dio: ^5.4.0
  
  # Google Maps
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
  geocoding: ^2.1.1
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9
  
  # Local Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # UI Components
  cupertino_icons: ^1.0.2
  google_fonts: ^6.1.0
  intl: ^0.18.1
  
  # Navigation
  go_router: ^12.1.3
  
  # Image Handling
  cached_network_image: ^3.3.0
  image_picker: ^1.0.5
  
  # QR Code (for check-ins)
  qr_code_scanner: ^1.0.1
  qr_flutter: ^4.1.0
  
  # Animations
  lottie: ^2.7.0
  
  # Utils
  uuid: ^4.2.2
  url_launcher: ^6.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/animations/
    - assets/icons/
```

### 3. Install Dependencies
```bash
flutter pub get
```

---

## 📱 Project Structure

```
lib/
├── main.dart
├── config/
│   ├── api_config.dart
│   ├── theme.dart
│   └── routes.dart
├── models/
│   ├── user.dart
│   ├── masjid.dart
│   ├── prayer_checkin.dart
│   ├── donation.dart
│   └── mosque_need.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── location_service.dart
│   └── notification_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── masjid_provider.dart
│   └── prayer_provider.dart
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   └── otp_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── masjid/
│   │   ├── masjid_discovery_screen.dart
│   │   └── masjid_details_screen.dart
│   ├── prayer/
│   │   ├── prayer_checkin_screen.dart
│   │   └── prayer_history_screen.dart
│   ├── donation/
│   │   └── donation_screen.dart
│   ├── needs/
│   │   └── mosque_needs_screen.dart
│   └── profile/
│       └── profile_screen.dart
└── widgets/
    ├── custom_button.dart
    ├── custom_textfield.dart
    └── prayer_time_card.dart
```

---

## 🎨 Islamic UI Theme

Create `lib/config/theme.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Islamic Color Palette
  static const Color primaryGreen = Color(0xFF00A86B); // Islamic Green
  static const Color darkGreen = Color(0xFF006B3F);
  static const Color gold = Color(0xFFD4AF37);
  static const Color cream = Color(0xFFFFF8DC);
  static const Color darkBg = Color(0xFF1A1A2E);
  static const Color cardBg = Color(0xFF16213E);

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: primaryGreen,
      secondary: gold,
      surface: Colors.white,
      background: cream,
    ),
    textTheme: GoogleFonts.poppinsTextTheme(),
    appBarTheme: AppBarTheme(
      backgroundColor: primaryGreen,
      foregroundColor: Colors.white,
      elevation: 0,
      titleTextStyle: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.dark(
      primary: primaryGreen,
      secondary: gold,
      surface: cardBg,
      background: darkBg,
    ),
    textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
    appBarTheme: AppBarTheme(
      backgroundColor: darkBg,
      foregroundColor: gold,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      color: cardBg,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
  );
}
```

---

## 🔌 API Service Setup

Create `lib/services/api_service.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api/v1';
  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = FlutterSecureStorage();

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = Duration(seconds: 30);
    _dio.options.receiveTimeout = Duration(seconds: 30);

    // Add interceptor for auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, try to refresh
          await _refreshToken();
          return handler.resolve(await _retry(error.requestOptions));
        }
        return handler.next(error);
      },
    ));
  }

  Future<Response> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    return _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  Future<void> _refreshToken() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken != null) {
      try {
        final response = await _dio.post('/auth/refresh', data: {
          'refreshToken': refreshToken,
        });
        await _storage.write(
          key: 'access_token',
          value: response.data['accessToken'],
        );
      } catch (e) {
        // Refresh failed, logout user
        await _storage.deleteAll();
      }
    }
  }

  // Auth endpoints
  Future<Response> sendOTP(String phone, String purpose) async {
    return await _dio.post('/auth/send-otp', data: {
      'phone': phone,
      'purpose': purpose,
    });
  }

  Future<Response> register(Map<String, dynamic> data) async {
    return await _dio.post('/auth/register', data: data);
  }

  Future<Response> login(String phone, String otp) async {
    return await _dio.post('/auth/login', data: {
      'phone': phone,
      'otp': otp,
    });
  }

  // User endpoints
  Future<Response> getCurrentUser() async {
    return await _dio.get('/users/me');
  }

  // Masjid endpoints
  Future<Response> getNearbyMasajid(double lat, double lng, int radius) async {
    return await _dio.get('/masajid/nearby', queryParameters: {
      'latitude': lat,
      'longitude': lng,
      'radius': radius,
    });
  }

  // Prayer endpoints
  Future<Response> prayerCheckIn(Map<String, dynamic> data) async {
    return await _dio.post('/prayers/checkin', data: data);
  }

  // Add more endpoints as needed...
}
```

---

## 📍 Google Maps Setup

### Android Setup (`android/app/src/main/AndroidManifest.xml`):

```xml
<manifest>
    <application>
        <!-- Add Google Maps API Key -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
    </application>
    
    <!-- Add permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET"/>
</manifest>
```

### iOS Setup (`ios/Runner/AppDelegate.swift`):

```swift
import GoogleMaps

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GMSServices.provideAPIKey("YOUR_GOOGLE_MAPS_API_KEY")
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

---

## 🔥 Firebase Setup

1. **Create Firebase Project** at https://console.firebase.google.com
2. **Add Android & iOS apps** to your Firebase project
3. **Download config files:**
   - Android: `google-services.json` → `android/app/`
   - iOS: `GoogleService-Info.plist` → `ios/Runner/`
4. **Initialize Firebase** in `main.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Request notification permissions
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  await messaging.requestPermission();
  
  runApp(MyApp());
}
```

---

## 🎯 Next Steps

1. ✅ **Initialize Flutter project** with dependencies
2. ✅ **Setup Google Maps** API keys
3. ✅ **Configure Firebase** for push notifications
4. 🔄 **Build Authentication Screens** (Login, Register, OTP)
5. 🔄 **Create Masjid Discovery** with Google Maps
6. 🔄 **Implement Prayer Check-in** with geolocation
7. 🔄 **Build Donation Portal** with beautiful UI
8. 🔄 **Create Mosque Needs** marketplace
9. 🔄 **Add Janazah Alerts** system

---

**May Allah ﷻ make this app beneficial for the Muslim Ummah. Ameen.**
