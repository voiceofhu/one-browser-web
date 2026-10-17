import {
  APPEARANCE_FONT_SIZE_OPTIONS,
  APPEARANCE_RADIUS_OPTIONS,
  type AppearanceFontSize,
  type AppearanceRadius,
  type ContentLayout,
  DEFAULT_APPEARANCE_PREFERENCES,
  DEFAULT_THEME_COLOR,
  THEME_COLOR_OPTIONS,
  type ThemeColor,
  useAppearancePreferences,
  useThemeColor,
} from '@/components/theme';
import { ThemeModeToggle } from '@/components/theme/theme-mode-toggle';
import { AnimatedSegmentedTabs } from '@/components/ui/animated-segmented-tabs';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldGroup } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Locale, locales } from '@/i18n';
import { useI18n } from '@/i18n/provider';
import { Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { useTheme } from '@/components/theme/runtime';
import { AnimatedThemeColorPicker } from './animated-theme-color-picker';
import { SettingsDivider, SettingsGroup, SettingsRow } from './settings-group';

const FONT_SIZE_LABELS: Record<AppearanceFontSize, string> = {
  default: '默认',
  sm: '小号',
  md: '标准',
  lg: '大号',
};

const CONTENT_LAYOUT_ITEMS: Array<{
  value: ContentLayout;
  label: string;
}> = [
  { value: 'full', label: '全宽' },
  { value: 'centered', label: '居中' },
];

const RADIUS_TAB_ITEMS = APPEARANCE_RADIUS_OPTIONS.map((value) => ({
  value,
  label: value,
}));

const FONT_SIZE_TAB_ITEMS = APPEARANCE_FONT_SIZE_OPTIONS.map((value) => ({
  value,
  label: FONT_SIZE_LABELS[value],
}));

export function AppearanceSettings() {
  const { locale, setLocale } = useI18n();
  const { setTheme, theme } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();
  const {
    contentLayout,
    fontSize,
    radius,
    resetAppearancePreferences,
    setContentLayout,
    setFontSize,
    setRadius,
  } = useAppearancePreferences();
  const selectedThemeColor =
    THEME_COLOR_OPTIONS.find((option) => option.value === themeColor) ??
    THEME_COLOR_OPTIONS[0];
  const isDefaultAppearance =
    themeColor === DEFAULT_THEME_COLOR &&
    radius === DEFAULT_APPEARANCE_PREFERENCES.radius &&
    fontSize === DEFAULT_APPEARANCE_PREFERENCES.fontSize &&
    contentLayout === DEFAULT_APPEARANCE_PREFERENCES.contentLayout &&
    (theme ?? 'system') === 'system';

  function resetAppearance() {
    setThemeColor(DEFAULT_THEME_COLOR);
    resetAppearancePreferences();
    setTheme('system');
    toast.success('外观设置已恢复默认');
  }

  return (
    <div className="flex min-h-full flex-col">
      <FieldGroup className="flex-1 gap-3 pb-3">
        <SettingsGroup title="语言">
          <SettingsRow
            label="界面语言"
            description="切换后立即应用，并保存在当前客户端"
            htmlFor="interface-language"
          >
            <Select
              value={locale}
              onValueChange={(value) => setLocale(value as Locale)}
            >
              <SelectTrigger
                id="interface-language"
                className="h-7 w-full text-[12px] font-normal @md/field-group:w-36"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {locales.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="主题">
          <SettingsRow
            label="主题模式"
            description="控制界面的明暗外观"
            labelId="theme-mode-label"
          >
            <ThemeModeToggle />
          </SettingsRow>

          <SettingsDivider />

          <SettingsRow
            label="主色"
            description={selectedThemeColor.label}
            labelId="theme-color-label"
            controlClassName="@md/field-group:w-1/2 @md/field-group:justify-center"
          >
            <AnimatedThemeColorPicker
              value={themeColor}
              onValueChange={(value: ThemeColor) => setThemeColor(value)}
              labelledBy="theme-color-label"
            />
          </SettingsRow>

          <SettingsDivider />

          <SettingsRow
            label="圆角"
            description="界面元素的圆角大小"
            labelId="radius-label"
          >
            <AnimatedSegmentedTabs
              label="圆角"
              aria-labelledby="radius-label"
              options={RADIUS_TAB_ITEMS}
              value={radius}
              onValueChange={(value) => setRadius(value as AppearanceRadius)}
              listClassName="h-7 border bg-background p-0.5"
              triggerClassName="h-full min-w-8 px-2 text-xs font-normal"
              highlightClassName="bg-muted shadow-none ring-0"
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="显示">
          <SettingsRow
            label="字体大小"
            description="调整全局文字缩放"
            labelId="font-size-label"
          >
            <AnimatedSegmentedTabs
              label="字体大小"
              aria-labelledby="font-size-label"
              options={FONT_SIZE_TAB_ITEMS}
              value={fontSize}
              onValueChange={(value) =>
                setFontSize(value as AppearanceFontSize)
              }
              listClassName="h-7 border bg-background p-0.5"
              triggerClassName="h-full min-w-10 px-2 text-xs font-normal"
              highlightClassName="bg-muted shadow-none ring-0"
            />
          </SettingsRow>

          <SettingsDivider />

          <SettingsRow
            label="内容布局"
            description="主内容区域的排布方式"
            labelId="content-layout-label"
          >
            <AnimatedSegmentedTabs
              label="内容布局"
              aria-labelledby="content-layout-label"
              options={CONTENT_LAYOUT_ITEMS}
              value={contentLayout}
              onValueChange={(value) =>
                setContentLayout(value as ContentLayout)
              }
              listClassName="h-7 border bg-background p-0.5"
              triggerClassName="h-full min-w-12 px-2 text-xs font-normal"
              highlightClassName="bg-muted shadow-none ring-0"
            />
          </SettingsRow>
        </SettingsGroup>
      </FieldGroup>

      <div className="sticky bottom-0 -mx-3 -mb-3 mt-auto flex flex-wrap items-center justify-between gap-2 border-t bg-background px-3 py-2 md:-mx-4 md:px-4">
        <FieldDescription className="text-[12px] leading-relaxed font-normal">
          {isDefaultAppearance ? '当前为默认设置' : '设置已修改'}
        </FieldDescription>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-[12px] font-medium"
          disabled={isDefaultAppearance}
          onClick={resetAppearance}
        >
          <HugeiconsIcon
            icon={Refresh01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          恢复默认设置
        </Button>
      </div>
    </div>
  );
}
