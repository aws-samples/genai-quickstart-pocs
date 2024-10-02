from typing import Any, Dict, List

import numpy as np

# required modules

# distance metrics
INMEMORYDB_DISTANCE_METRICS: List[str] = ["COSINE", "IP", "L2"]

# supported vector datatypes
INMEMORYDB_VECTOR_DTYPE_MAP: Dict[str, Any] = {
    "FLOAT32": np.float32,
    "FLOAT64": np.float64,
}

INMEMORYDB_TAG_SEPARATOR = ","
