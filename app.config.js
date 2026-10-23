module.exports = ({ config }) => {
  // 테스트 전용 빌드만 별도의 API 서버를 사용합니다.
  const apiOrigin = process.env.GENTALK_API_ORIGIN;
  if (!apiOrigin) return config;

  const parsedOrigin = new URL(apiOrigin);
  if (parsedOrigin.protocol !== 'https:' || parsedOrigin.origin !== apiOrigin) {
    throw new Error('GENTALK_API_ORIGIN must be an HTTPS origin without a trailing slash.');
  }

  return {
    ...config,
    plugins: config.plugins.map((plugin) => {
      const [name, options] = Array.isArray(plugin) ? plugin : [plugin, {}];
      return name === 'expo-router' ? [name, { ...options, origin: apiOrigin }] : plugin;
    }),
  };
};
