// AdMob Configuration
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-8328296454735188~1515431996',
  BANNER_ID: 'ca-app-pub-8328296454735188/8531416424',
  REWARDED_ID: 'ca-app-pub-8328296454735188/8531416424',
  NATIVE_ID: 'ca-app-pub-1387617099',
  
  // Test IDs for development
  TEST_BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  TEST_REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',
  TEST_NATIVE_ID: 'ca-app-pub-3940256099942544/2247696110',
  
  // Toggle for test mode
  TEST_MODE: true,
};

export const getAdUnitId = (type: 'banner' | 'rewarded' | 'native'): string => {
  if (ADMOB_CONFIG.TEST_MODE) {
    switch (type) {
      case 'banner': return ADMOB_CONFIG.TEST_BANNER_ID;
      case 'rewarded': return ADMOB_CONFIG.TEST_REWARDED_ID;
      case 'native': return ADMOB_CONFIG.TEST_NATIVE_ID;
    }
  }
  
  switch (type) {
    case 'banner': return ADMOB_CONFIG.BANNER_ID;
    case 'rewarded': return ADMOB_CONFIG.REWARDED_ID;
    case 'native': return ADMOB_CONFIG.NATIVE_ID;
  }
};
