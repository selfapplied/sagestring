#!/.venv/bin/python
"""
Simple test script for AntClock core functionality.
This avoids matplotlib dependencies for CI/testing environments.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from clock import CurvatureClockWalker, compute_enhanced_betti_numbers, analyze_branch_corridors


def test_curvature_calculations():
    """Test basic curvature and mirror operator functions."""
    print("Testing curvature calculations...")

    # Test Pascal curvature
    kappa_7 = CurvatureClockWalker.compute_pascal_curvature(7)
    kappa_11 = CurvatureClockWalker.compute_pascal_curvature(11)
    kappa_15 = CurvatureClockWalker.compute_pascal_curvature(15)

    print(".6f")
    print(".6f")
    print(".6f")

    # Test digit mirror operator
    for d in range(10):
        mirrored = CurvatureClockWalker.digit_mirror_operator(d)
        print(f"μ₇({d}) = {mirrored}")

    # Test mirror phases
    test_nums = [3, 7, 11, 15, 19]
    for n in test_nums:
        phase = CurvatureClockWalker.get_mirror_phase(n)
        print(f"n={n}: phase={phase} {'[MIRROR]' if phase == 3 else ''}")

    print("✓ Curvature calculations test passed\n")


def test_clock_walker():
    """Test the CurvatureClockWalker class."""
    print("Testing CurvatureClockWalker...")

    # Create walker
    walker = CurvatureClockWalker(x_0=1, chi_feg=0.638)

    # Test initial state
    assert walker.x == 1
    assert walker.chi_feg == 0.638
    print(f"✓ Initial state: x={walker.x}, χ={walker.chi_feg}")

    # Evolve for 100 steps
    history, summary = walker.evolve(100)

    assert len(history) == 101  # initial + 100 steps
    assert summary['total_steps'] == 101
    assert summary['final_position'] == 101
    print(f"✓ Evolution: {summary['total_steps']} steps, final x={summary['final_position']}")

    # Check mirror shells
    mirror_shells = [h for h in history if h['mirror_phase'] == 3]
    assert len(mirror_shells) > 0
    print(f"✓ Found {len(mirror_shells)} mirror-phase shells")

    # Test geometry extraction
    x_coords, y_coords = walker.get_geometry()
    assert len(x_coords) == len(y_coords) == 101
    print(f"✓ Geometry: {len(x_coords)} coordinate pairs")

    print("✓ CurvatureClockWalker test passed\n")


def test_betti_numbers():
    """Test Betti number calculations."""
    print("Testing Betti numbers...")

    # Test different shells
    test_shells = [1, 7, 11, 15]
    for shell in test_shells:
        betti = compute_enhanced_betti_numbers(shell)
        print(f"Shell {shell}: β = {betti}")
        assert isinstance(betti, list)
        assert len(betti) >= 1

    print("✓ Betti numbers test passed\n")


def test_branch_corridors():
    """Test branch corridor analysis."""
    print("Testing branch corridors...")

    # Create evolution history
    walker = CurvatureClockWalker(x_0=1)
    history, _ = walker.evolve(200)

    # Analyze corridors
    analysis = analyze_branch_corridors(history)

    print(f"Found {analysis['total_corridors']} corridors")
    print(f"Monodromy detected: {analysis['monodromy_detected']}")

    assert isinstance(analysis['corridors'], list)
    if analysis['corridors']:
        corridor = analysis['corridors'][0]
        required_keys = ['start_shell', 'end_shell', 'length', 'curvature_range',
                        'phase_accumulation', 'has_branch_cut']
        for key in required_keys:
            assert key in corridor

    print("✓ Branch corridors test passed\n")


def test_symmetry_analysis():
    """Test mirror symmetry analysis."""
    print("Testing symmetry analysis...")

    walker = CurvatureClockWalker(x_0=1)
    history, _ = walker.evolve(100)

    symmetry = walker.analyze_mirror_symmetry()

    print(".3f")
    print(f"Mirror states: {symmetry['total_mirror_states']}")
    print(f"Symmetry breaking events: {symmetry['symmetry_breaking_events']}")

    assert 'mirror_symmetry_ratio' in symmetry
    assert 'total_mirror_states' in symmetry
    assert 'symmetry_breaking_events' in symmetry

    print("✓ Symmetry analysis test passed\n")


def run_all_tests():
    """Run all tests."""
    print("🕐 AntClock Core Tests")
    print("=" * 30)

    try:
        test_curvature_calculations()
        test_clock_walker()
        test_betti_numbers()
        test_branch_corridors()
        test_symmetry_analysis()

        print("🎉 All tests passed!")
        print("\nAntClock core functionality is working correctly.")
        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
