import { Badge } from '@/components/ui/badge';
import type {
  OpenProfileProgressPayload,
  OpenProfileProgressStep,
  ProfileListItem,
} from '@/features/browser/contracts';
import { cn } from '@/lib/utils';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from '@/components/ui/toast';

import { BrowserDataTable } from '../../components/data-table';
import { ProfileEditor } from '../../profile-editor';
import { useProxiesQuery } from '../../proxies/queries';
import { useProfileOpenProgressEvents } from '../../runtime/events';
import {
  toastBrowserOpenError,
  toastBrowserOpenFailure,
  toastBrowserOpenPreflight,
  toastBrowserOpenSuccess,
} from '../../runtime/open-progress-toast';
import {
  useCloseProfileMutation,
  useOpenProfileMutation,
} from '../../runtime/queries';
import {
  isNetworkUnavailable,
  networkUnavailableMessage,
} from '../../status/network-guard';
import { useAppStatusQuery } from '../../status/queries';
import { normalizeProfileGroup } from '../group-utils';
import { useProfileColumns } from '../hooks/use-profile-columns';
import {
  useDeleteProfilesMutation,
  useDuplicateProfileMutation,
  useProfilesQuery,
  useUpdateProfileProxyMutation,
} from '../hooks/use-profile-queries';
import {
  type DeleteTarget,
  buildGroupFilters,
  groupFilterAll,
  groupFilterUngrouped,
  isProfileListItem,
  launchDisabledTitle,
} from '../model/profile-list';
import { ProfileProxySwitchDialog } from '../profile-proxy-switch-dialog';
import {
  DeleteProfilesConfirmDialog,
  ProfileBulkActions,
} from './profile-table-parts';
import { ProfilesPageHeader } from './profiles-page-header';

export function ProfilesPageContent({ search }: { search: string }) {
  const profilesQuery = useProfilesQuery();
  const deleteProfilesMutation = useDeleteProfilesMutation();
  const duplicateProfileMutation = useDuplicateProfileMutation();
  const updateProfileProxyMutation = useUpdateProfileProxyMutation();
  const openProfileMutation = useOpenProfileMutation();
  const closeProfileMutation = useCloseProfileMutation();
  const {
    data: appStatus,
    isError: appStatusError,
    isFetching: appStatusFetching,
    isLoading: appStatusLoading,
    refetch: refetchAppStatus,
  } = useAppStatusQuery();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [checkingChromiumProfileId, setCheckingChromiumProfileId] = useState<
    string | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [bulkOpeningIds, setBulkOpeningIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [switchingProxyProfile, setSwitchingProxyProfile] =
    useState<ProfileListItem | null>(null);
  const [groupFilter, setGroupFilter] = useState(groupFilterAll);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openProgressByProfileId, setOpenProgressByProfileId] = useState<
    Record<string, OpenProfileProgressStep>
  >({});
  const proxiesQuery = useProxiesQuery(
    undefined,
    Boolean(switchingProxyProfile),
  );
  const profiles = useMemo(
    () => profilesQuery.data?.list ?? [],
    [profilesQuery.data?.list],
  );
  const groupFilters = useMemo(() => buildGroupFilters(profiles), [profiles]);
  const profileGroupOptions = useMemo(
    () =>
      groupFilters
        .filter((group) => group.value !== groupFilterUngrouped)
        .map((group) => group.value),
    [groupFilters],
  );
  const filteredProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      const profileGroup = normalizeProfileGroup(profile.groupId);
      const matchesGroup =
        groupFilter === groupFilterAll ||
        (groupFilter === groupFilterUngrouped && !profileGroup) ||
        profileGroup === groupFilter;
      if (!matchesGroup) return false;
      if (!keyword) return true;
      return [
        profile.profileId,
        profile.profileNo,
        profile.name,
        profile.pid,
        profile.groupId,
        profileGroup,
        profile.proxySummary,
        profile.proxyUrl,
        profile.proxyExitIp,
        profile.proxyCountryCode,
        profile.proxyCountry,
        ...profile.tags,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [groupFilter, profiles, search]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const profileById = useMemo(
    () =>
      new Map(profiles.map((profile) => [profile.profileId, profile] as const)),
    [profiles],
  );
  const selectedProfiles = useMemo(
    () =>
      selectedIds
        .map((profileId) => profileById.get(profileId))
        .filter(isProfileListItem),
    [profileById, selectedIds],
  );
  const selectedOpenableProfiles = useMemo(
    () => selectedProfiles.filter((profile) => profile.status === 'inactive'),
    [selectedProfiles],
  );
  const selectedHasRunningProfiles = selectedProfiles.some(
    (profile) => profile.status !== 'inactive',
  );
  const visibleIds = useMemo(
    () => filteredProfiles.map((profile) => profile.profileId),
    [filteredProfiles],
  );
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((profileId) => selectedIdSet.has(profileId));
  const someVisibleSelected = visibleIds.some((profileId) =>
    selectedIdSet.has(profileId),
  );
  const chromiumReady = Boolean(appStatus?.chromiumPath.executable);
  const networkAvailable = !isNetworkUnavailable(appStatus);
  const chromiumStatusChecking = appStatusLoading || appStatusFetching;
  const canLaunchProfile =
    chromiumReady && networkAvailable && !chromiumStatusChecking;
  const isBulkOpening = bulkOpeningIds.size > 0;

  const openProfileEditor = useCallback((profileId: string | null) => {
    setEditingProfileId(profileId);
    setEditorOpen(true);
  }, []);
  const setProfileOpenProgress = useCallback(
    (profileId: string, step: OpenProfileProgressStep) => {
      setOpenProgressByProfileId((current) => ({
        ...current,
        [profileId]: step,
      }));
    },
    [],
  );
  const clearProfileOpenProgress = useCallback((profileId: string) => {
    setOpenProgressByProfileId((current) => {
      if (!current[profileId]) return current;
      const next = { ...current };
      delete next[profileId];
      return next;
    });
  }, []);
  useProfileOpenProgressEvents(
    useCallback(
      (payload: OpenProfileProgressPayload) => {
        setProfileOpenProgress(payload.profileId, payload.step);
      },
      [setProfileOpenProgress],
    ),
  );

  const toggleVisibleProfiles = useCallback(
    (checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        visibleIds.forEach((profileId) => {
          if (checked) next.add(profileId);
          else next.delete(profileId);
        });
        return [...next];
      });
    },
    [visibleIds],
  );
  const toggleProfile = useCallback((profileId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(profileId);
      else next.delete(profileId);
      return [...next];
    });
  }, []);
  const confirmDeleteProfiles = useCallback(
    (profileIds: string[]) => {
      if (!profileIds.length) return;
      deleteProfilesMutation.mutate(
        { profileIds, purgeData: false },
        {
          onSuccess: (result) => {
            const deletedIds = new Set(result.deleted);
            setSelectedIds((current) =>
              current.filter((profileId) => !deletedIds.has(profileId)),
            );
            setDeleteTarget(null);
            toast.success(`已删除 ${result.deleted.length} 个环境`);
          },
        },
      );
    },
    [deleteProfilesMutation],
  );
  const openProfileAfterChromiumCheck = useCallback(
    async (profile: ProfileListItem) => {
      setCheckingChromiumProfileId(profile.profileId);
      toastBrowserOpenPreflight(5);
      try {
        const statusResult = await refetchAppStatus();
        if (statusResult.error) {
          toastBrowserOpenError(statusResult.error);
          return;
        }
        if (isNetworkUnavailable(statusResult.data)) {
          toastBrowserOpenFailure(networkUnavailableMessage);
          return;
        }
        if (!statusResult.data?.chromiumPath.executable) {
          toastBrowserOpenFailure('请先等待浏览器下载完成');
          return;
        }
        setProfileOpenProgress(profile.profileId, 'checking_proxy');
        openProfileMutation.mutate(
          { profileId: profile.profileId },
          { onSettled: () => clearProfileOpenProgress(profile.profileId) },
        );
      } finally {
        setCheckingChromiumProfileId((current) =>
          current === profile.profileId ? null : current,
        );
      }
    },
    [
      clearProfileOpenProgress,
      openProfileMutation,
      refetchAppStatus,
      setProfileOpenProgress,
    ],
  );
  const openSelectedProfiles = useCallback(async () => {
    if (!selectedOpenableProfiles.length || isBulkOpening) return;
    const targets = [...selectedOpenableProfiles];
    setBulkOpeningIds(new Set(targets.map((profile) => profile.profileId)));
    toastBrowserOpenPreflight(5);
    try {
      const statusResult = await refetchAppStatus();
      if (statusResult.error) {
        toastBrowserOpenError(statusResult.error);
        return;
      }
      if (isNetworkUnavailable(statusResult.data)) {
        toastBrowserOpenFailure(networkUnavailableMessage);
        return;
      }
      if (!statusResult.data?.chromiumPath.executable) {
        toastBrowserOpenFailure('请先等待浏览器下载完成');
        return;
      }
      let openedCount = 0;
      for (const profile of targets) {
        setProfileOpenProgress(profile.profileId, 'checking_proxy');
        try {
          await openProfileMutation.mutateAsync({
            profileId: profile.profileId,
          });
          openedCount += 1;
        } catch {
          // Mutation owns cache rollback and error feedback.
        } finally {
          clearProfileOpenProgress(profile.profileId);
          setBulkOpeningIds((current) => {
            const next = new Set(current);
            next.delete(profile.profileId);
            return next;
          });
        }
      }
      if (openedCount > 0) {
        toastBrowserOpenSuccess(`已打开 ${openedCount} 个环境`);
      }
    } finally {
      setBulkOpeningIds(new Set());
    }
  }, [
    clearProfileOpenProgress,
    isBulkOpening,
    openProfileMutation,
    refetchAppStatus,
    selectedOpenableProfiles,
    setProfileOpenProgress,
  ]);

  const columns = useProfileColumns({
    allVisibleSelected,
    appStatusError,
    bulkOpeningIds,
    canLaunchProfile,
    checkingChromiumProfileId,
    chromiumReady,
    chromiumStatusChecking,
    isBulkOpening,
    isClosePending: closeProfileMutation.isPending,
    isDeletePending: deleteProfilesMutation.isPending,
    isDuplicatePending: duplicateProfileMutation.isPending,
    isOpenPending: openProfileMutation.isPending,
    networkAvailable,
    onClose: (profileId) => closeProfileMutation.mutate({ profileId }),
    onDelete: (profileId) => setDeleteTarget({ profileIds: [profileId] }),
    onDuplicate: (profileId) => duplicateProfileMutation.mutate(profileId),
    onEdit: openProfileEditor,
    onOpen: (profile) => void openProfileAfterChromiumCheck(profile),
    onSwitchProxy: setSwitchingProxyProfile,
    openProgressByProfileId,
    selectedIdSet,
    someVisibleSelected,
    toggleProfile,
    toggleVisibleProfiles,
  });

  return (
    <section className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden">
      <ProfilesPageHeader
        onCreate={() => openProfileEditor(null)}
        isRefreshing={profilesQuery.isFetching}
        onRefresh={profilesQuery.refetch}
      />
      {groupFilters.length ? (
        <div className="border-border/60 flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
          <span className="text-muted-foreground text-xs">分组</span>
          {groupFilters.map((group) => (
            <Badge
              key={group.value}
              asChild
              variant={groupFilter === group.value ? 'default' : 'outline'}
              className={cn('cursor-pointer', !group.count && 'hidden')}
            >
              <button
                type="button"
                onClick={() =>
                  setGroupFilter(
                    groupFilter === group.value ? groupFilterAll : group.value,
                  )
                }
              >
                {group.label}
                <span className="text-[0.625rem] opacity-70">
                  {group.count}
                </span>
                {groupFilter === group.value ? (
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    data-icon="inline-end"
                  />
                ) : null}
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        <BrowserDataTable
          columns={columns}
          data={filteredProfiles}
          emptyTitle="暂无环境"
          emptyDescription="先创建环境，再打开隔离浏览器窗口。"
          getRowId={(profile) => profile.profileId}
          isLoading={profilesQuery.isLoading}
        />
      </div>
      {selectedProfiles.length ? (
        <ProfileBulkActions
          selectedCount={selectedProfiles.length}
          openableCount={selectedOpenableProfiles.length}
          deleteCount={selectedProfiles.length}
          isDeleting={deleteProfilesMutation.isPending}
          isOpening={isBulkOpening}
          openDisabled={
            !selectedOpenableProfiles.length ||
            isBulkOpening ||
            openProfileMutation.isPending ||
            closeProfileMutation.isPending ||
            checkingChromiumProfileId !== null ||
            !canLaunchProfile
          }
          openDisabledTitle={
            selectedOpenableProfiles.length
              ? launchDisabledTitle(
                  appStatusError,
                  chromiumReady,
                  chromiumStatusChecking,
                  networkAvailable,
                )
              : '选中的环境都已启动'
          }
          deleteDisabled={selectedHasRunningProfiles}
          deleteDisabledTitle={
            selectedHasRunningProfiles
              ? '选中项包含已启动或启动中的环境，请先关闭后再删除'
              : undefined
          }
          onClear={() => setSelectedIds([])}
          onOpen={() => void openSelectedProfiles()}
          onDelete={() => {
            if (!selectedHasRunningProfiles && selectedProfiles.length) {
              setDeleteTarget({
                profileIds: selectedProfiles.map(
                  (profile) => profile.profileId,
                ),
              });
            }
          }}
        />
      ) : null}
      {deleteTarget ? (
        <DeleteProfilesConfirmDialog
          profileIds={deleteTarget.profileIds}
          isDeleting={deleteProfilesMutation.isPending}
          onOpenChange={(open) => {
            if (!open && !deleteProfilesMutation.isPending)
              setDeleteTarget(null);
          }}
          onConfirm={confirmDeleteProfiles}
        />
      ) : null}
      <ProfileEditor
        mode={editingProfileId ? 'edit' : 'create'}
        open={editorOpen}
        groupOptions={profileGroupOptions}
        profileId={editingProfileId}
        onOpenChange={setEditorOpen}
      />
      <ProfileProxySwitchDialog
        open={Boolean(switchingProxyProfile)}
        profile={switchingProxyProfile}
        proxies={proxiesQuery.data?.list ?? []}
        isLoading={proxiesQuery.isLoading}
        isPending={updateProfileProxyMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setSwitchingProxyProfile(null);
        }}
        onSubmit={(proxyId) => {
          if (!switchingProxyProfile) return;
          updateProfileProxyMutation.mutate(
            {
              profileId: switchingProxyProfile.profileId,
              proxyId,
              applyToRunning: switchingProxyProfile.status === 'active',
              checkExitIp: true,
            },
            { onSuccess: () => setSwitchingProxyProfile(null) },
          );
        }}
      />
    </section>
  );
}
