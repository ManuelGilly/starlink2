import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dashboard_provider.dart';
import '../../shared/widgets/kpi_card.dart';
import '../../core/api/api_client.dart';

String _usd(double v) => '\$${v.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+\.)'), (m) => '${m[1]},')}';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(dashboardProvider);
    final user = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Dashboard'),
            if (user != null)
              Text(user.name, style: const TextStyle(fontSize: 12, color: Colors.white38, fontWeight: FontWeight.w400)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, size: 20),
            onPressed: () => ref.invalidate(dashboardProvider),
          ),
        ],
      ),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off_outlined, size: 40, color: Colors.white24),
            const SizedBox(height: 12),
            const Text('Sin conexión', style: TextStyle(color: Colors.white54)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: () => ref.invalidate(dashboardProvider), child: const Text('Reintentar')),
          ]),
        ),
        data: (d) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(dashboardProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Alertas rápidas
              if (d.reportedPaymentsCount > 0 || d.lowStockCount > 0) ...[
                _AlertsRow(d: d),
                const SizedBox(height: 16),
              ],
              // KPIs financieros
              _SectionLabel('Financiero'),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.5,
                children: [
                  KpiCard(label: 'Facturación mes', value: _usd(d.billingMonth), icon: Icons.payments_outlined),
                  KpiCard(label: 'Ganancia bruta', value: _usd(d.grossProfitMonth), icon: Icons.trending_up_outlined,
                      valueColor: d.grossProfitMonth >= 0 ? const Color(0xFF4ADE80) : const Color(0xFFF87171)),
                  KpiCard(label: 'MRR', value: _usd(d.mrr), icon: Icons.autorenew_outlined),
                  KpiCard(
                    label: 'Ingresos 30d',
                    value: _usd(d.billingLast30),
                    icon: Icons.bar_chart_outlined,
                    valueColor: d.delta30 >= 0 ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _SectionLabel('Operativo'),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.5,
                children: [
                  KpiCard(label: 'Clientes activos', value: '${d.activeClients}', icon: Icons.people_outline),
                  KpiCard(label: 'Suscripciones', value: '${d.activeSubscriptions}', icon: Icons.wifi_outlined),
                  KpiCard(
                    label: 'Por revisar',
                    value: '${d.pendingPaymentsCount}',
                    icon: Icons.pending_outlined,
                    valueColor: d.pendingPaymentsCount > 0 ? const Color(0xFFFBBF24) : null,
                  ),
                  KpiCard(
                    label: 'Stock crítico',
                    value: '${d.lowStockCount}',
                    icon: Icons.inventory_2_outlined,
                    valueColor: d.lowStockCount > 0 ? const Color(0xFFF87171) : null,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Accesos rápidos
              _SectionLabel('Accesos rápidos'),
              _QuickActions(),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: Colors.white38),
        ),
      );
}

class _AlertsRow extends StatelessWidget {
  final DashboardData d;
  const _AlertsRow({required this.d});

  @override
  Widget build(BuildContext context) => Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          if (d.reportedPaymentsCount > 0)
            _chip(context, Icons.pending_outlined, '${d.reportedPaymentsCount} pagos por revisar', const Color(0xFFFBBF24)),
          if (d.lowStockCount > 0)
            _chip(context, Icons.inventory_2_outlined, '${d.lowStockCount} productos críticos', const Color(0xFFF87171)),
        ],
      );

  Widget _chip(BuildContext context, IconData icon, String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
          ],
        ),
      );
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      (Icons.people_outline, 'Clientes', '/clients'),
      (Icons.payments_outlined, 'Pagos', '/payments'),
      (Icons.receipt_long_outlined, 'Cobros', '/cobros'),
      (Icons.inbox_outlined, 'Solicitudes', '/requests'),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.5,
      children: actions.map((a) => InkWell(
        onTap: () => context.go(a.$3),
        borderRadius: BorderRadius.circular(12),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(a.$1, size: 18, color: const Color(0xFF0057FF)),
                const SizedBox(width: 10),
                Text(a.$2, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      )).toList(),
    );
  }
}
