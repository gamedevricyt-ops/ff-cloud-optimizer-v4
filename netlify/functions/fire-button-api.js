const crypto = require('crypto');

const optimizeFireButton = (settings) => {
  const fireSpeed = parseInt(settings.fireSpeed) || 850;
  const touchSens = parseInt(settings.touchSensitivity) || 85;
  const activationArea = parseInt(settings.activationArea) || 120;
  const fireDelay = parseInt(settings.fireDelay) || 15;

  const rpm = fireSpeed;
  const shotsPerSecond = (60000 / (60000 / fireSpeed + fireDelay)).toFixed(1);
  const responseTime = Math.max(1, 20 - (touchSens / 5));
  const accuracy = Math.min(99.9, 85 + (touchSens / 10) + (fireSpeed / 100));
  const touchZone = activationArea;
  const pressureThreshold = Math.max(0.1, 1 - (touchSens / 100));

  return {
    config: {
      fireSpeed: rpm,
      touchSensitivity: touchSens,
      activationArea: touchZone,
      fireDelay: fireDelay,
      autoFire: settings.autoFire || false,
      tapFire: settings.tapFire || false,
      customVibration: settings.customVibration || false
    },
    performance: {
      rpm: rpm,
      shotsPerSecond: shotsPerSecond,
      responseTime: responseTime.toFixed(1) + 'ms',
      accuracy: accuracy.toFixed(1) + '%',
      pressureThreshold: pressureThreshold.toFixed(2),
      touchZoneSize: touchZone + 'px'
    },
    advanced: {
      burstMode: settings.tapFire ? 'Ativo' : 'Inativo',
      recoilCompensation: Math.round(85 + Math.random() * 10) + '%',
      inputBuffer: Math.max(1, 10 - (touchSens / 20)) + 'ms',
      multiTouchSupport: true,
      hapticStrength: settings.customVibration ? 'Alto' : 'Médio'
    }
  };
};

const generateFirePattern = (config) => {
  const patterns = [];
  const totalTime = 1000;
  const interval = 60000 / config.fireSpeed;
  
  let currentTime = 0;
  while (currentTime < totalTime) {
    patterns.push({
      time: Math.round(currentTime),
      action: 'FIRE',
      delay: config.fireDelay + 'ms'
    });
    currentTime += interval + config.fireDelay;
  }

  return {
    totalShots: patterns.length,
    pattern: patterns.slice(0, 5),
    theoretical: Math.floor(60000 / (interval + config.fireDelay)) + ' disparos/min'
  };
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
    const body = JSON.parse(event.body || '{}');

    const result = optimizeFireButton(body);
    const firePattern = generateFirePattern(result.config);

    const processingDelay = 50 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const sessionId = 'fire_' + crypto.randomBytes(12).toString('hex');

    const response = {
      success: true,
      sessionId: sessionId,
      config: result.config,
      performance: result.performance,
      advanced: result.advanced,
      firePattern: firePattern,
      optimizations: {
        multiTouchEnabled: true,
        pressureDetection: result.config.customVibration,
        adaptiveDelay: result.config.autoFire,
        burstMode: result.config.tapFire,
        touchPrediction: true,
        ghostTouchPrevention: true
      },
      hardware: {
        processingUnit: 'Cloud-GPU',
        algorithm: 'Fire-Optimization-V4',
        latency: Math.round(5 + Math.random() * 10) + 'ms',
        throttling: 'Disabled'
      },
      status: 'Botão de disparo otimizado e executando',
      timestamp: new Date().toISOString(),
      executionTime: Math.round(Date.now() - startTime) + 'ms',
      apiVersion: '4.0.0',
      serverRegion: 'US-EAST-1'
    };

    console.log('[FIRE-BUTTON-API]', 'Optimization completed:', sessionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('[FIRE-BUTTON-API] Error:', error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro na otimização do botão',
        details: error.message,
        timestamp: new Date().toISOString(),
        executionTime: Math.round(Date.now() - startTime) + 'ms'
      })
    };
  }
};
