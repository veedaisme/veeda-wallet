import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';

import 'features/dashboard/dashboard_screen.dart';
import 'features/transactions/transactions_screen.dart';
import 'features/profile/profile_screen.dart';

class ClairApp extends StatelessWidget {
  const ClairApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Clair',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/dashboard',
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainAppShell(child: child),
      routes: [
        GoRoute(
          path: '/dashboard',
          name: 'dashboard',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: DashboardScreen(),
          ),
        ),
        GoRoute(
          path: '/transactions',
          name: 'transactions',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: TransactionsScreen(),
          ),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          pageBuilder: (context, state) => const NoTransitionPage(
            child: ProfileScreen(),
          ),
        ),
      ],
    ),
  ],
);

class MainAppShell extends StatefulWidget {
  final Widget child;
  const MainAppShell({super.key, required this.child});

  @override
  State<MainAppShell> createState() => _MainAppShellState();
}

class _MainAppShellState extends State<MainAppShell> {
  int _currentIndex = 0;

  static const _tabs = [
    '/dashboard',
    '/transactions',
  ];

  void _onTabTapped(int index) {
    if (_currentIndex != index) {
      context.go(_tabs[index]);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Update the current index based on the current location
    final String? location = GoRouter.of(context).routeInformationProvider.value.location;
    int tabIndex = -1; // Default to no tab selected

    if (location != null) {
      tabIndex = _tabs.indexWhere((tab) => location.startsWith(tab));
    }
    
    if (tabIndex != -1) {
      _currentIndex = tabIndex;
    } // If on a non-tab route like /profile, _currentIndex retains its last value, so a tab might still appear selected.
      // This is an okay intermediate state. A more advanced solution might involve passing a different currentIndex or styling.

    return Scaffold(
      appBar: AppBar(
        title: Image.asset(
          'assets/icon/clair_logo.png',
          height: 160,
          fit: BoxFit.contain,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle_outlined),
            tooltip: 'Profile',
            onPressed: () {
              context.go('/profile');
            },
          ),
        ],
      ),
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt_outlined),
            activeIcon: Icon(Icons.list_alt),
            label: 'Transactions',
          ),
        ],
      ),
    );
  }
}