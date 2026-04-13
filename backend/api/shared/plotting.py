import base64
import io
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

def figure_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor='white')
    buf.seek(0)
    image = base64.b64encode(buf.getvalue()).decode('utf-8')
    plt.close(fig)
    return image

def add_phase_boxes_to_figure(fig, qc):
    ax = fig.axes[0]
    x_min, x_max = ax.get_xlim()
    y_min, y_max = ax.get_ylim()
    total_width = x_max - x_min
    total_height = y_max - y_min
    barrier_indices = [idx for idx, item in enumerate(qc.data) if item.operation.name == 'barrier']
    phases = [('1', 'Inisialisasi', '#3B82F6'), ('2', 'Persiapan', '#10B981'), ('3', 'Oracle', '#F59E0B'), ('4', 'Interferensi', '#8B5CF6'), ('5', 'Measurement', '#EF4444')]
    if len(barrier_indices) >= 2:
        b1, b2 = barrier_indices[0], barrier_indices[1]
        section0 = list(range(0, b1))
        section1 = list(range(b1 + 1, b2))
        section2 = list(range(b2 + 1, len(qc.data)))
    else:
        n = len(qc.data)
        section0 = list(range(0, max(1, n // 5)))
        section1 = list(range(max(1, n // 5), max(2, 2 * n // 5)))
        section2 = list(range(max(2, 2 * n // 5), n))
    init_indices = section0[:1] if section0 else []
    prep_indices = section0[1:] if len(section0) > 1 else []
    interference_indices = [idx for idx in section2 if qc.data[idx].operation.name != 'measure']
    measure_indices = [idx for idx in section2 if qc.data[idx].operation.name == 'measure']
    phase_indices = [init_indices, prep_indices, section1, interference_indices, measure_indices]
    active = [(phases[i][0], phases[i][1], phases[i][2], phase_indices[i]) for i in range(len(phase_indices)) if phase_indices[i] or i == 2]
    total_weight = sum(len(indices) if indices else 0.5 for _, _, _, indices in active)
    barrier_weight = len(barrier_indices) * 0.3
    total_weight += barrier_weight
    current_x = x_min
    for idx, (num, label, color, _) in enumerate(active):
        weight = len(active[idx][3]) if active[idx][3] else 0.5
        phase_width = (weight / total_weight) * total_width * (total_width / (total_width + barrier_weight))
        rect = Rectangle((current_x, y_min), phase_width, total_height, linewidth=2, edgecolor=color, facecolor=color, alpha=0.08, zorder=0)
        ax.add_patch(rect)
        ax.axvline(x=current_x, color=color, linewidth=1.5, alpha=0.6, zorder=1)
        ax.text(current_x + phase_width/2, y_max + total_height*0.05, f'{num}. {label}', ha='center', va='bottom', fontsize=9, fontweight='bold', color=color)
        current_x += phase_width
        if idx < len(active) - 1:
            barrier_width = (0.3 / total_weight) * total_width
            ax.axvline(x=current_x, color='#6B7280', linewidth=1, linestyle='--', alpha=0.4, zorder=1)
            current_x += barrier_width
    ax.axvline(x=current_x, color='#6B7280', linewidth=1.5, alpha=0.6, zorder=1)
    ax.set_ylim(y_min, y_max + total_height * 0.2)
    fig.tight_layout(pad=1.5)
    return fig
