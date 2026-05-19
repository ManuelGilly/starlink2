class ApiEndpoints {
  static const String baseUrl = 'https://starlink2.vercel.app';

  // Auth mobile
  static const String authStep1 = '/api/mobile/auth/step1';
  static const String authStep2 = '/api/mobile/auth/step2';

  // Dashboard
  static const String dashboard = '/api/mobile/dashboard';

  // Cobros
  static const String cobros = '/api/mobile/cobros';

  // Clientes
  static const String clients = '/api/clientes';
  static String clientById(String id) => '/api/clientes/$id';
  static String clientSubscriptions(String id) => '/api/clientes/$id/subscripciones';

  // Planes
  static const String plans = '/api/planes';

  // Pagos
  static const String payments = '/api/pagos';
  static String paymentById(String id) => '/api/pagos/$id';

  // Solicitudes de activación
  static const String planRequests = '/api/solicitudes-activacion';
  static String planRequestById(String id) => '/api/solicitudes-activacion/$id';
}
