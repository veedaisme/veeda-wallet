// local_auth_service.dart
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocalAuthService {
  final LocalAuthentication _auth = LocalAuthentication();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  /// Checks if device supports biometrics or device-level authentication.
  Future<bool> isDeviceSupported() async {
    return await _auth.isDeviceSupported();
  }

  /// Checks if any biometrics are enrolled.
  Future<bool> canCheckBiometrics() async {
    return await _auth.canCheckBiometrics;
  }

  /// Returns list of available biometric types.
  Future<List<BiometricType>> getAvailableBiometrics() async {
    return await _auth.getAvailableBiometrics();
  }

  /// Prompts user for authentication (biometric or device credentials).
  Future<bool> authenticate({
    String reason = 'Please authenticate to access your wallet',
    bool useErrorDialogs = true,
    bool stickyAuth = false,
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false,
          useErrorDialogs: true,
          stickyAuth: false,
        ),
      );
    } catch (e) {
      // Handle platform-specific errors
      return false;
    }
  }

  /// Securely store a value (e.g., encryption key, session flag)
  Future<void> writeSecure(String key, String value) async {
    await _secureStorage.write(key: key, value: value);
  }

  /// Securely read a value
  Future<String?> readSecure(String key) async {
    return await _secureStorage.read(key: key);
  }

  /// Securely delete a value
  Future<void> deleteSecure(String key) async {
    await _secureStorage.delete(key: key);
  }
}