const RETRY_PATTERN = '{"routerStatus":"retryable"%';

export function routerStore(client, { includeRetries = false } = {}) {
  async function loadRows(limit) {
    if (!includeRetries) {
      return client.from('watch_decision')
        .select('*, watch_item(story_id)').eq('shadow', true).is('action_ref', null)
        .order('decided_at').limit(limit);
    }
    const retryResult = await client.from('watch_decision')
      .select('*, watch_item(story_id)').eq('shadow', true)
      .like('action_ref', RETRY_PATTERN).order('decided_at').limit(limit);
    if (retryResult.error || (retryResult.data ?? []).length === limit) return retryResult;
    const freshResult = await client.from('watch_decision')
      .select('*, watch_item(story_id)').eq('shadow', true).is('action_ref', null)
      .order('decided_at').limit(limit - (retryResult.data ?? []).length);
    return freshResult.error ? freshResult : {
      data: [...(retryResult.data ?? []), ...(freshResult.data ?? [])], error: null,
    };
  }

  return {
    async loadPending(limit) {
      const { data, error } = await loadRows(limit);
      if (error) throw error;
      const storyIds = [...new Set((data ?? []).map((row) => row.watch_item?.story_id).filter(Boolean))];
      if (storyIds.length === 0) return { decisions: data ?? [], timelines: new Map() };
      const timelineResult = await client.from('story_timeline').select('*').in('story_id', storyIds);
      if (timelineResult.error) throw timelineResult.error;
      return { decisions: data ?? [], timelines: new Map((timelineResult.data ?? [])
        .map((timeline) => [timeline.story_id, timeline])) };
    },

    async record(decisionId, actionRef, expectedRef = null) {
      let query = client.from('watch_decision').update({ action_ref: actionRef })
        .eq('id', decisionId);
      query = expectedRef === null
        ? query.is('action_ref', null)
        : query.eq('action_ref', expectedRef);
      const { data, error } = await query.select('id');
      if (error) throw error;
      return (data ?? []).length === 1;
    },

    async replace(decisionId, expectedRef, actionRef) {
      const { data, error } = await client.from('watch_decision')
        .update({ action_ref: actionRef }).eq('id', decisionId)
        .eq('action_ref', expectedRef).select('id');
      if (error) throw error;
      return (data ?? []).length === 1;
    },
  };
}
