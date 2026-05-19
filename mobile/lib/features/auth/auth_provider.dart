import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class AuthNotifier extends AsyncNotifier<AuthUser?> {
  @override
  Future<AuthUser?> build() async {
    final token = await readToken();
    if (token == null) return null;
    // Token existe — restaurar usuario desde token (sin llamada a servidor)
    ref.read(authStateProvider.notifier).state = AuthUser(
      id: '', email: '', name: 'Admin', roles: ['ADMIN'],
    );
    return ref.read(authStateProvider);
  }

  Future<Map<String, dynamic>> loginStep1(String email, String password) async {
    final dio = ref.read(apiClientProvider);
    final res = await dio.post(ApiEndpoints.authStep1, data: {
      'email': email,
      'password': password,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> loginStep2(String challengeToken, String code) async {
    final dio = ref.read(apiClientProvider);
    final res = await dio.post(ApiEndpoints.authStep2, data: {
      'challengeToken': challengeToken,
      'code': code,
    });
    final data = Map<String, dynamic>.from(res.data as Map);
    final token = data['token'] as String;
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    await saveToken(token);
    ref.read(authStateProvider.notifier).state = user;
    state = AsyncValue.data(user);
  }

  Future<void> loginDirect(String challengeToken) async {
    // Para rol INVENTARIO (sin 2FA)
    final dio = ref.read(apiClientProvider);
    final res = await dio.post(ApiEndpoints.authStep2, data: {
      'challengeToken': challengeToken,
    });
    final data = Map<String, dynamic>.from(res.data as Map);
    final token = data['token'] as String;
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    await saveToken(token);
    ref.read(authStateProvider.notifier).state = user;
    state = AsyncValue.data(user);
  }

  Future<void> logout() async {
    await deleteToken();
    ref.read(authStateProvider.notifier).state = null;
    state = const AsyncValue.data(null);
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthUser?>(AuthNotifier.new);
