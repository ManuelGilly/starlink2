import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'clients_provider.dart';
import '../../shared/widgets/status_badge.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

String _usd(num v) => '\$${v.toStringAsFixed(2)}';

class ClientDetailScreen extends ConsumerWidget {
  final String clientId;
  const ClientDetailScreen({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(clientDetailProvider(clientId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cliente'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 20),
            onPressed: () async {
              await context.push('/clients/$clientId/edit');
              ref.invalidate(clientDetailProvider(clientId));
            },
          ),
        ],
      ),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (client) {
          final subs = List<Map<String, dynamic>>.from(client['subscriptions'] as List? ?? []);
          final payments = List<Map<String, dynamic>>.from(client['payments'] as List? ?? []);

          return DefaultTabController(
            length: 3,
            child: Column(
              children: [
                // Header
                Container(
                  color: const Color(0xFF12121A),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${client['firstName']} ${client['lastName']}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(client['email'] as String? ?? '', style: const TextStyle(color: Colors.white54, fontSize: 13)),
                      const SizedBox(height: 12),
                      const TabBar(tabs: [
                        Tab(text: 'Info'),
                        Tab(text: 'Suscripciones'),
                        Tab(text: 'Pagos'),
                      ]),
                    ],
                  ),
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      _InfoTab(client: client),
                      _SubsTab(clientId: clientId, subs: subs, ref: ref),
                      _PaymentsTab(payments: payments),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _InfoTab extends StatelessWidget {
  final Map<String, dynamic> client;
  const _InfoTab({required this.client});

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _row(Icons.phone_outlined, 'Teléfono', client['phone'] as String? ?? '—'),
          _row(Icons.location_on_outlined, 'Dirección', client['address'] as String? ?? '—'),
          _row(Icons.send_outlined, 'Telegram ID', client['telegramChatId'] as String? ?? '—'),
          if (client['notes'] != null)
            _row(Icons.notes_outlined, 'Notas', client['notes'] as String),
        ],
      );

  Widget _row(IconData icon, String label, String value) => ListTile(
        leading: Icon(icon, size: 18, color: Colors.white38),
        title: Text(label, style: const TextStyle(fontSize: 11, color: Colors.white38, fontWeight: FontWeight.w500)),
        subtitle: Text(value, style: const TextStyle(fontSize: 14)),
        dense: true,
      );
}

class _SubsTab extends StatelessWidget {
  final String clientId;
  final List<Map<String, dynamic>> subs;
  final WidgetRef ref;
  const _SubsTab({required this.clientId, required this.subs, required this.ref});

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showAssignPlan(context),
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Asignar plan'),
              ),
            ),
          ),
          Expanded(
            child: subs.isEmpty
                ? const Center(child: Text('Sin suscripciones', style: TextStyle(color: Colors.white38)))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: subs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final s = subs[i];
                      final plan = s['plan'] as Map? ?? {};
                      return Card(
                        child: ListTile(
                          title: Text(plan['name'] as String? ?? '—', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text('\$${(s['priceLocked'] as num?)?.toStringAsFixed(2) ?? '—'} · Día ${s['billingDay']}',
                              style: const TextStyle(fontSize: 12)),
                          trailing: StatusBadge(s['status'] as String? ?? ''),
                        ),
                      );
                    },
                  ),
          ),
        ],
      );

  void _showAssignPlan(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF12121A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _AssignPlanSheet(clientId: clientId, onDone: () {
        ref.invalidate(clientDetailProvider(clientId));
      }),
    );
  }
}

class _AssignPlanSheet extends ConsumerStatefulWidget {
  final String clientId;
  final VoidCallback onDone;
  const _AssignPlanSheet({required this.clientId, required this.onDone});

  @override
  ConsumerState<_AssignPlanSheet> createState() => _AssignPlanSheetState();
}

class _AssignPlanSheetState extends ConsumerState<_AssignPlanSheet> {
  String? _planId;
  String _price = '';
  int _billingDay = 1;
  bool _loading = false;

  Future<void> _submit() async {
    if (_planId == null) return;
    setState(() { _loading = true; });
    try {
      final dio = ref.read(apiClientProvider);
      await dio.post(ApiEndpoints.clientSubscriptions(widget.clientId), data: {
        'planId': _planId,
        if (_price.isNotEmpty) 'priceLocked': double.tryParse(_price),
        'billingDay': _billingDay,
      });
      widget.onDone();
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error al asignar plan')));
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final plans = ref.watch(plansListProvider);
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Asignar plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          plans.when(
            loading: () => const CircularProgressIndicator(),
            error: (e, _) => Text('Error: $e'),
            data: (list) => DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Plan'),
              value: _planId,
              items: list.map((p) => DropdownMenuItem(
                value: p['id'] as String,
                child: Text('${p['name']} · \$${(p['price'] as num).toStringAsFixed(2)}'),
              )).toList(),
              onChanged: (v) => setState(() { _planId = v; }),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Precio acordado (opcional)'),
            onChanged: (v) => _price = v,
          ),
          const SizedBox(height: 12),
          Row(children: [
            const Text('Día de cobro:', style: TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(width: 12),
            DropdownButton<int>(
              value: _billingDay,
              items: List.generate(28, (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}'))),
              onChanged: (v) => setState(() { _billingDay = v ?? 1; }),
            ),
          ]),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Confirmar'),
          ),
        ],
      ),
    );
  }
}

class _PaymentsTab extends StatelessWidget {
  final List<Map<String, dynamic>> payments;
  const _PaymentsTab({required this.payments});

  @override
  Widget build(BuildContext context) {
    if (payments.isEmpty) {
      return const Center(child: Text('Sin pagos', style: TextStyle(color: Colors.white38)));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: payments.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (_, i) {
        final p = payments[i];
        final date = p['paidAt'] ?? p['createdAt'];
        return ListTile(
          dense: true,
          title: Text(_usd(p['amount'] as num? ?? 0),
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text('${p['method'] ?? ''} · ${_fmtDate(date)}',
              style: const TextStyle(fontSize: 11, color: Colors.white54)),
          trailing: StatusBadge(p['status'] as String? ?? ''),
        );
      },
    );
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.parse(d as String);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return '—';
    }
  }
}
