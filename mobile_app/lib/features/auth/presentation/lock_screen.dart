// lock_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/di/providers.dart';

class LockScreen extends ConsumerStatefulWidget {
  const LockScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends ConsumerState<LockScreen> {
  bool _authFailed = false;
  bool _isAuthenticating = false;

  Future<void> _authenticate() async {
    setState(() {
      _isAuthenticating = true;
      _authFailed = false;
    });
    final localAuth = ref.read(localAuthServiceProvider);
    final success = await localAuth.authenticate();
    setState(() {
      _isAuthenticating = false;
      _authFailed = !success;
    });
    if (success) {
      // TODO: Navigate to main app or unlock sensitive data
    }
  }

  @override
  void initState() {
    super.initState();
    _authenticate();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: _isAuthenticating
            ? const CircularProgressIndicator()
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock, size: 64),
                  const SizedBox(height: 24),
                  Text(
                    _authFailed
                        ? 'Authentication failed. Please try again.'
                        : 'Please authenticate to continue.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Authenticate'),
                    onPressed: _isAuthenticating ? null : _authenticate,
                  ),
                ],
              ),
      ),
    );
  }
}