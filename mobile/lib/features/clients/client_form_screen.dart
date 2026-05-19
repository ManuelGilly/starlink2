import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';

class ClientFormScreen extends ConsumerStatefulWidget {
  final String? clientId;
  final Map<String, dynamic>? initial;
  const ClientFormScreen({super.key, this.clientId, this.initial});

  @override
  ConsumerState<ClientFormScreen> createState() => _ClientFormScreenState();
}

class _ClientFormScreenState extends ConsumerState<ClientFormScreen> {
  late final _first = TextEditingController(text: widget.initial?['firstName'] as String? ?? '');
  late final _last = TextEditingController(text: widget.initial?['lastName'] as String? ?? '');
  late final _email = TextEditingController(text: widget.initial?['email'] as String? ?? '');
  late final _phone = TextEditingController(text: widget.initial?['phone'] as String? ?? '');
  late final _address = TextEditingController(text: widget.initial?['address'] as String? ?? '');
  late final _notes = TextEditingController(text: widget.initial?['notes'] as String? ?? '');
  bool _loading = false;

  bool get isEdit => widget.clientId != null;

  @override
  void dispose() {
    for (final c in [_first, _last, _email, _phone, _address, _notes]) c.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_first.text.isEmpty || _last.text.isEmpty || _email.text.isEmpty || _phone.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Completa los campos obligatorios')));
      return;
    }
    setState(() { _loading = true; });
    try {
      final dio = ref.read(apiClientProvider);
      final data = {
        'firstName': _first.text.trim(),
        'lastName': _last.text.trim(),
        'email': _email.text.trim(),
        'phone': _phone.text.trim(),
        if (_address.text.isNotEmpty) 'address': _address.text.trim(),
        if (_notes.text.isNotEmpty) 'notes': _notes.text.trim(),
      };
      if (isEdit) {
        await dio.patch(ApiEndpoints.clientById(widget.clientId!), data: data);
      } else {
        await dio.post(ApiEndpoints.clients, data: data);
      }
      if (mounted) context.pop();
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error al guardar')));
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(isEdit ? 'Editar cliente' : 'Nuevo cliente')),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _field(_first, 'Nombre *'),
            const SizedBox(height: 14),
            _field(_last, 'Apellido *'),
            const SizedBox(height: 14),
            _field(_email, 'Email *', type: TextInputType.emailAddress),
            const SizedBox(height: 14),
            _field(_phone, 'Teléfono *', type: TextInputType.phone),
            const SizedBox(height: 14),
            _field(_address, 'Dirección'),
            const SizedBox(height: 14),
            TextField(
              controller: _notes,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Notas'),
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(isEdit ? 'Guardar cambios' : 'Crear cliente'),
            ),
          ],
        ),
      );

  Widget _field(TextEditingController ctrl, String label, {TextInputType? type}) => TextField(
        controller: ctrl,
        keyboardType: type,
        decoration: InputDecoration(labelText: label),
      );
}
