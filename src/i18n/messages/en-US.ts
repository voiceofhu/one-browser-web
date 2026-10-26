import { authAccountMessages } from './en-US/auth-account';
import { browserMessages } from './en-US/browser';
import { commonMessages } from './en-US/common';
import { errorMessages } from './en-US/errors';
import { homeMessages } from './en-US/home';
import { organizationMessages } from './en-US/organization';
import { settingsMessages } from './en-US/settings';
import type { MessageCatalog } from './types';

export const enUS = {
  ...commonMessages,
  ...errorMessages,
  ...authAccountMessages,
  ...organizationMessages,
  ...browserMessages,
  ...settingsMessages,
  ...homeMessages,
} satisfies MessageCatalog;
