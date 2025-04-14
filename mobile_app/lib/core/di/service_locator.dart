// service_locator.dart
import 'package:get_it/get_it.dart';

import '../storage/local_auth_repository.dart';
import '../storage/local_transaction_repository.dart';
import '../supabase/supabase_auth_repository.dart';
import '../supabase/supabase_transaction_repository.dart';
import '../storage/local_auth_service.dart';

final GetIt getIt = GetIt.instance;

void setupServiceLocator() {
  // Register local repositories
  getIt.registerLazySingleton<LocalAuthRepository>(() => LocalAuthRepository());
  getIt.registerLazySingleton<LocalTransactionRepository>(() => LocalTransactionRepository());

  // Register Supabase repositories (stubbed for now)
  getIt.registerLazySingleton<SupabaseAuthRepository>(() => SupabaseAuthRepository());
  getIt.registerLazySingleton<SupabaseTransactionRepository>(() => SupabaseTransactionRepository());

  // Register LocalAuthService for device authentication
  getIt.registerLazySingleton<LocalAuthService>(() => LocalAuthService());
}