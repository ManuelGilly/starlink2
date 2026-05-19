import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class DashboardData {
  final Map<String, dynamic> kpis;
  final List<dynamic> alerts;

  DashboardData({required this.kpis, required this.alerts});

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
        kpis: Map<String, dynamic>.from(json['kpis'] as Map? ?? {}),
        alerts: json['alerts'] is Map ? [] : [],
      );

  double get billingMonth => (kpis['billingMonth'] as num? ?? 0).toDouble();
  double get grossProfitMonth => (kpis['grossProfitMonth'] as num? ?? 0).toDouble();
  double get mrr => (kpis['mrr'] as num? ?? 0).toDouble();
  int get activeClients => (kpis['activeClients'] as num? ?? 0).toInt();
  int get activeSubscriptions => (kpis['activeSubscriptions'] as num? ?? 0).toInt();
  int get pendingPaymentsCount => (kpis['pendingPaymentsCount'] as num? ?? 0).toInt();
  int get reportedPaymentsCount => (kpis['reportedPaymentsCount'] as num? ?? 0).toInt();
  int get lowStockCount => (kpis['lowStockCount'] as num? ?? 0).toInt();
  double get billingLast30 => (kpis['billingLast30'] as num? ?? 0).toDouble();
  double get billingPrev30 => (kpis['billingPrev30'] as num? ?? 0).toDouble();

  double get delta30 {
    if (billingPrev30 == 0) return 0;
    return ((billingLast30 - billingPrev30) / billingPrev30) * 100;
  }
}

final dashboardProvider = FutureProvider.autoDispose<DashboardData>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get(ApiEndpoints.dashboard);
  return DashboardData.fromJson(Map<String, dynamic>.from(res.data as Map));
});
