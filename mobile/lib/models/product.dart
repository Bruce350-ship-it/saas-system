import 'package:json_annotation/json_annotation.dart';

part 'product.g.dart';

@JsonSerializable()
class Product {
  final String id;
  final String name;
  @JsonKey(fromJson: _priceFromJson, toJson: _priceToJson)
  final double price;
  final DateTime? syncedAt;

  Product({
    required this.id,
    required this.name,
    required this.price,
    this.syncedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);

  Product copyWith({
    String? id,
    String? name,
    double? price,
    DateTime? syncedAt,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      syncedAt: syncedAt ?? this.syncedAt,
    );
  }
}

// Helper functions for JSON conversion
double _priceFromJson(dynamic value) {
  if (value is num) {
    return value.toDouble();
  } else if (value is String) {
    return double.parse(value);
  } else {
    throw ArgumentError('Price must be a number or string, got ${value.runtimeType}');
  }
}

dynamic _priceToJson(double value) => value;