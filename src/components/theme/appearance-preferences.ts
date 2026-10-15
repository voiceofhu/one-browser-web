export const APPEARANCE_RADIUS_OPTIONS = [
  '0',
  '0.25',
  '0.5',
  '0.75',
  '1',
] as const;

export const APPEARANCE_FONT_SIZE_OPTIONS = [
  'default',
  'sm',
  'md',
  'lg',
] as const;

export const CONTENT_LAYOUT_OPTIONS = ['full', 'centered'] as const;

export type AppearanceRadius = (typeof APPEARANCE_RADIUS_OPTIONS)[number];
export type AppearanceFontSize = (typeof APPEARANCE_FONT_SIZE_OPTIONS)[number];
export type ContentLayout = (typeof CONTENT_LAYOUT_OPTIONS)[number];

export type AppearancePreferences = {
  radius: AppearanceRadius;
  fontSize: AppearanceFontSize;
  contentLayout: ContentLayout;
};

export const DEFAULT_APPEARANCE_PREFERENCES = {
  radius: '0.25',
  fontSize: 'default',
  contentLayout: 'full',
} as const satisfies AppearancePreferences;

export const APPEARANCE_PREFERENCE_STORAGE_KEYS = {
  radius: 'one-browser.ui-radius',
  fontSize: 'one-browser.ui-font-size',
  contentLayout: 'one-browser.content-layout',
} as const;

export const APPEARANCE_PREFERENCE_DATA_ATTRIBUTES = {
  radius: 'data-ui-radius',
  fontSize: 'data-ui-font-size',
  contentLayout: 'data-content-layout',
} as const;

export const APPEARANCE_PREFERENCES_CHANGE_EVENT =
  'one-browser:appearance-preferences-change';

const appearanceRadii = new Set<string>(APPEARANCE_RADIUS_OPTIONS);
const appearanceFontSizes = new Set<string>(APPEARANCE_FONT_SIZE_OPTIONS);
const contentLayouts = new Set<string>(CONTENT_LAYOUT_OPTIONS);

export function isAppearanceRadius(value: unknown): value is AppearanceRadius {
  return typeof value === 'string' && appearanceRadii.has(value);
}

export function isAppearanceFontSize(
  value: unknown,
): value is AppearanceFontSize {
  return typeof value === 'string' && appearanceFontSizes.has(value);
}

export function isContentLayout(value: unknown): value is ContentLayout {
  return typeof value === 'string' && contentLayouts.has(value);
}
