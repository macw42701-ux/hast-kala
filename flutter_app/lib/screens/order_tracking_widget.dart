import 'package:flutter/material.dart';
import '../models/models.dart';

class OrderTrackingWidget extends StatelessWidget {
  final String currentStatus;
  final String adminRemarks;
  final String estimatedDelivery;

  const OrderTrackingWidget({
    super.key,
    required this.currentStatus,
    required this.adminRemarks,
    required this.estimatedDelivery,
  });

  @override
  Widget build(BuildContext context) {
    final activeStages = orderStatusFlow.where((s) => s != 'Cancelled').toList();
    final isCancelled = currentStatus == 'Cancelled';
    final currentIdx = activeStages.indexOf(currentStatus);
    final progress = isCancelled
        ? 1.0
        : (currentIdx < 0 ? 1 : currentIdx + 1) / activeStages.length;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Status: $currentStatus',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isCancelled ? Colors.red.shade700 : const Color(0xFF1E3A5F),
                  ),
                ),
                if (estimatedDelivery.isNotEmpty && !isCancelled)
                  Text(
                    'ETA: $estimatedDelivery',
                    style: const TextStyle(fontSize: 12, color: Colors.black54),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                color: isCancelled ? Colors.red.shade600 : const Color(0xFF1E3A5F),
                backgroundColor: const Color(0xFFE5E1D8),
              ),
            ),
            const SizedBox(height: 12),
            ...List.generate(orderStatusFlow.length, (i) {
              final stage = orderStatusFlow[i];
              final isCancelStage = stage == 'Cancelled';
              final done = !isCancelled && !isCancelStage && i <= currentIdx;
              final active = stage == currentStatus;

              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    Icon(
                      isCancelStage
                          ? (active ? Icons.cancel : Icons.remove_circle_outline)
                          : (done ? Icons.check_circle : Icons.radio_button_unchecked),
                      size: 18,
                      color: active && isCancelled
                          ? Colors.red.shade600
                          : (done ? const Color(0xFF1E3A5F) : Colors.black38),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${i + 1}. $stage',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                        color: active ? Colors.black87 : Colors.black54,
                      ),
                    ),
                  ],
                ),
              );
            }),
            if (adminRemarks.isNotEmpty) ...[
              const Divider(height: 20),
              Text(
                'Admin Remarks: $adminRemarks',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E3A5F),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
