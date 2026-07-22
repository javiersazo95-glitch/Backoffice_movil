import React, { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as auditsApi from '@/api/audits';
import { Avatar, EmptyState, ListItemCard, LoadingState, PaginationFooter, ScreenContainer } from '@/components/shared';
import { spacing } from '@/theme';
import { formatDateTime } from '@/utils/formatters';
import { AUDIT_MODULE_LABELS } from '../utils/labels';

export function AuditListScreen() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ['trust-audits', page],
    queryFn: () => auditsApi.getAuditLogs({ page, size: 15 }),
  });

  if (isLoading) return <LoadingState />;

  return (
    <ScreenContainer>
      <FlatList
        data={data?.content ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="Sin registros" description="No hay actividad registrada en la bitácora." />}
        renderItem={({ item }) => (
          <ListItemCard
            title={item.action}
            subtitle={`${item.userFullName} · ${item.sellerName}`}
            meta={`${AUDIT_MODULE_LABELS[item.module]} · ${formatDateTime(item.createdAt)}`}
            leading={<Avatar initials={item.userInitials} size={36} />}
            showChevron={false}
          />
        )}
        ListFooterComponent={data ? <PaginationFooter page={page} totalPages={data.totalPages} onChange={setPage} /> : null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingTop: spacing.md, paddingBottom: spacing.huge },
});
