"""T024 — git clone --progress parser (FR-011, SC-002).

Maps stderr lines to a coarse overall percent (0–100) across the clone phases so
the board shows a smooth, monotonic-ish progress bar.
"""

from __future__ import annotations

import pytest

from specdeck_gateway.services.git_ops import parse_progress_line


@pytest.mark.parametrize(
    ("line", "phase"),
    [
        ("remote: Counting objects: 100% (10/10), done.", "Counting objects"),
        ("remote: Compressing objects:  50% (4/8)", "Compressing objects"),
        ("Receiving objects:  50% (5/10), 1.00 KiB | 1.00 MiB/s", "Receiving objects"),
        ("Resolving deltas: 100% (2/2), done.", "Resolving deltas"),
    ],
)
def test_parses_phase(line: str, phase: str) -> None:
    result = parse_progress_line(line)
    assert result is not None
    assert result[0] == phase


def test_non_progress_lines_return_none() -> None:
    assert parse_progress_line("Cloning into 'dest'...") is None
    assert parse_progress_line("") is None
    assert parse_progress_line("remote: Enumerating objects: 10, done.") is None


def test_progress_is_monotonic_across_phases() -> None:
    lines = [
        "remote: Counting objects: 100% (10/10), done.",
        "remote: Compressing objects: 100% (8/8), done.",
        "Receiving objects: 100% (10/10), done.",
        "Resolving deltas: 100% (2/2), done.",
    ]
    percents = [parse_progress_line(x)[1] for x in lines]
    assert percents == sorted(percents)  # non-decreasing
    assert percents[0] <= 10
    assert percents[-1] == 100
    assert all(0 <= p <= 100 for p in percents)


def test_receiving_midpoint_within_phase_band() -> None:
    _, pct = parse_progress_line("Receiving objects:  50% (5/10)")
    # Receiving band is 25..90 → 50% ≈ 57
    assert 25 < pct < 90
