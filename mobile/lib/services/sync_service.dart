import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/product.dart';
import '../models/sale.dart';
import 'api_service.dart';
import 'database_service.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final ApiService _apiService = ApiService();
  final DatabaseService _databaseService = DatabaseService();
  final Connectivity _connectivity = Connectivity();

  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  bool _isOnline = false;
  bool _isSyncing = false;

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;

  Future<void> initialize() async {
    // Check initial connectivity
    await _checkConnectivity();
    
    // Listen to connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      (ConnectivityResult result) {
        _checkConnectivity();
      },
    );
  }

  Future<void> _checkConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    _isOnline = result == ConnectivityResult.mobile || 
                result == ConnectivityResult.wifi ||
                result == ConnectivityResult.ethernet;
    
    // If we're back online, try to sync
    if (_isOnline) {
      await syncOfflineData();
    }
  }

  Future<void> syncOfflineData() async {
    print('🔄 SyncService: Starting sync, isOnline: $_isOnline, isSyncing: $_isSyncing');
    
    if (_isSyncing || !_isOnline) {
      print('🔄 SyncService: Skipping sync - isSyncing: $_isSyncing, isOnline: $_isOnline');
      return;
    }

    _isSyncing = true;
    print('🔄 SyncService: Getting unsynced sales...');
    
    try {
      // Get unsynced sales
      final unsyncedSales = await _databaseService.getUnsyncedSales();
      print('🔄 SyncService: Found ${unsyncedSales.length} unsynced sales');
      
      if (unsyncedSales.isEmpty) {
        print('🔄 SyncService: No unsynced sales to sync');
        return;
      }

      print('🔄 SyncService: Syncing with server...');
      // Sync with server
      final syncResult = await _apiService.syncOfflineSales(unsyncedSales);
      print('🔄 SyncService: Server sync completed');
      
      // Update local database
      await _updateLocalData(syncResult);
      print('🔄 SyncService: Local data updated');
      
      // Mark sales as synced
      for (final sale in unsyncedSales) {
        await _databaseService.markSaleAsSynced(sale.id);
      }
      print('🔄 SyncService: Sales marked as synced');
      
    } catch (e) {
      print('❌ SyncService: Sync failed: $e');
      // Could implement retry logic here
    } finally {
      _isSyncing = false;
      print('🔄 SyncService: Sync completed');
    }
  }

  Future<void> _updateLocalData(Map<String, dynamic> syncResult) async {
    // Update products from server response
    if (syncResult['products'] != null) {
      final List<dynamic> productsJson = syncResult['products'];
      for (final productJson in productsJson) {
        final product = Product.fromJson(productJson);
        await _databaseService.insertProduct(product);
      }
    }
  }

  Future<void> forceSync() async {
    if (!_isOnline) {
      throw Exception('No internet connection');
    }
    
    await syncOfflineData();
  }

  Future<int> getPendingSyncCount() async {
    return await _databaseService.getUnsyncedSalesCount();
  }

  Future<void> dispose() async {
    await _connectivitySubscription?.cancel();
  }
}