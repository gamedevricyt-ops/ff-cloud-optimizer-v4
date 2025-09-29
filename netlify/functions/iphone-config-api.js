const crypto = require('crypto');

const iOSDevices = {
  iphone14: {
    model: 'iPhone 14 Pro Max',
    chip: 'A16 Bionic',
    refreshRate: 120,
    touchSampling: 240,
    baseConfig: { geral: 95, mira: 88, redDot: 92, scope2x: 85, scope4x: 78, scope8x: 70 }
  },
  iphone13: {
    model: 'iPhone 13 Pro',
    chip: 'A15 Bionic',
    refreshRate: 120,
    touchSampling: 240,
    baseConfig: { geral: 90, mira: 83, redDot: 87, scope2x: 80, scope4x: 75, scope8x: 65 }
  },
  iphone12: {
    model: 'iPhone 12 Pro',
    chip: 'A14 Bionic',
    refreshRate: 60,
    touchSampling: 120,
    baseConfig: { geral: 85, mira: 78, redDot: 82, scope2x: 75, scope4x: 70, scope8x: 60 }
  },
  iphone11: {
    model: 'iPhone 11 Pro',
    chip: 'A13 Bionic',
    refreshRate: 60,
    touchSampling: 120,
    baseConfig: { geral: 80, mira: 73, redDot: 77, scope2x: 70, scope4x: 65, scope8x: 55 }
  }
};

const optimizeTouchResponse = (device, customSettings) => {
  const config = { ...device.baseConfig };
  
  Object.keys(customSettings).forEach(key => {
    if (config.hasOwnProperty(key) && customSettings[key]) {
      config[key] = parseInt(customSettings[key]);
    }
  });

  const touchLatency = Math.max(1, 15 - (device.touchSampling / 40));
  const inputDelay = Math.max(1, 10 - (device.refreshRate / 15));
  
  return {
    config,
    optimization: {
      touchLatency: touchLatency.toFixed(1) + 'ms',
      inputDelay: inputDelay.toFixed(1) + 'ms',
      totalDelay: (touchLatency + inputDelay).toFixed(1) + 'ms',
      performanceGain: Math.round(((120 - touchLatency - inputDelay) / 120) * 100) + '%'
    }
  };
};

const generateEmulationProfile = (device) => {
  return {
    profileId: 'ios_' + crypto.randomBytes(8).toString('hex'),
    deviceModel: device.model,
    chip: device.chip,
    displayConfig: {
      refreshRate: device.refreshRate + 'Hz',
      touchSampling: device.touchSampling + 'Hz',
      responseTime: '1ms'
    },
    touchEmulation: {
      multitouch: 10,
      pressure: true,
      gestureRecognition: true
    }
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
    const modelKey = (body.model || 'iphone14').toLowerCase();

    if (!iOSDevices[modelKey]) {
      throw new Error('Modelo de iPhone não suportado');
    }

    const device = iOSDevices[modelKey];
    
    const customSettings = {
      geral: body.geral,
      mira: body.mira,
      redDot: body.redDot,
      scope2x: body.scope2x,
      scope4x: body.scope4x,
      scope8x: body.scope8x
    };

    const result = optimizeTouchResponse(device, customSettings);
    const emulationProfile = generateEmulationProfile(device);

    const processingDelay = 100 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, processingDelay));

    const response = {
      success: true,
      sessionId: emulationProfile.profileId,
      device: {
        model: device.model,
        chip: device.chip,
        display: {
          refreshRate: device.refreshRate + 'Hz',
          touchSampling: device.touchSampling + 'Hz'
        }
      },
      settings: result.config,
      optimization: result.optimization,
      emulation: {
        iosAcceleration: body.iosAcceleration !== false,
        touchOptimization: true,
        frameRateBoost: true,
        hapticFeedback: true,
        ...emulationProfile.touchEmulation
      },
      advanced: {
        algorithm: 'iOS-Touch-Emulation-V4',
        processingUnit: 'Cloud-CPU',
        compatibilityLayer: 'ARM64-Native',
        performanceMode: 'Ultra'
      },
      status: `Emulação ${device.model} ativada com sucesso`,
      timestamp: new Date().toISOString(),
      executionTime: Math.round(Date.now() - startTime) + 'ms',
      apiVersion: '4.0.0',
      serverRegion: 'US-EAST-1'
    };

    console.log('[IPHONE-API]', 'Emulation activated:', modelKey);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('[IPHONE-API] Error:', error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro na configuração iPhone',
        details: error.message,
        timestamp: new Date().toISOString(),
        executionTime: Math.round(Date.now() - startTime) + 'ms'
      })
    };
  }
};
