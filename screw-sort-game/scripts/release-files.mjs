// Runtime files only: developer tools, tests and the independent solver stay local.
export const releaseFiles = [
  'index.html',
  'styles.css',
  'return-visit.css',
  'assets/icon.svg',
  ...[
    'ads', 'analytics', 'app', 'board-view', 'collections-view', 'config', 'engine',
    'geometry', 'gestures', 'glass-art', 'i18n', 'level-data', 'levels', 'motion',
    'plate-motion', 'plate-physics', 'return-visit', 'return-visit-tracker',
    'rigid-runtime', 'sound', 'storage', 'telemetry',
  ].map(name => `js/${name}.js`),
];
