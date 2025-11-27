import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';

class ProductsProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final DatabaseService _databaseService = DatabaseService();
  
  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;

  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadProducts() async {
    print('🔄 ProductsProvider: Starting to load products');
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔄 ProductsProvider: Calling API service');
      // Try to load from server first
      _products = await _apiService.getProducts();
      print('🔄 ProductsProvider: Got ${_products.length} products from API');
      
      // Update local database
      for (final product in _products) {
        await _databaseService.insertProduct(product);
      }
      print('🔄 ProductsProvider: Products saved to local database');
    } catch (e) {
      print('❌ ProductsProvider: API failed, trying local database: ${e.toString()}');
      // If server fails, load from local database
      try {
        _products = await _databaseService.getAllProducts();
        print('🔄 ProductsProvider: Got ${_products.length} products from local database');
      } catch (dbError) {
        print('❌ ProductsProvider: Local database also failed: ${dbError.toString()}');
        _error = 'Failed to load products: ${e.toString()}';
      }
    } finally {
      _isLoading = false;
      notifyListeners();
      print('🔄 ProductsProvider: Loading completed');
    }
  }

  Future<void> refreshProducts() async {
    await loadProducts();
  }

  Product? getProductById(String id) {
    try {
      return _products.firstWhere((product) => product.id == id);
    } catch (e) {
      return null;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}


