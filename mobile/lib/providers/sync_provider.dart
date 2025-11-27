import 'package:flutter/foundation.dart';
import '../services/sync_service.dart';

class SyncProvider with ChangeNotifier {
  final SyncService _syncService = SyncService();
  
  bool _isOnline = false;
  bool _isSyncing = false;
  int _pendingSyncCount = 0;
  String? _lastSyncTime;

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;
  int get pendingSyncCount => _pendingSyncCount;
  String? get lastSyncTime => _lastSyncTime;

  Future<void> initialize() async {
    await _syncService.initialize();
    _isOnline = _syncService.isOnline;
    _pendingSyncCount = await _syncService.getPendingSyncCount();
    notifyListeners();
  }

  Future<void> forceSync() async {
    if (_isSyncing) return;

    _isSyncing = true;
    notifyListeners();

    try {
      await _syncService.forceSync();
      _pendingSyncCount = await _syncService.getPendingSyncCount();
      _lastSyncTime = DateTime.now().toIso8601String();
    } catch (e) {
      // Handle sync error
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> updateSyncStatus() async {
    _isOnline = _syncService.isOnline;
    _pendingSyncCount = await _syncService.getPendingSyncCount();
    notifyListeners();
  }

  void dispose() {
    _syncService.dispose();
    super.dispose();
  }
}


