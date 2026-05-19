import 'package:flutter/material.dart';

enum PaymentStatus { pendiente, reportado, confirmado, rechazado }
enum SubscriptionStatus { activa, suspendida, cancelada }
enum RequestStatus { pendiente, procesada, rechazada }

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final (color, bg) = _colors(status.toUpperCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  (Color, Color) _colors(String s) {
    switch (s) {
      case 'CONFIRMADO':
      case 'ACTIVA':
      case 'PROCESADA':
        return (const Color(0xFF4ADE80), const Color(0xFF4ADE80).withOpacity(0.15));
      case 'REPORTADO':
      case 'PENDIENTE':
        return (const Color(0xFFFBBF24), const Color(0xFFFBBF24).withOpacity(0.15));
      case 'RECHAZADO':
      case 'CANCELADA':
        return (const Color(0xFFF87171), const Color(0xFFF87171).withOpacity(0.15));
      case 'SUSPENDIDA':
        return (const Color(0xFF94A3B8), const Color(0xFF94A3B8).withOpacity(0.15));
      default:
        return (const Color(0xFF94A3B8), const Color(0xFF94A3B8).withOpacity(0.15));
    }
  }
}
