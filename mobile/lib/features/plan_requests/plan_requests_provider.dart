import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class PlanRequestModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String antennaId;
  final String planName;
  final double amount;
  final String paymentMethod;
  final String? paymentReference;
  final String? receiptUrl;
  final String status;
  final String createdAt;

  PlanRequestModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.antennaId,
    required this.planName,
    required this.amount,
    required this.paymentMethod,
    this.paymentReference,
    this.receiptUrl,
    required this.status,
    required this.createdAt,
  });

  factory PlanRequestModel.fromJson(Map<String, dynamic> j) => PlanRequestModel(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        email: j['email'] as String,
        phone: j['phone'] as String,
        antennaId: j['antennaId'] as String,
        planName: (j['plan'] as Map?)?['name'] as String? ?? '—',
        amount: (j['amount'] as num? ?? 0).toDouble(),
        paymentMethod: j['paymentMethod'] as String? ?? '',
        paymentReference: j['paymentReference'] as String?,
        receiptUrl: j['receiptUrl'] as String?,
        status: j['status'] as String? ?? '',
        createdAt: j['createdAt'] as String? ?? '',
      );

  String get fullName => '$firstName $lastName';
}

final planRequestsProvider = FutureProvider.autoDispose<List<PlanRequestModel>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.planRequests);
  return (res.data as List)
      .map((e) => PlanRequestModel.fromJson(Map<String, dynamic>.from(e as Map)))
      .where((r) => r.status == 'PENDIENTE')
      .toList();
});
