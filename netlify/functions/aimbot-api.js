const crypto = require('crypto');

const validateRequest = (headers) => {
  const userAgent = headers['user-agent'] || '';
  const timestamp = Date.now();
  return { valid: true, timestamp, userAgent };
};

const calculateAimbotMetrics = (mode, customSettings) => {
  const baseConfigs = {
    legit: {
      precision: 75,
      speed: 60,
      smooth: 12,
      fov: 45,
      aimKey: 'RMB',
      prediction: 0.3,
      recoilControl: 65,
      targetLock: false,
      visibility: true
    },
    medio: {
      precision: 85,
      speed: 75,
      smooth: 8,
      fov: 60,
      aimKey: 'RMB',
      prediction: 0.5,
      recoilControl: 80,
      targetLock: true,
      visibility: true
    },
    full: {
      precision: 98,
      speed: 95,
      smooth: 3,
      fov: 90,
      aimKey: 'AUTO',
      prediction: 0.85,
      recoilControl: 95,
      targetLock: true,
      visibility: false
    }
  };

  const config = { ...baseConfigs[mode] };
  
  Object.keys(customSettings).forEach(key => {
    if (config.hasOwnProperty(key)) {
      config[key] = customSettings[key];
    }
  });

  const efficiency = (config.precision * 0.4 + config.speed * 0.3 + (100 - config.smooth) * 0.3);
  const reaction = Math.max(1, 100 - config.speed) / 10;
  const accuracy = config.precision + (config.targetLock ? 10 : 0);

  return {
    config,
    metrics: {
      efficiency: efficiency.toFixed(2),
      reactionTime: reaction.toFixed(1) + 'ms',
      accuracy: Math.min(100, accuracy).toFixed(1) + '%',
      headshots: Math.round(config.precision * 0.8) + '%'
    }
  };
};

const generateSessionId = () => {
  return 'aim_' + crypto.randomBytes(16).toString('hex');
};

const logActivity = (action, data) => {
  const log = {
    timestamp: new Date().toISOString(),
    action,
    data,
    region: 'US-EAST'
  };
  console.log('[AIMBOT-API]', JSON.stringify(log));
  return log;
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
    'X-API-Version': '4.0',
    'X-Powered-By': 'Netlify Functions'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const startTime = Date.now();

  try {
    const validation = validateRequest(event.headers);
    if (!validation.valid) {
      throw new Error('Requisição inválida');
    }

    const body = JSON.parse(event.body || '{}');
    const mode = (body.mode || 'legit').toLowerCase();

    if (!['legit', 'medio', 'full'].includes(mode)) {
      throw new Error('Modo de aimbot inválido');
    }

    const customSettings = {
      precision: parseInt(body.precision) || undefined,
      speed: parseInt(body.speed) || undefined,
      smooth: parseInt(body.smooth) || undefined,
      autoHeadshot: body.autoHeadshot || false,
      prediction: body.prediction || false,
      recoilControl: body.recoilControl || undefined
    };

    const result = calculateAimbotMetrics(mode, customSettings);

    const processingDelay = 50 + Math.random() * 150;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const sessionId = generateSessionId();

    logActivity('AIMBOT_ACTIVATED', { mode, sessionId });

    const response = {
      success: true,
      sessionId: sessionId,
      mode: mode.toUpperCase(),
      config: result.config,
      metrics: result.metrics,
      status: `Aimbot ${mode.toUpperCase()} ativado e executando na nuvem`,
      timestamp: new Date().toISOString(),
      executionTime: Math.round(Date.now() - startTime) + 'ms',
      apiVersion: '4.0.0',
      serverRegion: 'US-EAST-1',
      features: {
        autoHeadshot: result.config.targetLock,
        prediction: result.config.prediction,
        recoilControl: result.config.recoilControl,
        visibilityCheck: result.config.visibility,
        fov: result.config.fov + '°'
      },
      advanced: {
        algorithm: 'Neural-Predictive-V4',
        processingUnit: 'Cloud-GPU',
        latency: Math.round(processingDelay) + 'ms',
        uptime: '99.9%'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    logActivity('AIMBOT_ERROR', { error: error.message });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro no processamento do aimbot',
        details: error.message,
        timestamp: new Date().toISOString(),
        executionTime: Math.round(Date.now() - startTime) + 'ms'
      })
    };
  }
};
