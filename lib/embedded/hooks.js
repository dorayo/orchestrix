'use strict';

// Embedded settings.local.json template for Claude Code Stop hooks

const SETTINGS_LOCAL_TEMPLATE = {
  hooks: {
    Stop: [
      {
        matcher: '',
        hooks: [
          {
            type: 'command',
            command: "bash -c 'cd \"$(git rev-parse --show-toplevel)\" && .orchestrix-core/scripts/handoff-detector.sh'",
          },
        ],
      },
    ],
  },
};

module.exports = { SETTINGS_LOCAL_TEMPLATE };
