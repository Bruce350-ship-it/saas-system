class ApiConstants {
  static const String baseUrl = 'http://10.180.200.184:3000/api';
  static const String loginEndpoint = '/auth/login';
  static const String verifyEndpoint = '/auth/verify';
  static const String productsEndpoint = '/products';
  static const String salesEndpoint = '/sales';
  static const String syncEndpoint = '/sync';
}

class DatabaseConstants {
  static const String databaseName = 'saas_mobile.db';
  static const int databaseVersion = 2;
  
  // Table names
  static const String productsTable = 'products';
  static const String salesTable = 'sales';
  static const String usersTable = 'users';
}

class StorageKeys {
  static const String token = 'auth_token';
  static const String user = 'user_data';
  static const String lastSync = 'last_sync_timestamp';
}