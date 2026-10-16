export function routerStore(client) {
  return {
    async loadPending(limit) {
      const { data, error } = await client.from('watch_decision')
        .select('*, watch_item(story_id)').eq('shadow', true).is('action_ref', null)
        .order('decided_at').limit(limit);
      if (error) throw error;
      const storyIds = [...new Set((data ?? []).map((row) => row.watch_item?.story_id).filter(Boolean))];
      if (storyIds.length === 0) return { decisions: data ?? [], timelines: new Map() };
      const timelineResult = await client.from('story_timeline').select('*').in('story_id', storyIds);
      if (timelineResult.error) throw timelineResult.error;
      return { decisions: data ?? [], timelines: new Map((timelineResult.data ?? [])
        .map((timeline) => [timeline.story_id, timeline])) };
    },

    async record(decisionId, actionRef) {
      const { data, error } = await client.from('watch_decision')
        .update({ action_ref: actionRef })
        .eq('id', decisionId).is('action_ref', null).select('id');
      if (error) throw error;
      return (data ?? []).length === 1;
    },
  };
}
