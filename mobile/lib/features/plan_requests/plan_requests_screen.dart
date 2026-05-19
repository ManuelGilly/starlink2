import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'plan_requests_provider.dart';
import '../../shared/widgets/empty_state.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class PlanRequestsScreen extends ConsumerWidget {
  const PlanRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(planRequestsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Solicitudes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, size: 20),
            onPressed: () => ref.invalidate(planRequestsProvider),
          ),
        ],
      ),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: TextButton.icon(
          icon: const Icon(Icons.refresh),
          label: const Text('Reintentar'),
          onPressed: () => ref.invalidate(planRequestsProvider),
        )),
        data: (requests) {
          if (requests.isEmpty) {
            return const EmptyState(
              icon: Icons.inbox_outlined,
              message: 'Sin solicitudes pendientes',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(planRequestsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: requests.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _RequestCard(
                request: requests[i],
                onAction: () => ref.invalidate(planRequestsProvider),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RequestCard extends ConsumerWidget {
  final PlanRequestModel request;
  final VoidCallback onAction;

  const _RequestCard({required this.request, required this.onAction});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(request.fullName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                Text('\$${request.amount.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF4ADE80))),
              ],
            ),
            const SizedBox(height: 6),
            _infoRow(Icons.wifi_outlined, request.planName),
            _infoRow(Icons.router_outlined, 'Antena: ${request.antennaId}'),
            _infoRow(Icons.email_outlined, request.email),
            _infoRow(Icons.phone_outlined, request.phone),
            _infoRow(Icons.payment_outlined, '${request.paymentMethod}${request.paymentReference != null ? " · ${request.paymentReference}" : ""}'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _update(context, ref, 'PROCESADA'),
                    icon: const Icon(Icons.check_circle_outline, size: 16, color: Color(0xFF4ADE80)),
                    label: const Text('Procesar', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF4ADE80), width: 0.8),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _update(context, ref, 'RECHAZADA'),
                    icon: const Icon(Icons.cancel_outlined, size: 16, color: Color(0xFFF87171)),
                    label: const Text('Rechazar', style: TextStyle(color: Color(0xFFF87171), fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFF87171), width: 0.8),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          children: [
            Icon(icon, size: 13, color: Colors.white38),
            const SizedBox(width: 6),
            Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: Colors.white70))),
          ],
        ),
      );

  Future<void> _update(BuildContext context, WidgetRef ref, String status) async {
    try {
      final dio = ref.read(apiClientProvider);
      await dio.patch(ApiEndpoints.planRequestById(request.id), data: {'status': status});
      onAction();
    } catch (_) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al actualizar')));
    }
  }
}
