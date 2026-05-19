import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class PaymentModel {
  final String id;
  final String amount;
  final String method;
  final String status;
  final String? reference;
  final String? paidAt;
  final String? createdAt;
  final Map<String, dynamic> client;
  final Map<String, dynamic>? subscription;

  PaymentModel({
    required this.id,
    required this.amount,
    required this.method,
    required this.status,
    this.reference,
    this.paidAt,
    this.createdAt,
    required this.client,
    this.subscription,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> j) => PaymentModel(
        id: j['id'] as String,
        amount: j['amount'].toString(),
        method: j['method'] as String? ?? '',
        status: j['status'] as String? ?? '',
        reference: j['reference'] as String?,
        paidAt: j['paidAt'] as String?,
        createdAt: j['createdAt'] as String?,
        client: Map<String, dynamic>.from(j['client'] as Map? ?? {}),
        subscription: j['subscription'] != null ? Map<String, dynamic>.from(j['subscription'] as Map) : null,
      );

  String get clientName {
    final first = client['firstName'] as String? ?? '';
    final last = client['lastName'] as String? ?? '';
    return '$first $last'.trim();
  }

  String get planName => subscription?['plan']?['name'] as String? ?? '—';
}

final pendingPaymentsProvider = FutureProvider.autoDispose<List<PaymentModel>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.payments, queryParameters: {'status': 'REPORTADO'});
  final all = (res.data as List).map((e) => PaymentModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  // Incluir también PENDIENTE
  final res2 = await dio.get(ApiEndpoints.payments, queryParameters: {'status': 'PENDIENTE'});
  final all2 = (res2.data as List).map((e) => PaymentModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  return [...all, ...all2];
});

final confirmedPaymentsProvider = FutureProvider.autoDispose<List<PaymentModel>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.payments, queryParameters: {'status': 'CONFIRMADO'});
  return (res.data as List).map((e) => PaymentModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
});
