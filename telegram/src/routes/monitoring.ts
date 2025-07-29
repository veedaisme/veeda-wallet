import { Router, Request, Response } from 'express';
import { healthCheckService } from '@/utils/health-check';
import { monitoringService } from '@/utils/monitoring';
import { botSetupService } from '@/utils/bot-setup';
import { secretsManager } from '@/config/secrets';
import { config } from '@/config/environment';
import { Logger } from '@/utils/logger';

const router = Router();
const logger = new Logger('MonitoringRoutes');

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.performHealthCheck();
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * Readiness check endpoint
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.performHealthCheck();
    const isReady = healthStatus.status !== 'unhealthy' && 
                   healthStatus.checks.telegram?.status === 'pass' &&
                   healthStatus.checks.configuration?.status === 'pass';
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service is ready to accept requests',
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready',
        health: healthStatus,
      });
    }
  } catch (error) {
    logger.error('Readiness check endpoint error:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
    });
  }
});

/**
 * Metrics endpoint
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = monitoringService.getMetricsSummary();
    const healthStatus = healthCheckService.getLastHealthCheck();
    
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics,
      health: healthStatus,
    });
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Bot status endpoint
 */
router.get('/bot/status', async (req: Request, res: Response) => {
  try {
    const botStatus = await botSetupService.getBotSetupStatus();
    res.json(botStatus);
  } catch (error) {
    logger.error('Bot status endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve bot status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Bot configuration endpoint
 */
router.get('/bot/config', async (req: Request, res: Response) => {
  try {
    const validation = await botSetupService.validateBotConfiguration();
    const configSummary = secretsManager.getConfigSummary();
    
    res.json({
      validation,
      configuration: configSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Bot config endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve bot configuration',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * System information endpoint
 */
router.get('/system', (req: Request, res: Response) => {
  try {
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        pid: process.pid,
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: {
        nodeEnv: config.app.nodeEnv,
        port: config.app.port,
        logLevel: config.app.logLevel,
      },
      features: config.features,
      timestamp: new Date().toISOString(),
    };
    
    res.json(systemInfo);
  } catch (error) {
    logger.error('System info endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve system information',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Debug endpoint (development only)
 */
router.get('/debug', (req: Request, res: Response) => {
  if (config.app.nodeEnv === 'production') {
    return res.status(404).json({ error: 'Debug endpoint not available in production' });
  }

  try {
    const debugInfo = {
      environment: process.env,
      config: secretsManager.getConfigSummary(),
      metrics: monitoringService.getMetricsSummary(),
      health: healthCheckService.getLastHealthCheck(),
      timestamp: new Date().toISOString(),
    };
    
    res.json(debugInfo);
  } catch (error) {
    logger.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve debug information',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Prometheus metrics endpoint (if enabled)
 */
router.get('/metrics/prometheus', (req: Request, res: Response) => {
  try {
    const metrics = monitoringService.getMetricsSummary();
    let prometheusMetrics = '';
    
    // Convert metrics to Prometheus format
    for (const [name, data] of Object.entries(metrics)) {
      const metricName = name.replace(/\./g, '_');
      prometheusMetrics += `# HELP ${metricName} ${name}\n`;
      prometheusMetrics += `# TYPE ${metricName} gauge\n`;
      prometheusMetrics += `${metricName} ${data.latest}\n`;
    }
    
    // Add system metrics
    const memUsage = process.memoryUsage();
    prometheusMetrics += `# HELP nodejs_memory_heap_used_bytes Node.js heap used\n`;
    prometheusMetrics += `# TYPE nodejs_memory_heap_used_bytes gauge\n`;
    prometheusMetrics += `nodejs_memory_heap_used_bytes ${memUsage.heapUsed}\n`;
    
    prometheusMetrics += `# HELP nodejs_uptime_seconds Node.js uptime\n`;
    prometheusMetrics += `# TYPE nodejs_uptime_seconds gauge\n`;
    prometheusMetrics += `nodejs_uptime_seconds ${process.uptime()}\n`;
    
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Prometheus metrics endpoint error:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * Force health check endpoint
 */
router.post('/health/check', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthCheckService.performHealthCheck();
    res.json({
      message: 'Health check performed',
      result: healthStatus,
    });
  } catch (error) {
    logger.error('Force health check error:', error);
    res.status(500).json({
      error: 'Failed to perform health check',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Bot setup endpoint (POST)
 */
router.post('/bot/setup', async (req: Request, res: Response) => {
  try {
    const setupResult = await botSetupService.performCompleteSetup();
    
    const statusCode = setupResult.success ? 200 : 207; // 207 = Multi-Status
    res.status(statusCode).json(setupResult);
  } catch (error) {
    logger.error('Bot setup endpoint error:', error);
    res.status(500).json({
      error: 'Failed to perform bot setup',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;