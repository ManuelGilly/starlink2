import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_endpoints.dart';

const _storage = FlutterSecureStorage();
const _tokenKey = 'mobile_jwt';

final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: ApiEndpoints.baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));
  dio.interceptors.add(_AuthInterceptor(ref));
  return dio;
});

class _AuthInterceptor extends Interceptor {
  final Ref _ref;
  _AuthInterceptor(this._ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: _tokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      await _storage.delete(key: _tokenKey);
      _ref.read(authStateProvider.notifier).state = null;
    }
    handler.next(err);
  }
}

// Almacenamiento de token
Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
Future<void> deleteToken() => _storage.delete(key: _tokenKey);
Future<String?> readToken() => _storage.read(key: _tokenKey);

// Estado de usuario autenticado
final authStateProvider = StateProvider<AuthUser?>((ref) => null);

class AuthUser {
  final String id;
  final String email;
  final String name;
  final List<String> roles;

  AuthUser({required this.id, required this.email, required this.name, required this.roles});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String,
        roles: List<String>.from(json['roles'] as List),
      );

  bool get isAdmin => roles.contains('ADMIN');
}
