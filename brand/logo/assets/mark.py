"""Kitsune: a low-poly fox head made of seven flat-shaded facets.

The geometry is the one of the original component (a 100 x 100 view box), scaled to the 256 x 256
canvas of the logo scripts. Each facet has a tone (light, mid, dark, accent): the full-color versions
take the colors from `mark_tones` in the logo spec, the one-color versions draw every facet in one
color at the opacity written here.
"""
K = 2.56

FACETS = [
    ("ear-left", [(22, 22), (27, 46), (41, 40)], "light", 1.0),
    ("ear-right", [(78, 22), (73, 46), (59, 40)], "dark", 0.55),
    ("forehead", [(41, 40), (50, 30), (59, 40), (50, 55)], "mid", 0.8),
    ("cheek-left", [(27, 46), (41, 40), (50, 55), (38, 78), (24, 60)], "mid", 0.8),
    ("cheek-right", [(73, 46), (59, 40), (50, 55), (62, 78), (76, 60)], "dark", 0.55),
    ("muzzle", [(50, 55), (38, 78), (50, 86), (62, 78)], "light", 1.0),
    ("nose", [(46, 80), (54, 80), (50, 88)], "accent", 0.7),
]


def path(points):
    return "M " + " L ".join(f"{x * K:.2f},{y * K:.2f}" for x, y in points) + " Z"


def mark():
    return {
        "facets": [{"d": path(p), "tone": tone, "opacity": op} for _, p, tone, op in FACETS],
    }
