import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'clients_provider.dart';
import '../../shared/widgets/empty_state.dart';

class ClientListScreen extends ConsumerStatefulWidget {
  const ClientListScreen({super.key});

  @override
  ConsumerState<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends ConsumerState<ClientListScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(clientsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await context.push('/clients/new');
          ref.invalidate(clientsProvider);
        },
        child: const Icon(Icons.person_add_outlined),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Buscar por nombre, email…',
                prefixIcon: Icon(Icons.search, size: 18),
                contentPadding: EdgeInsets.symmetric(vertical: 10),
              ),
              onChanged: (v) => setState(() { _query = v.toLowerCase(); }),
            ),
          ),
          Expanded(
            child: data.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: TextButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
                onPressed: () => ref.invalidate(clientsProvider),
              )),
              data: (clients) {
                final filtered = _query.isEmpty
                    ? clients
                    : clients.where((c) =>
                        c.fullName.toLowerCase().contains(_query) ||
                        c.email.toLowerCase().contains(_query)).toList();

                if (filtered.isEmpty) {
                  return const EmptyState(icon: Icons.people_outline, message: 'Sin clientes');
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(clientsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final c = filtered[i];
                      return Card(
                        child: ListTile(
                          onTap: () => context.push('/clients/${c.id}'),
                          leading: CircleAvatar(
                            backgroundColor: const Color(0xFF0057FF).withOpacity(0.15),
                            child: Text(
                              c.firstName[0].toUpperCase(),
                              style: const TextStyle(color: Color(0xFF0057FF), fontWeight: FontWeight.w700),
                            ),
                          ),
                          title: Text(c.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.email, style: const TextStyle(fontSize: 12, color: Colors.white54)),
                              Text(c.activePlan, style: const TextStyle(fontSize: 11, color: Color(0xFF4ADE80))),
                            ],
                          ),
                          isThreeLine: true,
                          trailing: const Icon(Icons.chevron_right, size: 18, color: Colors.white38),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
