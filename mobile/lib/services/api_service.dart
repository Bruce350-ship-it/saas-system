import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../models/user.dart';
import '../utils/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: StorageKeys.token);
          print('🔑 Token for request: ${token != null ? "Present" : "Missing"}');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            print('🔑 Authorization header set');
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired or invalid, clear storage
            await _storage.delete(key: StorageKeys.token);
            await _storage.delete(key: StorageKeys.user);
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<void> initialize() async {
    _setupInterceptors();
  }

  // Authentication
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print('🔐 Attempting login for: $email');
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiConstants.loginEndpoint}',
        data: {
          'email': email,
          'password': password,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );

      print('🔐 Login response status: ${response.statusCode}');
      print('🔐 Login response data: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        await _storage.write(key: StorageKeys.token, value: data['token']);
        await _storage.write(key: StorageKeys.user, value: data['user'].toString());
        print('✅ Token stored successfully');
        return data;
      }
      throw Exception('Login failed');
    } catch (e) {
      print('❌ Login error: ${e.toString()}');
      throw Exception('Login failed: ${e.toString()}');
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      final response = await _dio.get(
        '${ApiConstants.baseUrl}${ApiConstants.verifyEndpoint}',
      );

      if (response.statusCode == 200) {
        return User.fromJson(response.data['user']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: StorageKeys.token);
    await _storage.delete(key: StorageKeys.user);
  }

  // Products
  Future<List<Product>> getProducts() async {
    try {
      print('🔍 Fetching products from: ${ApiConstants.baseUrl}${ApiConstants.productsEndpoint}');
      final response = await _dio.get(
        '${ApiConstants.baseUrl}${ApiConstants.productsEndpoint}',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );

      print('📡 Products response status: ${response.statusCode}');
      print('📡 Products response data: ${response.data}');

      if (response.statusCode == 200) {
        final List<dynamic> productsJson = response.data['products'];
        return productsJson.map((json) => Product.fromJson(json)).toList();
      }
      throw Exception('Failed to fetch products');
    } catch (e) {
      print('❌ Products API error: ${e.toString()}');
      throw Exception('Failed to fetch products: ${e.toString()}');
    }
  }

  // Sales
  Future<Sale> createSale(String productId, int quantity) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiConstants.salesEndpoint}',
        data: {
          'productId': productId,
          'quantity': quantity,
        },
      );

      if (response.statusCode == 201) {
        return Sale.fromJson(response.data['sale']);
      }
      throw Exception('Failed to create sale');
    } catch (e) {
      throw Exception('Failed to create sale: ${e.toString()}');
    }
  }

  // Sync
  Future<Map<String, dynamic>> syncOfflineSales(List<Sale> sales) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.baseUrl}${ApiConstants.syncEndpoint}',
        data: {
          'sales': sales.map((sale) => sale.toJson()).toList(),
        },
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Sync failed');
    } catch (e) {
      throw Exception('Sync failed: ${e.toString()}');
    }
  }

  // Check connectivity
  Future<bool> isConnected() async {
    try {
      final response = await _dio.get(
        '${ApiConstants.baseUrl}/health',
        options: Options(
          receiveTimeout: const Duration(seconds: 5),
          sendTimeout: const Duration(seconds: 5),
        ),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}