// auth_repository.dart
abstract class AuthRepository {
  Future<void> login({required String email, required String password});
  Future<void> signup({required String email, required String password});
  Future<void> logout();
  Future<User?> getCurrentUser();
}

class User {
  final String id;
  final String email;
  final String? name;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    this.name,
    required this.createdAt,
    required this.updatedAt,
  });
}