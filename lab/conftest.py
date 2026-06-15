import sys
from pathlib import Path

# Put the lab/ directory on sys.path so `import econwar_engine` resolves.
sys.path.insert(0, str(Path(__file__).resolve().parent))
