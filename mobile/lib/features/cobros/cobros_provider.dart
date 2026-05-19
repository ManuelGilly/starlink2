import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class CobroRow {
  final String subscriptionId;
  final String clientId;
  final String clientName;
  final String planName;
  final double planCost;
  final double priceLocked;
  final CobroPago? pago;

  CobroRow({
    required this.subscriptionId,
    required this.clientId,
    required this.clientName,
    required this.planName,
    required this.planCost,
    required this.priceLocked,
    this.pago,
  });

  factory CobroRow.fromJson(Map<String, dynamic> j) => CobroRow(
        subscriptionId: j['subscriptionId'] as String,
        clientId: j['clientId'] as String,
        clientName: j['clientName'] as String,
        planName: j['planName'] as String,
        planCost: (j['planCost'] as num? ?? 0).toDouble(),
        priceLocked: (j['priceLocked'] as num? ?? 0).toDouble(),
        pago: j['pago'] != null ? CobroPago.fromJson(Map<String, dynamic>.from(j['pago'] as Map)) : null,
      );
}

class CobroPago {
  final String id;
  final double amount;
  final double? starlinkCost;
  final String method;
  final String? reference;

  CobroPago({required this.id, required this.amount, this.starlinkCost, required this.method, this.reference});

  factory CobroPago.fromJson(Map<String, dynamic> j) => CobroPago(
        id: j['id'] as String,
        amount: (j['amount'] as num? ?? 0).toDouble(),
        starlinkCost: j['starlinkCost'] != null ? (j['starlinkCost'] as num).toDouble() : null,
        method: j['method'] as String? ?? '',
        reference: j['reference'] as String?,
      );

  double get ganancia => amount - (starlinkCost ?? 0);
}

class CobrosData {
  final List<CobroRow> rows;
  final int year;
  final int month;
  final String periodoInicio;
  final String periodoFin;

  CobrosData({required this.rows, required this.year, required this.month, required this.periodoInicio, required this.periodoFin});

  double get totalCobrado => rows.fold(0, (s, r) => s + (r.pago?.amount ?? 0));
  double get totalStarlink => rows.fold(0, (s, r) => s + (r.pago?.starlinkCost ?? 0));
  double get totalGanancia => totalCobrado - totalStarlink;
  int get sinPago => rows.where((r) => r.pago == null).length;
}

final cobrosMonthProvider = StateProvider<String>((ref) {
  final now = DateTime.now();
  return '${now.year}-${now.month.toString().padLeft(2, '0')}';
});

final cobrosProvider = FutureProvider.autoDispose<CobrosData>((ref) async {
  final mes = ref.watch(cobrosMonthProvider);
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.cobros, queryParameters: {'mes': mes});
  final data = Map<String, dynamic>.from(res.data as Map);
  return CobrosData(
    rows: (data['rows'] as List).map((e) => CobroRow.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
    year: data['year'] as int,
    month: data['month'] as int,
    periodoInicio: data['periodoInicio'] as String,
    periodoFin: data['periodoFin'] as String,
  );
});
