import sys
import traceback
sys.path.append('src/services/scanner_core')
import main

try:
    print("Running advanced scan directly...")
    main.advanced_scan("127.0.0.1")
except Exception as e:
    print("--- CRASH CAUGHT ---")
    traceback.print_exc()
