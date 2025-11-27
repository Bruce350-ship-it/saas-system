import 'package:json_annotation/json_annotation.dart';

part 'sale.g.dart';

@JsonSerializable()
class Sale {
  final String id;
  final String productId;
  final String userId;
  final int quantity;
  final double total;
  final bool synced;
  final DateTime createdAt;
  final String? localId;

  Sale({
    required this.id,
    required this.productId,
    required this.userId,
    required this.quantity,
    required this.total,
    required this.synced,
    required this.createdAt,
    this.localId,
  });

  factory Sale.fromJson(Map<String, dynamic> json) => _$SaleFromJson(json);
  Map<String, dynamic> toJson() => _$SaleToJson(this);

  Sale copyWith({
    String? id,
    String? productId,
    String? userId,
    int? quantity,
    double? total,
    bool? synced,
    DateTime? createdAt,
    String? localId,
  }) {
    return Sale(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      userId: userId ?? this.userId,
      quantity: quantity ?? this.quantity,
      total: total ?? this.total,
      synced: synced ?? this.synced,
      createdAt: createdAt ?? this.createdAt,
      localId: localId ?? this.localId,
    );
  }
}