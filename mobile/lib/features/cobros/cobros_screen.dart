import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'cobros_provider.dart';
import '../../shared/widgets/kpi_card.dart';
import '../../shared/widgets/status_badge.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

const _meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
String _usd(double v) => '\$${v.toStringAsFixed(2)}';

class CobrosScreen extends ConsumerWidget {
  const CobrosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mes = ref.watch(cobrosMonthProvider);
    final data = ref.watch(cobrosProvider);

    void navMes(int delta) {
      final parts = mes.split('-');
      int y = int.parse(parts[0]);
      int m = int.parse(parts[1]) + delta;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      ref.read(cobrosMonthProvider.notifier).state = '$y-${m.toString().padLeft(2, '0')}';
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Cobros')),
      body: Column(
        children: [
          // Navegación de mes
          Container(
            color: const Color(0xFF12121A),
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(onPressed: () => navMes(-1), icon: const Icon(Icons.chevron_left)),
                data.when(
                  loading: () => const Text('Cargando…', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  error: (_, __) => Text(mes, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  data: (d) => Text(
                    '${_meses[d.month - 1]} ${d.year}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
                IconButton(onPressed: () => navMes(1), icon: const Icon(Icons.chevron_right)),
              ],
            ),
          ),
          Expanded(
            child: data.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: TextButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
                onPressed: () => ref.invalidate(cobrosProvider),
              )),
              data: (d) => RefreshIndicator(
                onRefresh: () async => ref.invalidate(cobrosProvider),
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Resumen
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 1.7,
                      children: [
                        KpiCard(label: 'Cobrado', value: _usd(d.totalCobrado), icon: Icons.payments_outlined),
                        KpiCard(label: 'A Starlink', value: _usd(d.totalStarlink), icon: Icons.satellite_alt),
                        KpiCard(
                          label: 'Ganancia',
                          value: _usd(d.totalGanancia),
                          icon: Icons.trending_up_outlined,
                          valueColor: d.totalGanancia >= 0 ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
                        ),
                        KpiCard(
                          label: 'Sin pago',
                          value: '${d.sinPago}',
                          icon: Icons.pending_outlined,
                          valueColor: d.sinPago > 0 ? const Color(0xFFFBBF24) : null,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Lista de clientes
                    ...d.rows.map((row) => _CobroRow(
                      row: row,
                      periodoInicio: d.periodoInicio,
                      periodoFin: d.periodoFin,
                      onRegistered: () => ref.invalidate(cobrosProvider),
                    )),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CobroRow extends StatelessWidget {
  final CobroRow row;
  final String periodoInicio;
  final String periodoFin;
  final VoidCallback onRegistered;

  const _CobroRow({required this.row, required this.periodoInicio, required this.periodoFin, required this.onRegistered});

  @override
  Widget build(BuildContext context) {
    final hasPago = row.pago != null;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(row.clientName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  Text(row.planName, style: const TextStyle(fontSize: 12, color: Colors.white54)),
                  if (hasPago) ...[
                    const SizedBox(height: 4),
                    Row(children: [
                      Text(_usd(row.pago!.amount), style: const TextStyle(fontSize: 12, color: Color(0xFF4ADE80))),
                      if (row.pago!.starlinkCost != null) ...[
                        const Text(' · ', style: TextStyle(color: Colors.white38)),
                        Text('Starlink: ${_usd(row.pago!.starlinkCost!)}', style: const TextStyle(fontSize: 11, color: Colors.white38)),
                      ],
                    ]),
                    Text('Ganancia: ${_usd(row.pago!.ganancia)}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: row.pago!.ganancia >= 0 ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
                        )),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (hasPago)
              StatusBadge('CONFIRMADO')
            else
              TextButton(
                onPressed: () => _showForm(context),
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFF0057FF).withOpacity(0.15),
                  foregroundColor: const Color(0xFF0057FF),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                ),
                child: const Text('Registrar', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
      ),
    );
  }

  void _showForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF12121A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _CobroForm(row: row, periodoInicio: periodoInicio, periodoFin: periodoFin, onSuccess: onRegistered),
    );
  }
}

class _CobroForm extends ConsumerStatefulWidget {
  final CobroRow row;
  final String periodoInicio;
  final String periodoFin;
  final VoidCallback onSuccess;

  const _CobroForm({required this.row, required this.periodoInicio, required this.periodoFin, required this.onSuccess});

  @override
  ConsumerState<_CobroForm> createState() => _CobroFormState();
}

class _CobroFormState extends ConsumerState<_CobroForm> {
  late final _amount = TextEditingController(text: widget.row.priceLocked.toStringAsFixed(2));
  late final _starlink = TextEditingController(text: widget.row.planCost.toStringAsFixed(2));
  final _refCtrl = TextEditingController();
  String _method = 'ZELLE';
  bool _loading = false;

  static const _methods = ['ZELLE','PAYPAL','BINANCE','EFECTIVO_USD','TRANSFERENCIA_USD','PAGO_MOVIL','OTRO'];

  double get _ganancia => (double.tryParse(_amount.text) ?? 0) - (double.tryParse(_starlink.text) ?? 0);

  @override
  void dispose() {
    _amount.dispose();
    _starlink.dispose();
    _refCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final amt = double.tryParse(_amount.text) ?? 0;
    if (amt <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Monto inválido')));
      return;
    }
    setState(() { _loading = true; });
    try {
      final dio = ref.read(apiClientProvider);
      await dio.post(ApiEndpoints.payments, data: {
        'clientId': widget.row.clientId,
        'subscriptionId': widget.row.subscriptionId,
        'amount': amt,
        'starlinkCost': double.tryParse(_starlink.text),
        'method': _method,
        'reference': _refCtrl.text.isNotEmpty ? _refCtrl.text : null,
        'periodStart': widget.periodoInicio,
        'periodEnd': widget.periodoFin,
        'paidAt': DateTime.now().toIso8601String(),
        'status': 'CONFIRMADO',
      });
      widget.onSuccess();
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error al registrar cobro')));
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Registrar cobro', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          Text('${widget.row.clientName} · ${widget.row.planName}',
              style: const TextStyle(fontSize: 12, color: Colors.white54)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _method,
            decoration: const InputDecoration(labelText: 'Plataforma de pago'),
            items: _methods.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
            onChanged: (v) => setState(() { _method = v ?? 'ZELLE'; }),
          ),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: TextField(
              controller: _amount,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Cobrado al cliente'),
              onChanged: (_) => setState(() {}),
            )),
            const SizedBox(width: 12),
            Expanded(child: TextField(
              controller: _starlink,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Pagamos a Starlink'),
              onChanged: (_) => setState(() {}),
            )),
          ]),
          const SizedBox(height: 10),
          // Ganancia
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF1C1C28),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Ganancia', style: TextStyle(fontSize: 12, color: Colors.white54)),
                Text(
                  _usd(_ganancia),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: _ganancia >= 0 ? const Color(0xFF4ADE80) : const Color(0xFFF87171),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _refCtrl,
            decoration: const InputDecoration(labelText: 'Referencia (opcional)'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Confirmar cobro'),
          ),
        ],
      ),
    );
  }
}
