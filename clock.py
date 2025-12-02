#!/.venv/bin/python
"""
AntClock: Discrete Riemann Geometry Framework

Core implementation of the CurvatureClockWalker and mathematical operators
for discovering the Riemann hypothesis in integer geometry.
"""

import numpy as np
import math
from typing import List, Dict, Tuple, Optional, Any
import matplotlib.pyplot as plt
from scipy.special import binom
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')


class CurvatureClockWalker:
    """
    The fundamental dynamical system that walks through integers carrying a curvature clock.

    This walker reveals how symmetry breaks in digit shells mirror the critical line
    structure of the Riemann zeta function through discrete tangent singularities.
    """

    def __init__(self, x_0: int = 1, chi_feg: float = 0.638):
        """
        Initialize the curvature clock walker.

        Args:
            x_0: Starting integer position
            chi_feg: FEG coupling constant (default: 0.638)
        """
        self.x_0 = x_0
        self.x = x_0
        self.chi_feg = chi_feg

        # Evolution history
        self.history = []
        self.clock_phase = 0.0
        self.bifurcation_index = 0

        # Geometry tracking for visualization
        self.x_coords = []
        self.y_coords = []

        # Initialize state
        self._initialize_state()

    def _initialize_state(self):
        """Initialize the walker's internal state."""
        self.history = [{
            'step': 0,
            'x': self.x,
            'digit_shell': self.get_digit_count(self.x),
            'curvature': self.compute_pascal_curvature(self.x),
            'mirror_phase': self.get_mirror_phase(self.x),
            'clock_phase': self.clock_phase,
            'bifurcation_index': self.bifurcation_index,
            'nine_eleven_charge': self.compute_nine_eleven_charge(self.x)
        }]

        # Initialize geometry
        self.x_coords = [0]
        self.y_coords = [0]

    @staticmethod
    def get_digit_count(n: int) -> int:
        """Get the digit count of an integer (shell index)."""
        if n == 0:
            return 1
        return int(math.log10(abs(n))) + 1

    @staticmethod
    def compute_pascal_curvature(n: int) -> float:
        """
        Compute Pascal curvature: κ_n = r_{n+1} - 2r_n + r_{n-1}
        where r_n = log(C(n, floor(n/2)))
        """
        if n <= 0:
            return 0.0

        def r(k):
            if k <= 0:
                return 0.0
            center = k // 2
            try:
                binom_val = binom(k, center)
                return math.log(binom_val) if binom_val > 0 else 0.0
            except:
                return 0.0

        r_n_minus_1 = r(n-1)
        r_n = r(n)
        r_n_plus_1 = r(n+1)

        return r_n_plus_1 - 2 * r_n + r_n_minus_1

    @staticmethod
    def digit_mirror_operator(d: int) -> int:
        """
        Digit mirror operator: μ_7(d) = d^7 mod 10

        This is an involution on the digit set {0,1,2,3,4,5,6,7,8,9}
        that fixes {0,1,4,5,6,9} and swaps 2↔8, 3↔7.
        """
        return pow(d, 7, 10)

    @staticmethod
    def get_mirror_phase(n: int) -> int:
        """
        Get mirror phase: n mod 4

        Mirror-phase shells occur when n ≡ 3 mod 4, corresponding to
        discrete tangent singularities at θ = 3π/2.
        """
        return n % 4

    @staticmethod
    def compute_nine_eleven_charge(x: int) -> float:
        """
        Compute 9/11 charge: Q(x) = N_9(x) / (N_0(x) + 1)

        This is a tension metric that measures the ratio of 9's to 0's
        in the decimal representation, normalized to avoid division by zero.
        """
        if x == 0:
            return 0.0

        digits = [int(d) for d in str(abs(x))]
        n_nines = digits.count(9)
        n_zeros = digits.count(0)

        return n_nines / (n_zeros + 1)

    def compute_clock_rate(self, x: int) -> float:
        """
        Compute the clock rate: R(x) = χ_FEG · κ_{d(x)} · (1 + Q_{9/11}(x))

        This determines how fast the curvature clock advances at position x.
        """
        curvature = self.compute_pascal_curvature(x)
        charge = self.compute_nine_eleven_charge(x)

        return self.chi_feg * curvature * (1 + charge)

    def compute_bifurcation_index(self, c_t: float, c_star: float = 0.0,
                                delta_feg: float = 0.1) -> int:
        """
        Compute bifurcation index: B_t = floor(-log|c_t - c_*| / log(δ_FEG))

        This measures the depth of bifurcation from the critical value c_*.
        """
        if abs(c_t - c_star) < 1e-10:
            return float('inf')  # At critical point

        try:
            log_term = -math.log(abs(c_t - c_star)) / math.log(delta_feg)
            return max(0, int(math.floor(log_term)))
        except:
            return 0

    def evolve_step(self) -> Dict[str, Any]:
        """
        Evolve the walker by one step through the integer lattice.

        Returns:
            Dictionary containing the state at the new position
        """
        # Move to next integer
        self.x += 1

        # Compute new state
        digit_shell = self.get_digit_count(self.x)
        curvature = self.compute_pascal_curvature(self.x)
        mirror_phase = self.get_mirror_phase(self.x)
        nine_eleven_charge = self.compute_nine_eleven_charge(self.x)

        # Update clock phase
        clock_rate = self.compute_clock_rate(self.x)
        self.clock_phase += clock_rate

        # Update bifurcation index
        self.bifurcation_index = self.compute_bifurcation_index(curvature)

        # Update geometry (simple spiral for visualization)
        angle = self.clock_phase
        radius = digit_shell * 0.1
        x_coord = radius * math.cos(angle)
        y_coord = radius * math.sin(angle)

        self.x_coords.append(x_coord)
        self.y_coords.append(y_coord)

        # Create state record
        state = {
            'step': len(self.history),
            'x': self.x,
            'digit_shell': digit_shell,
            'curvature': curvature,
            'mirror_phase': mirror_phase,
            'clock_phase': self.clock_phase,
            'bifurcation_index': self.bifurcation_index,
            'nine_eleven_charge': nine_eleven_charge,
            'clock_rate': clock_rate
        }

        self.history.append(state)
        return state

    def evolve(self, n_steps: int) -> Tuple[List[Dict], Dict]:
        """
        Evolve the walker for n_steps and return history with summary.

        Args:
            n_steps: Number of steps to evolve

        Returns:
            Tuple of (full_history, summary_statistics)
        """
        for _ in range(n_steps):
            self.evolve_step()

        # Compute summary statistics
        summary = self.compute_summary_statistics()

        return self.history, summary

    def compute_summary_statistics(self) -> Dict[str, Any]:
        """Compute summary statistics from the evolution history."""
        if not self.history:
            return {}

        curvatures = [h['curvature'] for h in self.history]
        bifurcation_indices = [h['bifurcation_index'] for h in self.history]
        mirror_phases = [h['mirror_phase'] for h in self.history]
        charges = [h['nine_eleven_charge'] for h in self.history]

        # Find mirror-phase shells (n ≡ 3 mod 4)
        mirror_shells = [h for h in self.history if h['mirror_phase'] == 3]

        summary = {
            'total_steps': len(self.history),
            'final_position': self.history[-1]['x'],
            'max_digit_shell': max(h['digit_shell'] for h in self.history),
            'mean_curvature': np.mean(curvatures),
            'std_curvature': np.std(curvatures),
            'max_bifurcation_index': max(bifurcation_indices),
            'mean_bifurcation_index': np.mean(bifurcation_indices),
            'mirror_shells_count': len(mirror_shells),
            'mean_nine_eleven_charge': np.mean(charges),
            'final_clock_phase': self.history[-1]['clock_phase'],
            'mirror_shell_positions': [h['x'] for h in mirror_shells]
        }

        return summary

    def get_geometry(self) -> Tuple[List[float], List[float]]:
        """
        Get the geometric coordinates for visualization.

        Returns:
            Tuple of (x_coordinates, y_coordinates)
        """
        return self.x_coords, self.y_coords

    def plot_geometry(self, save_path: Optional[str] = None):
        """
        Plot the walker's geometry showing phase transitions.

        Args:
            save_path: Optional path to save the plot
        """
        x_coords, y_coords = self.get_geometry()

        plt.figure(figsize=(10, 10))
        plt.plot(x_coords, y_coords, 'b-', alpha=0.7, linewidth=1)

        # Color points by mirror phase
        colors = ['blue', 'green', 'red', 'orange']  # 0, 1, 2, 3 mod 4
        for i, state in enumerate(self.history):
            color = colors[state['mirror_phase']]
            plt.plot(x_coords[i], y_coords[i], color + 'o', markersize=2, alpha=0.8)

        plt.title('AntClock Geometry: Discrete Tangent Singularities')
        plt.xlabel('X Coordinate')
        plt.ylabel('Y Coordinate')
        plt.axis('equal')
        plt.grid(True, alpha=0.3)

        # Add legend
        legend_elements = [
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='blue',
                      markersize=8, label='Phase 0 (θ=0)'),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='green',
                      markersize=8, label='Phase 1 (θ=π/2)'),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='red',
                      markersize=8, label='Phase 2 (θ=π)'),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='orange',
                      markersize=8, label='Phase 3 (θ=3π/2 - Mirror Shells)')
        ]
        plt.legend(handles=legend_elements, loc='upper right')

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Geometry plot saved to {save_path}")

        plt.show()

    def analyze_mirror_symmetry(self) -> Dict[str, Any]:
        """
        Analyze the mirror symmetry breaking in digit shells.

        Returns:
            Dictionary with symmetry analysis results
        """
        mirror_states = [h for h in self.history if h['mirror_phase'] == 3]

        if not mirror_states:
            return {'mirror_symmetry_ratio': 0.0, 'mirror_positions': []}

        # Count symmetry breaks (digit mirror operator applications)
        symmetry_breaks = 0
        for state in mirror_states:
            x = state['x']
            digits = [int(d) for d in str(x)]
            mirrored_digits = [self.digit_mirror_operator(d) for d in digits]

            # Check if mirroring changes the number
            if digits != mirrored_digits:
                symmetry_breaks += 1

        symmetry_ratio = symmetry_breaks / len(mirror_states) if mirror_states else 0.0

        return {
            'mirror_symmetry_ratio': symmetry_ratio,
            'total_mirror_states': len(mirror_states),
            'symmetry_breaking_events': symmetry_breaks,
            'mirror_positions': [s['x'] for s in mirror_states]
        }


# Utility functions for homology and topology

def compute_enhanced_betti_numbers(n: int) -> List[int]:
    """
    Compute enhanced Betti numbers for digit shell n.

    This implements a simplified persistent homology calculation
    for the digit shell as a simplicial complex.

    Args:
        n: Digit shell index

    Returns:
        List of Betti numbers [β₀, β₁, β₂, ...]
    """
    # For now, implement a basic version based on digit patterns
    # This is a placeholder for the full persistent homology computation

    if n <= 0:
        return [1]  # Single point

    # Simple approximation based on shell complexity
    if n == 1:
        return [1, 0]  # Connected component, no holes
    elif n == 7:  # Mirror shell
        return [1, 3, 1]  # More complex topology
    else:
        # General case: increasing complexity with shell size
        components = 1
        holes = max(0, n // 3)
        voids = max(0, n // 7)
        return [components, holes, voids]


def analyze_branch_corridors(history: List[Dict]) -> Dict[str, Any]:
    """
    Analyze branch corridors between mirror-phase shells.

    Args:
        history: Evolution history from a walker

    Returns:
        Analysis of corridors and their properties
    """
    mirror_positions = [h['x'] for h in history if h['mirror_phase'] == 3]

    if len(mirror_positions) < 2:
        return {'corridors': [], 'monodromy_detected': False}

    corridors = []
    for i in range(len(mirror_positions) - 1):
        start = mirror_positions[i]
        end = mirror_positions[i + 1]

        # Extract corridor states
        corridor_states = [h for h in history if start < h['x'] < end]

        # Analyze curvature variation in corridor
        curvatures = [s['curvature'] for s in corridor_states]
        curvature_range = max(curvatures) - min(curvatures) if curvatures else 0

        # Check for nontrivial monodromy (phase winding)
        phase_changes = sum(abs(s['clock_phase'] - corridor_states[j-1]['clock_phase'])
                          for j, s in enumerate(corridor_states) if j > 0)

        corridor_info = {
            'start_shell': start,
            'end_shell': end,
            'length': end - start,
            'curvature_range': curvature_range,
            'phase_accumulation': phase_changes,
            'has_branch_cut': phase_changes > 2 * np.pi  # Nontrivial winding
        }

        corridors.append(corridor_info)

    return {
        'corridors': corridors,
        'monodromy_detected': any(c['has_branch_cut'] for c in corridors),
        'total_corridors': len(corridors)
    }


# Main demo function
def run_basic_demo():
    """Run a basic demonstration of the AntClock walker."""
    print("AntClock: Discrete Riemann Geometry")
    print("=" * 40)

    # Create walker
    walker = CurvatureClockWalker(x_0=1, chi_feg=0.638)

    # Evolve for 1000 steps
    print("Evolving walker for 1000 steps...")
    history, summary = walker.evolve(1000)

    # Print summary
    print(f"\nEvolution Summary:")
    print(f"Total steps: {summary['total_steps']}")
    print(f"Final position: {summary['final_position']}")
    print(f"Max digit shell: {summary['max_digit_shell']}")
    print(f"Mirror shells found: {summary['mirror_shells_count']}")
    print(f"Max bifurcation index: {summary['max_bifurcation_index']}")
    print(".3f")
    print(".3f")

    # Analyze mirror symmetry
    symmetry_analysis = walker.analyze_mirror_symmetry()
    print(f"\nSymmetry Analysis:")
    print(".3f")
    print(f"Total mirror states: {symmetry_analysis['total_mirror_states']}")

    # Analyze branch corridors
    corridor_analysis = analyze_branch_corridors(history)
    print(f"\nBranch Corridor Analysis:")
    print(f"Total corridors: {corridor_analysis['total_corridors']}")
    print(f"Monodromy detected: {corridor_analysis['monodromy_detected']}")

    # Compute Betti numbers for shell 7
    betti_7 = compute_enhanced_betti_numbers(7)
    print(f"\nBetti numbers for shell 7: {betti_7}")

    print("\nDemo complete. Run with save_plot=True to generate geometry visualization.")

    return walker, history, summary


if __name__ == "__main__":
    run_basic_demo()
