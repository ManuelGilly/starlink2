import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;
    if (email.isEmpty || pass.isEmpty) return;

    setState(() { _loading = true; _error = null; });
    try {
      final result = await ref.read(authProvider.notifier).loginStep1(email, pass);

      if (result['requires2fa'] == true) {
        if (!mounted) return;
        context.push('/2fa', extra: result['challengeToken'] as String);
      } else if (result['requires2fa'] == false) {
        // INVENTARIO — login directo
        await ref.read(authProvider.notifier).loginDirect(result['challengeToken'] as String);
        if (!mounted) return;
        context.go('/');
      } else if (result['needsTelegramSetup'] == true) {
        setState(() { _error = 'Configura Telegram primero en el sistema web.'; });
      }
    } catch (e) {
      final msg = _parseError(e);
      setState(() { _error = msg; });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  String _parseError(Object e) {
    if (e is Exception) {
      final s = e.toString();
      if (s.contains('Credenciales')) return 'Email o contraseña incorrectos';
      if (s.contains('429')) return 'Demasiados intentos. Espera un momento.';
      if (s.contains('403')) return 'Sin acceso al panel de administración';
    }
    return 'No se pudo conectar. Verifica tu conexión.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              // Logo
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0057FF).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF0057FF).withOpacity(0.4)),
                  ),
                  child: const Icon(Icons.satellite_alt, color: Color(0xFF0057FF), size: 32),
                ),
              ),
              const SizedBox(height: 20),
              const Center(
                child: Text(
                  'STARLINK VE',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 3,
                    color: Colors.white,
                  ),
                ),
              ),
              const Center(
                child: Text(
                  'Admin',
                  style: TextStyle(fontSize: 13, color: Colors.white38, letterSpacing: 1),
                ),
              ),
              const SizedBox(height: 52),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _passCtrl,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
                decoration: InputDecoration(
                  labelText: 'Contraseña',
                  prefixIcon: const Icon(Icons.lock_outline, size: 18),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 18),
                    onPressed: () => setState(() { _obscure = !_obscure; }),
                  ),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF87171).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFF87171).withOpacity(0.3)),
                  ),
                  child: Text(_error!, style: const TextStyle(color: Color(0xFFF87171), fontSize: 13)),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Entrar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
