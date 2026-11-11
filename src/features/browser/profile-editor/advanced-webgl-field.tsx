import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMemo } from 'react';

import {
  type WebglRendererOption,
  type WebglVendorOption,
  explicitWebglValue,
  offRealManualRandomOptions,
  preferredWebglVendor,
  randomItem,
  resolveWebglSystem,
  selectedWebglRenderer,
  selectedWebglVendor,
  webglRenderersForVendor,
  webglVendorsForSystem,
} from './advanced-options';
import { CompactTabs, EditorFieldRow } from './editor-controls';
import type {
  ProfileEditorForm,
  SystemFingerprintDefaults,
  UpdateProfileEditorField,
} from './types';

export function WebglInfoField({
  defaults,
  form,
  updateField,
}: {
  defaults: SystemFingerprintDefaults;
  form: ProfileEditorForm;
  updateField: UpdateProfileEditorField;
}) {
  const mode = form.webglMode || 'real';
  const system = resolveWebglSystem(form.system || defaults.system);
  const vendors = useMemo(
    () => webglVendorsForSystem(system, form.webglVendor),
    [form.webglVendor, system],
  );
  const selectedVendor = selectedWebglVendor(
    vendors,
    form.webglVendor || preferredWebglVendor(system),
  );
  const renderers = useMemo(
    () => webglRenderersForVendor(selectedVendor, form.webglRenderer),
    [form.webglRenderer, selectedVendor],
  );
  const selectedRenderer = selectedWebglRenderer(
    renderers,
    form.webglRenderer || selectedVendor.renderers[0],
  );

  function applyWebgl(
    vendor: WebglVendorOption,
    renderer: WebglRendererOption,
  ) {
    updateField('webglVendor', vendor.value);
    updateField('webglRenderer', renderer.value);
  }

  function applyVendor(vendor: WebglVendorOption | null) {
    if (!vendor) return;
    const renderer = webglRenderersForVendor(vendor, '')[0];
    applyWebgl(vendor, renderer);
  }

  function randomizeWebgl() {
    const defaultSystem = resolveWebglSystem(defaults.system);
    const defaultVendor = explicitWebglValue(defaults.webglVendor)
      ? selectedWebglVendor(
          webglVendorsForSystem(defaultSystem, defaults.webglVendor),
          defaults.webglVendor,
        )
      : null;

    if (defaultVendor && explicitWebglValue(defaults.webglRenderer)) {
      const defaultRenderer = selectedWebglRenderer(
        webglRenderersForVendor(defaultVendor, defaults.webglRenderer),
        defaults.webglRenderer,
      );
      updateField('webglMode', 'random');
      applyWebgl(defaultVendor, defaultRenderer);
      return;
    }

    const candidateVendors = webglVendorsForSystem(defaultSystem, '');
    const nextVendor = randomItem(candidateVendors);
    const nextRenderer = randomItem(webglRenderersForVendor(nextVendor, ''));
    updateField('webglMode', 'random');
    applyWebgl(nextVendor, nextRenderer);
  }

  function applyMode(value: string) {
    if (!value) return;
    updateField('webglMode', value);
    if (value === 'off' || value === 'real') {
      updateField('webglVendor', '');
      updateField('webglRenderer', '');
      return;
    }
    if (value === 'random') {
      randomizeWebgl();
      return;
    }
    applyWebgl(selectedVendor, selectedRenderer);
  }

  return (
    <EditorFieldRow label="WebGL 信息" controlClassName="flex flex-col gap-2">
      <CompactTabs
        value={mode}
        onValueChange={applyMode}
        options={offRealManualRandomOptions}
      />

      {mode === 'manual' ? (
        <div className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Field>
            <FieldLabel>厂商</FieldLabel>
            <Combobox
              items={vendors}
              value={selectedVendor}
              isItemEqualToValue={(item, value) => item.value === value.value}
              itemToStringLabel={(option: WebglVendorOption) => option.label}
              itemToStringValue={(option: WebglVendorOption) => option.value}
              onValueChange={(option: WebglVendorOption | null) =>
                applyVendor(option)
              }
            >
              <ComboboxInput
                id="profile-editor-webgl-vendor"
                placeholder="选择厂商"
                className="w-full"
              >
                <InputGroupAddon align="inline-start">
                  <WebglVendorIcon vendor={selectedVendor} />
                </InputGroupAddon>
              </ComboboxInput>
              <ComboboxContent>
                <ComboboxEmpty>没有匹配的厂商</ComboboxEmpty>
                <ComboboxList>
                  {(option: WebglVendorOption) => (
                    <ComboboxItem key={option.value} value={option}>
                      <WebglVendorIcon vendor={option} />
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel>渲染器</FieldLabel>
            <Combobox
              items={renderers}
              value={selectedRenderer}
              isItemEqualToValue={(item, value) => item.value === value.value}
              itemToStringLabel={(option: WebglRendererOption) => option.label}
              itemToStringValue={(option: WebglRendererOption) => option.value}
              onValueChange={(option: WebglRendererOption | null) => {
                if (option) updateField('webglRenderer', option.value);
              }}
            >
              <ComboboxInput
                id="profile-editor-webgl-renderer"
                placeholder="选择渲染器"
                className="w-full"
              />
              <ComboboxContent>
                <ComboboxEmpty>没有匹配的渲染器</ComboboxEmpty>
                <ComboboxList>
                  {(option: WebglRendererOption) => (
                    <ComboboxItem key={option.value} value={option}>
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>
        </div>
      ) : null}

      {mode === 'random' ? (
        <div className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Field>
            <FieldLabel>厂商</FieldLabel>
            <InputGroup className="h-9">
              <InputGroupAddon align="inline-start">
                <WebglVendorIcon vendor={selectedVendor} />
              </InputGroupAddon>
              <InputGroupInput readOnly value={selectedVendor.label} />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-sm"
                  aria-label="随机生成 WebGL 厂商"
                  onClick={randomizeWebgl}
                >
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>渲染器</FieldLabel>
            <InputGroup className="h-9">
              <InputGroupInput readOnly value={selectedRenderer.label} />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-sm"
                  aria-label="随机生成 WebGL 渲染器"
                  onClick={randomizeWebgl}
                >
                  <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      ) : null}
    </EditorFieldRow>
  );
}

function WebglVendorIcon({ vendor }: { vendor: WebglVendorOption }) {
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${vendor.iconUrl})` }}
    />
  );
}
