// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sale.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Sale _$SaleFromJson(Map<String, dynamic> json) => Sale(
      id: json['id'] as String,
      productId: json['productId'] as String,
      userId: json['userId'] as String,
      quantity: (json['quantity'] as num).toInt(),
      total: (json['total'] as num).toDouble(),
      synced: json['synced'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      localId: json['localId'] as String?,
    );

Map<String, dynamic> _$SaleToJson(Sale instance) => <String, dynamic>{
      'id': instance.id,
      'productId': instance.productId,
      'userId': instance.userId,
      'quantity': instance.quantity,
      'total': instance.total,
      'synced': instance.synced,
      'createdAt': instance.createdAt.toIso8601String(),
      'localId': instance.localId,
    };
