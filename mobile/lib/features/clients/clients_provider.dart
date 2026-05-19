import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class ClientModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String? address;
  final String? notes;
  final List<dynamic> subscriptions;

  ClientModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    this.address,
    this.notes,
    required this.subscriptions,
  });

  factory ClientModel.fromJson(Map<String, dynamic> j) => ClientModel(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        email: j['email'] as String,
        phone: j['phone'] as String,
        address: j['address'] as String?,
        notes: j['notes'] as String?,
        subscriptions: List.from(j['subscriptions'] as List? ?? []),
      );

  String get fullName => '$firstName $lastName';

  String get activePlan {
    final active = subscriptions.where((s) => s['status'] == 'ACTIVA').toList();
    if (active.isEmpty) return 'Sin plan activo';
    return active.map((s) => s['plan']?['name'] ?? '').join(', ');
  }
}

final clientsProvider = FutureProvider.autoDispose<List<ClientModel>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.clients);
  return (res.data as List).map((e) => ClientModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
});

final clientDetailProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.clientById(id));
  return Map<String, dynamic>.from(res.data as Map);
});

final plansListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.plans);
  return (res.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
});
