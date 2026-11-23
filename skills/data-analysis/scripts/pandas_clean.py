"""Safe snippet for basic pandas cleaning; read/parse failures exit with code 2."""
import sys

import pandas as pd

# Load (adjust path and kwargs as needed)
try:
    df = pd.read_csv("data.csv")  # or read_json, read_excel
except (OSError, pd.errors.ParserError, UnicodeError):
    print("Could not read data.csv. Check that the file exists, is readable, and is a valid CSV.", file=sys.stderr)
    raise SystemExit(2)
print("df_shape", df.shape)
print("df_dtypes", df.dtypes)

# Drop fully null columns
df = df.dropna(axis=1, how="all")
print("df_shape_after_drop_all_null_cols", df.shape)

# Fill or drop nulls in key columns (customise columns)
# df = df.dropna(subset=["required_col"])
# df["optional_col"] = df["optional_col"].fillna(0)

# Normalise column names (optional)
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
print("df_columns", list(df.columns))

# Deduplicate (optional)
before = len(df)
df = df.drop_duplicates()
print("rows_dropped_duplicates", before - len(df))

# Sample output
print("df_head", df.head())
