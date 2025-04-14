// supabase_auth_repository.dart
import '../auth_repository.dart';

class SupabaseAuthRepository implements AuthRepository {
  @override
  Future<void> login({required String email, required String password}) async {
    // TODO: Implement Supabase login logic
    throw UnimplementedError();
  }

  @override
  Future<void> signup({required String email, required String password}) async {
    // TODO: Implement Supabase signup logic
    throw UnimplementedError();
  }

  @override
  Future<void> logout() async {
    // TODO: Implement Supabase logout logic
    throw UnimplementedError();
  }

  @override
  Future<User?> getCurrentUser() async {
    // TODO: Retrieve current user from Supabase
    throw UnimplementedError();
  }
}