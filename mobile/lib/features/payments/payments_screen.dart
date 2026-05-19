import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'payments_provider.dart';
import '../../core/api/api_client.dart';
import '../../shared/widgets/status_badge.dart';
import '../../shared/widgets/empty_state.dart';

class PaymentsScreen extends ConsumerWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Pagos'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Por revisar'),
            Tab(text: 'Confirmados'),
          ]),
        ),
        body: TabBarView(
          children: [
            _PaymentList(
              provider: pendingPaymentsProvider,
              onRefresh: () => ref.invalidate(pendingPaymentsProvider),
              showActions: true,
            ),
            _PaymentList(
              provider: confirmedPaymentsProvider,
              onRefresh: () => ref.invalidate(confirmedPaymentsProvider),
              showActions: false,
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentList extends ConsumerWidget {
  final ProviderBase<AsyncValue<List<PaymentModel>>> provider;
  final VoidCallback onRefresh;
  final bool showActions;

  const _PaymentList({required this.provider, required this.onRefresh, required this.showActions});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(provider);

    return data.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: TextButton.icon(
        icon: const Icon(Icons.refresh),
        label: const Text('Reintentar'),
        onPressed: onRefresh,
      )),
      data: (payments) {
        if (payments.isEmpty) {
          return EmptyState(
            icon: showActions ? Icons.check_circle_outline : Icons.receipt_long_outlined,
            message: showActions ? 'Sin pagos por revisar' : 'Sin pagos confirmados',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => onRefresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: payments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final p = payments[i];
              return _PaymentCard(payment: p, showActions: showActions, onAction: onRefresh);
            },
          ),
        );
      },
    );
  }
}

class _PaymentCard extends ConsumerWidget {
  final PaymentModel payment;
  final bool showActions;
  final VoidCallback onAction;

  const _PaymentCard({required this.payment, required this.showActions, required this.onAction});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: InkWell(
        onTap: () => context.push('/payments/${payment.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '\$${double.parse(payment.amount).toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  StatusBadge(payment.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(payment.clientName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              Text('${payment.planName} · ${payment.method}',
                  style: const TextStyle(fontSize: 12, color: Colors.white54)),
              if (payment.reference != null)
                Text('Ref: ${payment.reference}', style: const TextStyle(fontSize: 11, color: Colors.white38)),
              if (showActions) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _updateStatus(context, ref, 'CONFIRMADO'),
                        icon: const Icon(Icons.check, size: 16, color: Color(0xFF4ADE80)),
                        label: const Text('Confirmar', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFF4ADE80), width: 0.8),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _updateStatus(context, ref, 'RECHAZADO'),
                        icon: const Icon(Icons.close, size: 16, color: Color(0xFFF87171)),
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
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _updateStatus(BuildContext context, WidgetRef ref, String status) async {
    try {
      final dio = ref.read(apiClientProvider);
      await dio.patch('/api/pagos/${payment.id}', data: {'status': status});
      onAction();
    } catch (_) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al $status pago')));
    }
  }
}
