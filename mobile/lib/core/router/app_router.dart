import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/two_factor_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/clients/client_list_screen.dart';
import '../../features/clients/client_detail_screen.dart';
import '../../features/clients/client_form_screen.dart';
import '../../features/payments/payments_screen.dart';
import '../../features/cobros/cobros_screen.dart';
import '../../features/plan_requests/plan_requests_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoading = auth.isLoading;
      if (isLoading) return null;

      final isLoggedIn = auth.valueOrNull != null;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/2fa';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && state.matchedLocation == '/login') return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/2fa',
        builder: (_, state) => TwoFactorScreen(challengeToken: state.extra as String),
      ),
      ShellRoute(
        builder: (context, state, child) => _AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
          GoRoute(
            path: '/clients',
            builder: (_, __) => const ClientListScreen(),
            routes: [
              GoRoute(path: 'new', builder: (_, __) => const ClientFormScreen()),
              GoRoute(
                path: ':id',
                builder: (_, state) => ClientDetailScreen(clientId: state.pathParameters['id']!),
                routes: [
                  GoRoute(
                    path: 'edit',
                    builder: (_, state) => ClientFormScreen(clientId: state.pathParameters['id']),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(path: '/payments', builder: (_, __) => const PaymentsScreen()),
          GoRoute(path: '/cobros', builder: (_, __) => const CobrosScreen()),
          GoRoute(path: '/requests', builder: (_, __) => const PlanRequestsScreen()),
        ],
      ),
    ],
  );
});

class _AppShell extends StatelessWidget {
  final Widget child;
  const _AppShell({required this.child});

  int _selectedIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/clients')) return 1;
    if (loc.startsWith('/payments')) return 2;
    if (loc.startsWith('/cobros')) return 3;
    if (loc.startsWith('/requests')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _selectedIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (i) {
          switch (i) {
            case 0: context.go('/'); break;
            case 1: context.go('/clients'); break;
            case 2: context.go('/payments'); break;
            case 3: context.go('/cobros'); break;
            case 4: context.go('/requests'); break;
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Clientes'),
          NavigationDestination(icon: Icon(Icons.payments_outlined), selectedIcon: Icon(Icons.payments), label: 'Pagos'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Cobros'),
          NavigationDestination(icon: Icon(Icons.inbox_outlined), selectedIcon: Icon(Icons.inbox), label: 'Solicitudes'),
        ],
      ),
    );
  }
}
