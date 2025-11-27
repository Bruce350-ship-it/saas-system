import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../utils/constants.dart';

class DatabaseService {
  static Database? _database;
  static const String _databaseName = DatabaseConstants.databaseName;
  static const int _databaseVersion = DatabaseConstants.databaseVersion;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), _databaseName);
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // Create products table
    await db.execute('''
      CREATE TABLE ${DatabaseConstants.productsTable} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        syncedAt TEXT
      )
    ''');

    // Create sales table
    await db.execute('''
      CREATE TABLE ${DatabaseConstants.salesTable} (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total REAL NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        local_id TEXT
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Drop and recreate products table with correct schema
      await db.execute('DROP TABLE IF EXISTS ${DatabaseConstants.productsTable}');
      await db.execute('''
        CREATE TABLE ${DatabaseConstants.productsTable} (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          syncedAt TEXT
        )
      ''');
    }
  }

  // Product operations
  Future<void> insertProduct(Product product) async {
    final db = await database;
    // Create a custom map without syncedAt to avoid schema issues
    final productData = {
      'id': product.id,
      'name': product.name,
      'price': product.price,
    };
    await db.insert(
      DatabaseConstants.productsTable,
      productData,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Product>> getAllProducts() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      DatabaseConstants.productsTable,
      orderBy: 'name ASC',
    );
    return List.generate(maps.length, (i) {
      // Add syncedAt field if missing
      final productData = Map<String, dynamic>.from(maps[i]);
      if (!productData.containsKey('syncedAt')) {
        productData['syncedAt'] = null;
      }
      return Product.fromJson(productData);
    });
  }

  Future<Product?> getProductById(String id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      DatabaseConstants.productsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
    if (maps.isNotEmpty) {
      // Add syncedAt field if missing
      final productData = Map<String, dynamic>.from(maps.first);
      if (!productData.containsKey('syncedAt')) {
        productData['syncedAt'] = null;
      }
      return Product.fromJson(productData);
    }
    return null;
  }

  Future<void> updateProduct(Product product) async {
    final db = await database;
    await db.update(
      DatabaseConstants.productsTable,
      product.toJson(),
      where: 'id = ?',
      whereArgs: [product.id],
    );
  }

  Future<void> deleteProduct(String id) async {
    final db = await database;
    await db.delete(
      DatabaseConstants.productsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Sale operations
  Future<void> insertSale(Sale sale) async {
    final db = await database;
    // Create a custom map with correct column names
    final saleData = {
      'id': sale.id,
      'product_id': sale.productId,
      'user_id': sale.userId,
      'quantity': sale.quantity,
      'total': sale.total,
      'synced': sale.synced ? 1 : 0,
      'created_at': sale.createdAt.toIso8601String(),
      'local_id': sale.localId,
    };
    await db.insert(
      DatabaseConstants.salesTable,
      saleData,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Sale>> getAllSales() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      DatabaseConstants.salesTable,
      orderBy: 'created_at DESC',
    );
    return List.generate(maps.length, (i) {
      // Convert database column names to camelCase
      final saleData = {
        'id': maps[i]['id'],
        'productId': maps[i]['product_id'],
        'userId': maps[i]['user_id'],
        'quantity': maps[i]['quantity'],
        'total': maps[i]['total'],
        'synced': maps[i]['synced'] == 1,
        'createdAt': maps[i]['created_at'],
        'localId': maps[i]['local_id'],
      };
      return Sale.fromJson(saleData);
    });
  }

  Future<List<Sale>> getUnsyncedSales() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      DatabaseConstants.salesTable,
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'created_at ASC',
    );
    return List.generate(maps.length, (i) {
      // Convert database column names to camelCase
      final saleData = {
        'id': maps[i]['id'],
        'productId': maps[i]['product_id'],
        'userId': maps[i]['user_id'],
        'quantity': maps[i]['quantity'],
        'total': maps[i]['total'],
        'synced': maps[i]['synced'] == 1,
        'createdAt': maps[i]['created_at'],
        'localId': maps[i]['local_id'],
      };
      return Sale.fromJson(saleData);
    });
  }

  Future<void> markSaleAsSynced(String saleId) async {
    final db = await database;
    await db.update(
      DatabaseConstants.salesTable,
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [saleId],
    );
  }

  Future<void> deleteSale(String id) async {
    final db = await database;
    await db.delete(
      DatabaseConstants.salesTable,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Utility methods
  Future<int> getUnsyncedSalesCount() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM ${DatabaseConstants.salesTable} WHERE synced = 0',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<void> clearAllData() async {
    final db = await database;
    await db.delete(DatabaseConstants.productsTable);
    await db.delete(DatabaseConstants.salesTable);
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}