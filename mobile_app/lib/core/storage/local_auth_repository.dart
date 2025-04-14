// local_auth_repository.dart
import '../auth_repository.dart';

class LocalAuthRepository implements AuthRepository {
  @override
  Future<void> login({required String email, required String password}) async {
    // TODO: Implement local login logic using flutter_secure_storage/Isar
    throw UnimplementedError();
  }

  @override
  Future<void> signup({required String email, required String password}) async {
    // TODO: Implement local signup logic
    throw UnimplementedError();
  }

  @override
  Future<void> logout() async {
    // TODO: Implement local logout logic
    throw UnimplementedError();
  }

  @override
  Future<User?> getCurrentUser() async {
    // TODO: Retrieve current user from local storage
    throw UnimplementedError();
  }
}