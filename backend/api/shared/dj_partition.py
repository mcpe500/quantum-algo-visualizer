def partition_stage_groups(stages):
    """Group stage sequence into contiguous partitions by phase."""
    ordered = ['pre-init', 'init', 'prep', 'oracle', 'interference', 'measure']
    grouped = {phase: [] for phase in ordered}
    for stage in stages:
        phase = stage.get('phase', 'oracle')
        if phase not in grouped:
            grouped[phase] = []
        grouped[phase].append(stage)
    partitions = []
    start_col = 1
    for phase in ordered:
        items = grouped.get(phase, [])
        if not items:
            continue
        span = len(items)
        end_col = start_col + span - 1
        partitions.append({
            'phase': phase,
            'label': phase.title(),
            'count': span,
            'start_col': start_col,
            'end_col': end_col,
        })
        start_col = end_col + 1
    return partitions
